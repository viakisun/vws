import { DatabaseService } from '$lib/database/connection'
import type {
  CreateThreadInput,
  CreateThreadReplyInput,
  Thread,
  ThreadFilters,
  ThreadReply,
  ThreadReplyWithAuthor,
  ThreadState,
  ThreadWithDetails,
  UpdateThreadInput,
} from '../types'
import { THREAD_STATE_TRANSITIONS } from '../types'
import { activityLogService } from './activity-log.service'
import { notificationService } from './notification.service'

export class ThreadService {
  /**
   * Create a new thread
   */
  async create(input: CreateThreadInput, actorId: string): Promise<Thread> {
    const result = await DatabaseService.query(
      `INSERT INTO planner_threads (
        initiative_id, title, body, shape, owner_id, external_links, mentions, state
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'proposed')
      RETURNING id, initiative_id, title, body, shape, state, owner_id, external_links, 
                resolution, resolved_at::text, deleted_at::text, created_at::text, 
                updated_at::text, mentions`,
      [
        input.initiative_id,
        input.title,
        input.body || null,
        input.shape,
        input.owner_id,
        JSON.stringify(input.external_links || []),
        JSON.stringify(input.mentions || []),
      ],
    )

    const thread = result.rows[0]
    if (!thread) throw new Error('Failed to create thread')

    // Add contributors
    if (input.contributor_ids && input.contributor_ids.length > 0) {
      for (const contributorId of input.contributor_ids) {
        await this.addContributor(thread.id, contributorId, actorId)
      }
    }

    // Create notifications for mentioned users
    if (input.mentions && input.mentions.length > 0) {
      // Get actor name
      const actorResult = await DatabaseService.query(
        `SELECT first_name, last_name FROM employees WHERE id = $1`,
        [actorId],
      )
      const actor = actorResult.rows[0]
      const actorName = actor ? `${actor.last_name}${actor.first_name}` : '알 수 없는 사용자'

      // Create notification for each mentioned user
      for (const mentionedUserId of input.mentions) {
        // Don't notify yourself
        if (mentionedUserId !== actorId) {
          await notificationService.createMentionNotification({
            mentionedUserId,
            actorName,
            threadId: thread.id,
            threadTitle: thread.title,
            isReply: false,
          })
        }
      }
    }

    await activityLogService.log({
      entity_type: 'thread',
      entity_id: thread.id,
      action: 'created',
      actor_id: actorId,
      new_value: thread,
    })

    return thread
  }

