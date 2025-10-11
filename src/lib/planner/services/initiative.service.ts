import { DatabaseService } from '$lib/database/connection'
import type {
  CreateInitiativeInput,
  Initiative,
  InitiativeFilters,
  InitiativeStage,
  InitiativeStatus,
  InitiativeWithOwner,
  UpdateInitiativeInput,
} from '../types'
import { INITIATIVE_STATUS_TRANSITIONS } from '../types'
import { activityLogService } from './activity-log.service'

export class InitiativeService {
  /**
   * Create a new initiative
   */
  async create(input: CreateInitiativeInput, actorId: string): Promise<Initiative> {
    const result = await DatabaseService.query(
      `INSERT INTO planner_initiatives (
        title, intent, success_criteria, owner_id, product_id, milestone_id, formation_id, horizon, context_links, stage, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'shaping', 'active')
      RETURNING 
        id, title, intent, success_criteria, owner_id, formation_id, horizon, 
        context_links, pause_reason, abandonment_reason, shipped_notes, 
        deleted_at::text, created_at::text, updated_at::text, product_id, 
        milestone_id, stage, status`,
      [
        input.title,
        input.intent,
        input.success_criteria || [],
        input.owner_id,
        input.product_id || null,
        input.milestone_id || null,
        input.formation_id || null,
        input.horizon || null,
        JSON.stringify(input.context_links || []),
      ],
    )

    const initiative = result.rows[0]
    if (!initiative) throw new Error('Failed to create initiative')

    // Log activity
    await activityLogService.log({
      entity_type: 'initiative',
      entity_id: initiative.id,
      action: 'created',
      actor_id: actorId,
      new_value: initiative,
    })

    return initiative
  }

