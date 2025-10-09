import { DatabaseService } from '$lib/database/connection'
import type {
  AddFormationMemberInput,
  CreateFormationInput,
  Formation,
  FormationFilters,
  FormationMember,
  FormationWithMembers,
  UpdateFormationInput,
} from '../types'
import { activityLogService } from './activity-log.service'

export class FormationService {
  /**
   * Create a new formation
   */
  async create(input: CreateFormationInput, actorId: string): Promise<Formation> {
    const result = await DatabaseService.query(
      `INSERT INTO planner_formations (
        name, description, cadence_type, cadence_anchor_time, energy_state
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        input.name,
        input.description || null,
        input.cadence_type,
        input.cadence_anchor_time || null,
        input.energy_state || 'healthy',
      ],
    )

    const formation = result.rows[0]
    if (!formation) throw new Error('Failed to create formation')

    await activityLogService.log({
      entity_type: 'formation',
      entity_id: formation.id,
      action: 'created',
      actor_id: actorId,
      new_value: formation,
    })

    return formation
  }

  /**
   * Get formation by ID
   */
  async getById(id: string): Promise<Formation | null> {
    const result = await DatabaseService.query(
      `SELECT * FROM planner_formations
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    )
    return result.rows[0] || null
  }

  /**
   * Get formation with members and initiatives
   */
  async getByIdWithDetails(id: string): Promise<FormationWithMembers | null> {
    const formation = await this.getById(id)
    if (!formation) return null

    // Get members
    const membersResult = await DatabaseService.query(
      `SELECT
        fm.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email,
          'department', e.department,
          'position', e.position
        ) as employee
      FROM planner_formation_members fm
      JOIN employees e ON e.id = fm.employee_id
      WHERE fm.formation_id = $1
      ORDER BY
        CASE fm.role
          WHEN 'driver' THEN 1
          WHEN 'contributor' THEN 2
          WHEN 'advisor' THEN 3
          WHEN 'observer' THEN 4
        END`,
      [id],
    )

    // Get linked initiatives
    const initiativesResult = await DatabaseService.query(
      `SELECT i.*
      FROM planner_initiatives i
      JOIN planner_formation_initiatives fi ON fi.initiative_id = i.id
      WHERE fi.formation_id = $1 AND i.deleted_at IS NULL
      ORDER BY
        CASE i.status
          WHEN 'active' THEN 1
          WHEN 'paused' THEN 2
          WHEN 'shipped' THEN 3
          WHEN 'abandoned' THEN 4
        END,
        CASE i.stage
          WHEN 'building' THEN 1
          WHEN 'testing' THEN 2
          WHEN 'shipping' THEN 3
          WHEN 'shaping' THEN 4
          WHEN 'done' THEN 5
        END,
        i.created_at DESC`,
      [id],
    )

    return {
      ...formation,
      members: membersResult.rows,
      initiatives: initiativesResult.rows,
      member_count: membersResult.rows.length,
    }
  }

  /**
   * List formations
   */
  async list(filters?: FormationFilters): Promise<FormationWithMembers[]> {
    let query = `
      SELECT
        f.*,
        (SELECT COUNT(*) FROM planner_formation_members WHERE formation_id = f.id) as member_count
      FROM planner_formations f
      WHERE f.deleted_at IS NULL
    `

    const params: unknown[] = []
    let paramCount = 0

    if (filters?.energy_state) {
      paramCount++
      query += ` AND f.energy_state = $${paramCount}`
      params.push(filters.energy_state)
    }

    if (filters?.member_id) {
      paramCount++
      query += ` AND EXISTS (
        SELECT 1 FROM planner_formation_members
        WHERE formation_id = f.id AND employee_id = $${paramCount}
      )`
      params.push(filters.member_id)
    }

    query += ` ORDER BY f.created_at DESC`

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

    // Enrich with members and initiatives
    const formations = await Promise.all(
      result.rows.map(async (f) => {
        const details = await this.getByIdWithDetails(f.id)
        return details!
      }),
    )

    return formations
  }