  /**
   * Get thread by ID
   */
  async getById(id: string): Promise<Thread | null> {
    const result = await DatabaseService.query(
      `SELECT * FROM planner_threads
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    )
    return result.rows[0] || null
  }

  /**
   * Get thread with details
   */
  async getByIdWithDetails(id: string): Promise<ThreadWithDetails | null> {
    const result = await DatabaseService.query(
      `SELECT
        t.*,
        i.title as initiative_title,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email,
          'department', e.department,
          'position', e.position
        ) as owner,
        (
          SELECT json_agg(
            json_build_object(
              'id', e2.id,
              'first_name', e2.first_name,
              'last_name', e2.last_name,
              'email', e2.email
            )
          )
          FROM planner_thread_contributors tc
          JOIN employees e2 ON e2.id = tc.employee_id
          WHERE tc.thread_id = t.id
        ) as contributors,
        (SELECT COUNT(*) FROM planner_thread_replies WHERE thread_id = t.id) as reply_count,
        (
          SELECT json_build_object(
            'id', tr.id,
            'content', tr.content,
            'created_at', tr.created_at,
            'author', json_build_object(
              'id', e3.id,
              'first_name', e3.first_name,
              'last_name', e3.last_name
            )
          )
          FROM planner_thread_replies tr
          JOIN employees e3 ON e3.id = tr.author_id
          WHERE tr.thread_id = t.id
          ORDER BY tr.created_at DESC
          LIMIT 1
        ) as latest_reply
      FROM planner_threads t
      JOIN planner_initiatives i ON i.id = t.initiative_id
      JOIN employees e ON e.id = t.owner_id
      WHERE t.id = $1 AND t.deleted_at IS NULL`,
      [id],
    )

    const thread = result.rows[0]
    if (!thread) return null

    // Ensure arrays are properly initialized
    if (!thread.contributors) thread.contributors = []

    return thread
  }

  /**
   * List threads with filters
   */
  async list(filters?: ThreadFilters): Promise<ThreadWithDetails[]> {
    let query = `
      SELECT
        t.*,
        i.title as initiative_title,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email
        ) as owner,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', e2.id,
                'first_name', e2.first_name,
                'last_name', e2.last_name,
                'email', e2.email
              )
            )
            FROM planner_thread_contributors tc
            JOIN employees e2 ON e2.id = tc.employee_id
            WHERE tc.thread_id = t.id
          ),
          '[]'::json
        ) as contributors,
        (SELECT COUNT(*) FROM planner_thread_replies WHERE thread_id = t.id) as reply_count
      FROM planner_threads t
      JOIN planner_initiatives i ON i.id = t.initiative_id
      JOIN employees e ON e.id = t.owner_id
      WHERE t.deleted_at IS NULL
    `

    const params: unknown[] = []
    let paramCount = 0

    if (filters?.initiative_id) {
      paramCount++
      query += ` AND t.initiative_id = $${paramCount}`
      params.push(filters.initiative_id)
    }

    if (filters?.owner_id) {
      paramCount++
      query += ` AND t.owner_id = $${paramCount}`
      params.push(filters.owner_id)
    }

    if (filters?.contributor_id) {
      paramCount++
      query += ` AND EXISTS (
        SELECT 1 FROM planner_thread_contributors
        WHERE thread_id = t.id AND employee_id = $${paramCount}
      )`
      params.push(filters.contributor_id)
    }

    if (filters?.state) {
      paramCount++
      if (Array.isArray(filters.state)) {
        query += ` AND t.state = ANY($${paramCount})`
        params.push(filters.state)
      } else {
        query += ` AND t.state = $${paramCount}`
        params.push(filters.state)
      }
    }

    if (filters?.shape) {
      paramCount++
      if (Array.isArray(filters.shape)) {
        query += ` AND t.shape = ANY($${paramCount})`
        params.push(filters.shape)
      } else {
        query += ` AND t.shape = $${paramCount}`
        params.push(filters.shape)
      }
    }

    if (filters?.search) {
      paramCount++
      query += ` AND (
        t.title ILIKE $${paramCount} OR
        t.body ILIKE $${paramCount}
      )`
      params.push(`%${filters.search}%`)
    }

    // Order by priority: blocks first, then by updated_at
    query += ` ORDER BY
      CASE t.shape
        WHEN 'block' THEN 1
        WHEN 'question' THEN 2
        WHEN 'decision' THEN 3
        WHEN 'build' THEN 4
        WHEN 'research' THEN 5
      END,
      t.updated_at DESC
    `

    if (filters?.limit) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      paramCount++
      query += ` OFFSET $${paramCount}`
      params.push(filters.offset)
    }

    const result = await DatabaseService.query(query, params)
    return result.rows
  }

  /**
   * Update thread
   */
  async update(id: string, input: UpdateThreadInput, actorId: string): Promise<Thread | null> {
    const current = await this.getById(id)
    if (!current) return null

    const updates: string[] = []
    const params: unknown[] = []
    let paramCount = 0

    if (input.title !== undefined) {
      paramCount++
      updates.push(`title = $${paramCount}`)
      params.push(input.title)
    }

    if (input.body !== undefined) {
      paramCount++
      updates.push(`body = $${paramCount}`)
      params.push(input.body || null)
    }

    if (input.shape !== undefined) {
      paramCount++
      updates.push(`shape = $${paramCount}`)
      params.push(input.shape)
    }

    if (input.owner_id !== undefined) {
      paramCount++
      updates.push(`owner_id = $${paramCount}`)
      params.push(input.owner_id)
    }

    if (input.external_links !== undefined) {
      paramCount++
      updates.push(`external_links = $${paramCount}`)
      params.push(JSON.stringify(input.external_links))
    }

    if (input.resolution !== undefined) {
      paramCount++
      updates.push(`resolution = $${paramCount}`)
      params.push(input.resolution)
    }

    if (updates.length === 0) return current

    paramCount++
    params.push(id)

    const result = await DatabaseService.query(
      `UPDATE planner_threads
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND deleted_at IS NULL
       RETURNING id, initiative_id, title, body, shape, state, owner_id, external_links, 
                 resolution, resolved_at::text, deleted_at::text, created_at::text, 
                 updated_at::text, mentions`,
      params,
    )

    const updated = result.rows[0]
    if (updated) {
      await activityLogService.log({
        entity_type: 'thread',
        entity_id: id,
        action: 'updated',
        actor_id: actorId,
        old_value: current as unknown as Record<string, unknown>,
        new_value: updated as unknown as Record<string, unknown>,
      })
    }

    return updated || null
  }

  /**
   * Change thread state with validation
   */
  async changeState(
    id: string,
    newState: ThreadState,
    actorId: string,
    resolution?: string,
  ): Promise<Thread | null> {
    const current = await this.getById(id)
    if (!current) return null

    // Validate state transition
    const allowedTransitions = THREAD_STATE_TRANSITIONS[current.state]
    if (!allowedTransitions.allowed.includes(newState)) {
      throw new Error(
        `Cannot transition from ${current.state} to ${newState}. Allowed: ${allowedTransitions.allowed.join(', ')}`,
      )
    }

    // Validate requirements
    if (newState === 'resolved' && !resolution && !current.resolution) {
      throw new Error('Cannot resolve thread without resolution notes')
    }

    const result = await DatabaseService.query(
      `UPDATE planner_threads
       SET state = $1, resolution = COALESCE($2, resolution)
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING id, initiative_id, title, body, shape, state, owner_id, external_links, 
                 resolution, resolved_at::text, deleted_at::text, created_at::text, 
                 updated_at::text, mentions`,
      [newState, resolution || null, id],
    )

    const updated = result.rows[0]
    if (updated) {
      await activityLogService.log({
        entity_type: 'thread',
        entity_id: id,
        action: 'state_changed',
        actor_id: actorId,
        old_value: { state: current.state },
        new_value: { state: newState, resolution },
      })
    }

    return updated || null
  }

  /**
   * Add contributor to thread
   */
  async addContributor(threadId: string, employeeId: string, actorId: string): Promise<void> {
    await DatabaseService.query(
      `INSERT INTO planner_thread_contributors (thread_id, employee_id)
       VALUES ($1, $2)
       ON CONFLICT (thread_id, employee_id) DO NOTHING`,
      [threadId, employeeId],
    )

    await activityLogService.log({
      entity_type: 'thread',
      entity_id: threadId,
      action: 'contributor_added',
      actor_id: actorId,
      metadata: { employee_id: employeeId },
    })
  }

  /**
   * Remove contributor from thread
   */
  async removeContributor(threadId: string, employeeId: string, actorId: string): Promise<void> {
    await DatabaseService.query(
      `DELETE FROM planner_thread_contributors
       WHERE thread_id = $1 AND employee_id = $2`,
      [threadId, employeeId],
    )

    await activityLogService.log({
      entity_type: 'thread',
      entity_id: threadId,
      action: 'contributor_removed',
      actor_id: actorId,
      metadata: { employee_id: employeeId },
    })
  }

  /**
   * Create thread reply
   */
  async createReply(input: CreateThreadReplyInput, actorId: string): Promise<ThreadReply> {
    const result = await DatabaseService.query(
      `INSERT INTO planner_thread_replies (
        thread_id, author_id, content, mentions
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, thread_id, author_id, content, mentions, created_at::text, updated_at::text`,
      [input.thread_id, input.author_id, input.content, JSON.stringify(input.mentions || [])],
    )

    const reply = result.rows[0]
    if (!reply) throw new Error('Failed to create thread reply')

    // Update thread's updated_at timestamp
    await DatabaseService.query(
      `UPDATE planner_threads
       SET updated_at = NOW()
       WHERE id = $1`,
      [input.thread_id],
    )

    // Create notifications for mentioned users
    if (input.mentions && input.mentions.length > 0) {
      // Get thread title and actor name
      const threadResult = await DatabaseService.query(
        `SELECT title FROM planner_threads WHERE id = $1`,
        [input.thread_id],
      )
      const thread = threadResult.rows[0]

      const actorResult = await DatabaseService.query(
        `SELECT first_name, last_name FROM employees WHERE id = $1`,
        [actorId],
      )
      const actor = actorResult.rows[0]
      const actorName = actor ? `${actor.last_name}${actor.first_name}` : '알 수 없는 사용자'

      // Create notification for each mentioned user
      for (const mentionedUserId of input.mentions) {
        // Don't notify yourself
        if (mentionedUserId !== actorId) {
          await notificationService.createMentionNotification({
            mentionedUserId,
            actorName,
            threadId: input.thread_id,
            threadTitle: thread?.title || '스레드',
            isReply: true,
          })
        }
      }
    }

    await activityLogService.log({
      entity_type: 'thread',
      entity_id: input.thread_id,
      action: 'reply_added',
      actor_id: actorId,
      metadata: { reply_id: reply.id },
    })

    return reply
  }

  /**
   * Get thread replies
   */
  async getReplies(threadId: string, limit = 50): Promise<ThreadReplyWithAuthor[]> {
    const result = await DatabaseService.query(
      `SELECT
        tr.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email
        ) as author
      FROM planner_thread_replies tr
      JOIN employees e ON e.id = tr.author_id
      WHERE tr.thread_id = $1
      ORDER BY tr.created_at ASC
      LIMIT $2`,
      [threadId, limit],
    )

    const replies = result.rows

    // Load mentioned users for each reply
    for (const reply of replies) {
      if (reply.mentions && Array.isArray(reply.mentions) && reply.mentions.length > 0) {
        const mentionedUsersResult = await DatabaseService.query(
          `SELECT id, first_name, last_name, email
           FROM employees
           WHERE id = ANY($1)`,
          [reply.mentions],
        )
        ;(reply as any).mentioned_users = mentionedUsersResult.rows
      } else {
        ;(reply as any).mentioned_users = []
      }
    }

    return replies
  }

  /**
   * Soft delete thread
   */
  async delete(id: string, actorId: string): Promise<boolean> {
    const current = await this.getById(id)
    if (!current) return false

    await DatabaseService.query(
      `UPDATE planner_threads
       SET deleted_at = NOW()
       WHERE id = $1`,
      [id],
    )

    await activityLogService.log({
      entity_type: 'thread',
      entity_id: id,
      action: 'deleted',
      actor_id: actorId,
      old_value: current as unknown as Record<string, unknown>,
    })

    return true
  }

  /**
   * Get stale active threads (for notifications)
   */
  async getStaleThreads(daysThreshold = 14): Promise<ThreadWithDetails[]> {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

    return this.list({
      state: 'active',
    })
  }

  /**
   * Auto-archive resolved threads older than threshold
   */
  async autoArchiveOldResolved(daysThreshold = 30): Promise<number> {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

    const result = await DatabaseService.query(
      `UPDATE planner_threads
       SET state = 'archived'
       WHERE state = 'resolved'
         AND resolved_at < $1
         AND deleted_at IS NULL
       RETURNING id`,
      [thresholdDate.toISOString()],
    )

    return result.rowCount || 0
  }
}

export const threadService = new ThreadService()