  /**
   * Get initiative by ID
   */
  async getById(id: string): Promise<Initiative | null> {
    const result = await DatabaseService.query(
      `SELECT * FROM planner_initiatives
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    )
    return result.rows[0] || null
  }

  /**
   * Get initiative with owner and thread counts
   */
  async getByIdWithDetails(id: string): Promise<InitiativeWithOwner | null> {
    const result = await DatabaseService.query(
      `SELECT
        i.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email,
          'department', e.department,
          'position', e.position
        ) as owner,
        CASE WHEN p.id IS NOT NULL THEN
          json_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description
          )
        ELSE NULL END as product,
        CASE WHEN f.id IS NOT NULL THEN
          json_build_object(
            'id', f.id,
            'name', f.name,
            'description', f.description,
            'cadence_type', f.cadence_type,
            'cadence_anchor_time', f.cadence_anchor_time,
            'energy_state', f.energy_state,
            'created_at', f.created_at,
            'updated_at', f.updated_at
          )
        ELSE NULL END as formation,
        CASE WHEN m.id IS NOT NULL THEN
          json_build_object(
            'id', m.id,
            'name', m.name,
            'description', m.description,
            'target_date', m.target_date,
            'status', m.status
          )
        ELSE NULL END as milestone,
        json_build_object(
          'total', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND deleted_at IS NULL),
          'blocks', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND shape = 'block' AND state = 'active' AND deleted_at IS NULL),
          'questions', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND shape = 'question' AND state = 'active' AND deleted_at IS NULL),
          'decisions', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND shape = 'decision' AND state = 'active' AND deleted_at IS NULL),
          'builds', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND shape = 'build' AND state = 'active' AND deleted_at IS NULL),
          'research', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND shape = 'research' AND state = 'active' AND deleted_at IS NULL),
          'active', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND state = 'active' AND deleted_at IS NULL),
          'resolved', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND state = 'resolved' AND deleted_at IS NULL)
        ) as thread_counts
      FROM planner_initiatives i
      JOIN employees e ON e.id = i.owner_id
      LEFT JOIN planner_products p ON p.id = i.product_id AND p.deleted_at IS NULL
      LEFT JOIN planner_formations f ON f.id = i.formation_id AND f.deleted_at IS NULL
      LEFT JOIN planner_milestones m ON m.id = i.milestone_id AND m.deleted_at IS NULL
      WHERE i.id = $1 AND i.deleted_at IS NULL`,
      [id],
    )

    return result.rows[0] || null
  }

  /**
   * List initiatives with filters
   */
  async list(filters?: InitiativeFilters): Promise<InitiativeWithOwner[]> {
    let query = `
      SELECT
        i.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email,
          'department', e.department,
          'position', e.position
        ) as owner,
        CASE WHEN p.id IS NOT NULL THEN
          json_build_object(
            'id', p.id,
            'name', p.name,
            'code', p.code,
            'description', p.description
          )
        ELSE NULL END as product,
        CASE WHEN f.id IS NOT NULL THEN
          json_build_object(
            'id', f.id,
            'name', f.name,
            'description', f.description,
            'cadence_type', f.cadence_type,
            'cadence_anchor_time', f.cadence_anchor_time,
            'energy_state', f.energy_state,
            'created_at', f.created_at,
            'updated_at', f.updated_at
          )
        ELSE NULL END as formation,
        CASE WHEN m.id IS NOT NULL THEN
          json_build_object(
            'id', m.id,
            'name', m.name,
            'description', m.description,
            'target_date', m.target_date,
            'status', m.status
          )
        ELSE NULL END as milestone,
        json_build_object(
          'total', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND deleted_at IS NULL),
          'blocks', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND shape = 'block' AND state = 'active' AND deleted_at IS NULL),
          'questions', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND shape = 'question' AND state = 'active' AND deleted_at IS NULL),
          'decisions', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND shape = 'decision' AND state = 'active' AND deleted_at IS NULL),
          'builds', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND shape = 'build' AND state = 'active' AND deleted_at IS NULL),
          'research', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND shape = 'research' AND state = 'active' AND deleted_at IS NULL),
          'active', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND state = 'active' AND deleted_at IS NULL),
          'resolved', (SELECT COUNT(*) FROM planner_threads WHERE initiative_id = i.id AND state = 'resolved' AND deleted_at IS NULL)
        ) as thread_counts
      FROM planner_initiatives i
      JOIN employees e ON e.id = i.owner_id
      LEFT JOIN planner_formations f ON f.id = i.formation_id AND f.deleted_at IS NULL
      LEFT JOIN planner_products p ON p.id = i.product_id AND p.deleted_at IS NULL
      LEFT JOIN planner_milestones m ON m.id = i.milestone_id AND m.deleted_at IS NULL
      WHERE i.deleted_at IS NULL
    `

    const params: unknown[] = []
    let paramCount = 0

    if (filters?.stage) {
      paramCount++
      if (Array.isArray(filters.stage)) {
        query += ` AND i.stage = ANY($${paramCount})`
        params.push(filters.stage)
      } else {
        query += ` AND i.stage = $${paramCount}`
        params.push(filters.stage)
      }
    }

    if (filters?.status) {
      paramCount++
      if (Array.isArray(filters.status)) {
        query += ` AND i.status = ANY($${paramCount})`
        params.push(filters.status)
      } else {
        query += ` AND i.status = $${paramCount}`
        params.push(filters.status)
      }
    }

    if (filters?.owner_id) {
      paramCount++
      query += ` AND i.owner_id = $${paramCount}`
      params.push(filters.owner_id)
    }

    if (filters?.formation_id) {
      paramCount++
      query += ` AND i.formation_id = $${paramCount}`
      params.push(filters.formation_id)
    }

    if (filters?.product_id) {
      paramCount++
      query += ` AND i.product_id = $${paramCount}`
      params.push(filters.product_id)
    }

    if (filters?.horizon_before) {
      paramCount++
      query += ` AND i.horizon < $${paramCount}`
      params.push(filters.horizon_before)
    }

    if (filters?.horizon_after) {
      paramCount++
      query += ` AND i.horizon > $${paramCount}`
      params.push(filters.horizon_after)
    }

    if (filters?.search) {
      paramCount++
      query += ` AND (
        i.title ILIKE $${paramCount} OR
        i.intent ILIKE $${paramCount}
      )`
      params.push(`%${filters.search}%`)
    }

    // Order by horizon proximity (closest first), then by created_at
    query += ` ORDER BY
      CASE WHEN i.horizon IS NOT NULL THEN i.horizon ELSE '9999-12-31'::timestamp END ASC,
      i.created_at DESC
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
   * Update initiative
   */
  async update(
    id: string,
    input: UpdateInitiativeInput,
    actorId: string,
  ): Promise<Initiative | null> {
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

    if (input.intent !== undefined) {
      paramCount++
      updates.push(`intent = $${paramCount}`)
      params.push(input.intent)
    }

    if (input.success_criteria !== undefined) {
      paramCount++
      updates.push(`success_criteria = $${paramCount}`)
      params.push(input.success_criteria)
    }

    if (input.owner_id !== undefined) {
      paramCount++
      updates.push(`owner_id = $${paramCount}`)
      params.push(input.owner_id)
    }

    if (input.formation_id !== undefined) {
      paramCount++
      updates.push(`formation_id = $${paramCount}`)
      params.push(input.formation_id || null)
    }

    if (input.milestone_id !== undefined) {
      paramCount++
      updates.push(`milestone_id = $${paramCount}`)
      params.push(input.milestone_id || null)
    }

    if (input.horizon !== undefined) {
      paramCount++
      updates.push(`horizon = $${paramCount}`)
      params.push(input.horizon || null)
    }

    if (input.context_links !== undefined) {
      paramCount++
      updates.push(`context_links = $${paramCount}`)
      params.push(JSON.stringify(input.context_links))
    }

    if (input.pause_reason !== undefined) {
      paramCount++
      updates.push(`pause_reason = $${paramCount}`)
      params.push(input.pause_reason)
    }

    if (input.abandonment_reason !== undefined) {
      paramCount++
      updates.push(`abandonment_reason = $${paramCount}`)
      params.push(input.abandonment_reason)
    }

    if (input.shipped_notes !== undefined) {
      paramCount++
      updates.push(`shipped_notes = $${paramCount}`)
      params.push(input.shipped_notes)
    }

    if (updates.length === 0) return current

    paramCount++
    params.push(id)

    const result = await DatabaseService.query(
      `UPDATE planner_initiatives
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND deleted_at IS NULL
       RETURNING 
         id, title, intent, success_criteria, owner_id, formation_id, horizon, 
         context_links, pause_reason, abandonment_reason, shipped_notes, 
         deleted_at::text, created_at::text, updated_at::text, product_id, 
         milestone_id, stage, status`,
      params,
    )

    const updated = result.rows[0]
    if (updated) {
      await activityLogService.log({
        entity_type: 'initiative',
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
   * Change initiative stage
   */
  async changeStage(
    id: string,
    newStage: InitiativeStage,
    actorId: string,
  ): Promise<Initiative | null> {
    const current = await this.getById(id)
    if (!current) return null

    const result = await DatabaseService.query(
      `UPDATE planner_initiatives
       SET stage = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING 
         id, title, intent, success_criteria, owner_id, formation_id, horizon, 
         context_links, pause_reason, abandonment_reason, shipped_notes, 
         deleted_at::text, created_at::text, updated_at::text, product_id, 
         milestone_id, stage, status`,
      [newStage, id],
    )

    const updated = result.rows[0]
    if (updated) {
      await activityLogService.log({
        entity_type: 'initiative',
        entity_id: id,
        action: 'stage_changed',
        actor_id: actorId,
        old_value: { stage: current.stage },
        new_value: { stage: newStage },
      })
    }

    return updated || null
  }

  /**
   * Change initiative status with validation
   */
  async changeStatus(
    id: string,
    newStatus: InitiativeStatus,
    actorId: string,
    metadata?: { reason?: string; notes?: string },
  ): Promise<Initiative | null> {
    const current = await this.getById(id)
    if (!current) return null

    // Validate status transition
    const allowedTransitions = INITIATIVE_STATUS_TRANSITIONS[current.status]
    if (!allowedTransitions.allowed.includes(newStatus)) {
      throw new Error(
        `Cannot transition from ${current.status} to ${newStatus}. Allowed: ${allowedTransitions.allowed.join(', ')}`,
      )
    }

    // Additional validation for shipped status
    if (newStatus === 'shipped') {
      // Check if all threads are resolved or archived
      const activeThreads = await DatabaseService.query(
        `SELECT COUNT(*) as count FROM planner_threads
         WHERE initiative_id = $1 AND state IN ('proposed', 'active') AND deleted_at IS NULL`,
        [id],
      )
      if (activeThreads.rows[0]?.count > 0) {
        throw new Error('Cannot ship initiative with active threads')
      }
    }

    // Update status with metadata
    const updates: Record<string, unknown> = { status: newStatus }

    if (newStatus === 'paused' && metadata?.reason) {
      updates.pause_reason = metadata.reason
    }

    if (newStatus === 'abandoned' && metadata?.reason) {
      updates.abandonment_reason = metadata.reason
    }

    if (newStatus === 'shipped' && metadata?.notes) {
      updates.shipped_notes = metadata.notes
    }

    const result = await DatabaseService.query(
      `UPDATE planner_initiatives
       SET status = $1,
           pause_reason = $2,
           abandonment_reason = $3,
           shipped_notes = $4
       WHERE id = $5 AND deleted_at IS NULL
       RETURNING 
         id, title, intent, success_criteria, owner_id, formation_id, horizon, 
         context_links, pause_reason, abandonment_reason, shipped_notes, 
         deleted_at::text, created_at::text, updated_at::text, product_id, 
         milestone_id, stage, status`,
      [
        newStatus,
        updates.pause_reason || null,
        updates.abandonment_reason || null,
        updates.shipped_notes || null,
        id,
      ],
    )

    const updated = result.rows[0]
    if (updated) {
      await activityLogService.log({
        entity_type: 'initiative',
        entity_id: id,
        action: 'status_changed',
        actor_id: actorId,
        old_value: { status: current.status },
        new_value: { status: newStatus },
        metadata,
      })
    }

    return updated || null
  }

  /**
   * Soft delete initiative and all related data (threads, todos)
   */
  async delete(id: string, actorId: string): Promise<boolean> {
    const current = await this.getById(id)
    if (!current) return false

    // Delete all related threads
    await DatabaseService.query(
      `UPDATE planner_threads
       SET deleted_at = NOW()
       WHERE initiative_id = $1 AND deleted_at IS NULL`,
      [id],
    )

    // Delete all related todos
    await DatabaseService.query(
      `UPDATE planner_todos
       SET deleted_at = NOW()
       WHERE initiative_id = $1 AND deleted_at IS NULL`,
      [id],
    )

    // Delete the initiative itself
    await DatabaseService.query(
      `UPDATE planner_initiatives
       SET deleted_at = NOW()
       WHERE id = $1`,
      [id],
    )

    await activityLogService.log({
      entity_type: 'initiative',
      entity_id: id,
      action: 'deleted',
      actor_id: actorId,
      old_value: current as unknown as Record<string, unknown>,
    })

    return true
  }

  /**
   * Get initiatives approaching horizon (for notifications)
   */
  async getApproachingHorizon(daysThreshold: number = 7): Promise<InitiativeWithOwner[]> {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

    return this.list({
      status: 'active',
      horizon_before: thresholdDate.toISOString(),
    })
  }

  /**
   * Get initiatives with long-standing blocks
   */
  async getWithLongBlocks(hoursThreshold: number = 48): Promise<InitiativeWithOwner[]> {
    const thresholdDate = new Date()
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold)

    const result = await DatabaseService.query(
      `SELECT DISTINCT
        i.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email
        ) as owner
      FROM planner_initiatives i
      JOIN employees e ON e.id = i.owner_id
      JOIN planner_threads t ON t.initiative_id = i.id
      WHERE i.status = 'active'
        AND i.deleted_at IS NULL
        AND t.shape = 'block'
        AND t.state = 'active'
        AND t.updated_at < $1
        AND t.deleted_at IS NULL`,
      [thresholdDate.toISOString()],
    )

    return result.rows
  }
}

export const initiativeService = new InitiativeService()