  /**
   * Update formation
   */
  async update(
    id: string,
    input: UpdateFormationInput,
    actorId: string,
  ): Promise<Formation | null> {
    const current = await this.getById(id)
    if (!current) return null

    const updates: string[] = []
    const params: unknown[] = []
    let paramCount = 0

    if (input.name !== undefined) {
      paramCount++
      updates.push(`name = $${paramCount}`)
      params.push(input.name)
    }

    if (input.description !== undefined) {
      paramCount++
      updates.push(`description = $${paramCount}`)
      params.push(input.description || null)
    }

    if (input.cadence_type !== undefined) {
      paramCount++
      updates.push(`cadence_type = $${paramCount}`)
      params.push(input.cadence_type)
    }

    if (input.cadence_anchor_time !== undefined) {
      paramCount++
      updates.push(`cadence_anchor_time = $${paramCount}`)
      params.push(input.cadence_anchor_time || null)
    }

    if (input.energy_state !== undefined) {
      paramCount++
      updates.push(`energy_state = $${paramCount}`)
      params.push(input.energy_state)
    }

    if (updates.length === 0) return current

    paramCount++
    params.push(id)

    const result = await DatabaseService.query(
      `UPDATE planner_formations
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND deleted_at IS NULL
       RETURNING *`,
      params,
    )

    const updated = result.rows[0]
    if (updated) {
      await activityLogService.log({
        entity_type: 'formation',
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
   * Add member to formation
   */
  async addMember(input: AddFormationMemberInput, actorId: string): Promise<FormationMember> {
    const result = await DatabaseService.query(
      `INSERT INTO planner_formation_members (
        formation_id, employee_id, role, bandwidth
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (formation_id, employee_id) DO UPDATE
      SET role = $3, bandwidth = $4
      RETURNING *`,
      [input.formation_id, input.employee_id, input.role, input.bandwidth],
    )

    const member = result.rows[0]
    if (!member) throw new Error('Failed to add formation member')

    await activityLogService.log({
      entity_type: 'formation',
      entity_id: input.formation_id,
      action: 'member_added',
      actor_id: actorId,
      metadata: { employee_id: input.employee_id, role: input.role },
    })

    return member
  }

  /**
   * Remove member from formation
   */
  async removeMember(formationId: string, employeeId: string, actorId: string): Promise<boolean> {
    await DatabaseService.query(
      `DELETE FROM planner_formation_members
       WHERE formation_id = $1 AND employee_id = $2`,
      [formationId, employeeId],
    )

    await activityLogService.log({
      entity_type: 'formation',
      entity_id: formationId,
      action: 'member_removed',
      actor_id: actorId,
      metadata: { employee_id: employeeId },
    })

    return true
  }

  /**
   * Link initiative to formation
   */
  async linkInitiative(formationId: string, initiativeId: string, actorId: string): Promise<void> {
    await DatabaseService.query(
      `INSERT INTO planner_formation_initiatives (formation_id, initiative_id)
       VALUES ($1, $2)
       ON CONFLICT (formation_id, initiative_id) DO NOTHING`,
      [formationId, initiativeId],
    )

    await activityLogService.log({
      entity_type: 'formation',
      entity_id: formationId,
      action: 'initiative_linked',
      actor_id: actorId,
      metadata: { initiative_id: initiativeId },
    })
  }

  /**
   * Unlink initiative from formation
   */
  async unlinkInitiative(
    formationId: string,
    initiativeId: string,
    actorId: string,
  ): Promise<void> {
    await DatabaseService.query(
      `DELETE FROM planner_formation_initiatives
       WHERE formation_id = $1 AND initiative_id = $2`,
      [formationId, initiativeId],
    )

    await activityLogService.log({
      entity_type: 'formation',
      entity_id: formationId,
      action: 'initiative_unlinked',
      actor_id: actorId,
      metadata: { initiative_id: initiativeId },
    })
  }

  /**
   * Soft delete formation
   */
  async delete(id: string, actorId: string): Promise<boolean> {
    const current = await this.getById(id)
    if (!current) return false

    await DatabaseService.query(
      `UPDATE planner_formations
       SET deleted_at = NOW()
       WHERE id = $1`,
      [id],
    )

    await activityLogService.log({
      entity_type: 'formation',
      entity_id: id,
      action: 'deleted',
      actor_id: actorId,
      old_value: current as unknown as Record<string, unknown>,
    })

    return true
  }

  /**
   * Get formations with strained energy for too long (for notifications)
   */
  async getStrainedFormations(daysThreshold = 14): Promise<FormationWithMembers[]> {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

    // Find formations that have been strained/blocked and haven't changed energy state recently
    const result = await DatabaseService.query(
      `SELECT DISTINCT f.*
      FROM planner_formations f
      WHERE f.energy_state IN ('strained', 'blocked')
        AND f.deleted_at IS NULL
        AND f.updated_at < $1
        AND NOT EXISTS (
          SELECT 1 FROM planner_activity_log al
          WHERE al.entity_type = 'formation'
            AND al.entity_id = f.id
            AND al.action = 'updated'
            AND al.created_at > $1
            AND al.new_value->>'energy_state' != f.energy_state
        )`,
      [thresholdDate.toISOString()],
    )

    const formations = await Promise.all(
      result.rows.map(async (f) => {
        const details = await this.getByIdWithDetails(f.id)
        return details!
      }),
    )

    return formations
  }

  /**
   * Generate pre-sync digest for a formation
   */
  async generateSyncDigest(formationId: string): Promise<{
    formation: FormationWithMembers
    active_threads: unknown[]
    recent_activity: unknown[]
  }> {
    const formation = await this.getByIdWithDetails(formationId)
    if (!formation) throw new Error('Formation not found')

    // Get all active threads from formation's initiatives
    const activeThreadsResult = await DatabaseService.query(
      `SELECT
        t.*,
        i.title as initiative_title,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name
        ) as owner,
        (SELECT COUNT(*) FROM planner_thread_replies WHERE thread_id = t.id) as reply_count
      FROM planner_threads t
      JOIN planner_initiatives i ON i.id = t.initiative_id
      JOIN employees e ON e.id = t.owner_id
      JOIN planner_formation_initiatives fi ON fi.initiative_id = i.id
      WHERE fi.formation_id = $1
        AND t.state = 'active'
        AND t.deleted_at IS NULL
      ORDER BY
        CASE t.shape
          WHEN 'block' THEN 1
          WHEN 'question' THEN 2
          WHEN 'decision' THEN 3
          WHEN 'build' THEN 4
          WHEN 'research' THEN 5
        END,
        t.updated_at DESC`,
      [formationId],
    )

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const activityResult = await DatabaseService.query(
      `SELECT
        al.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name
        ) as actor
      FROM planner_activity_log al
      JOIN employees e ON e.id = al.actor_id
      WHERE (
        al.entity_type = 'formation' AND al.entity_id = $1
        OR (
          al.entity_type = 'initiative' AND al.entity_id IN (
            SELECT initiative_id FROM planner_formation_initiatives WHERE formation_id = $1
          )
        )
      )
      AND al.created_at > $2
      ORDER BY al.created_at DESC
      LIMIT 50`,
      [formationId, sevenDaysAgo.toISOString()],
    )

    return {
      formation,
      active_threads: activeThreadsResult.rows,
      recent_activity: activityResult.rows,
    }
  }
}

export const formationService = new FormationService()
