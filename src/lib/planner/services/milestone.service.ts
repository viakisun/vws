import { DatabaseService } from '$lib/database/connection'
import type {
    CreateMilestoneInput,
    Milestone,
    MilestoneFilters,
    MilestoneStatus,
    MilestoneWithProduct,
    UpdateMilestoneInput,
} from '$lib/planner/types'

export class MilestoneService {
  // =============================================
  // CREATE
  // =============================================

  async create(input: CreateMilestoneInput, actorId: string): Promise<Milestone> {
    const result = await DatabaseService.query(
      `
			INSERT INTO planner_milestones (
				product_id, name, description, target_date,
				status, created_at, updated_at
			)
			VALUES ($1, $2, $3, $4, 'upcoming', NOW(), NOW())
			RETURNING id, product_id, name, description, target_date, status, achieved_at::text, 
                achievement_notes, deleted_at::text, created_at::text, updated_at::text
		`,
      [input.product_id, input.name, input.description || null, input.target_date || null],
    )

    // Log activity
    await this.logActivity('milestone', result.rows[0].id, 'created', actorId, null, result.rows[0])

    return result.rows[0]
  }

  // =============================================
  // READ
  // =============================================

  async getById(id: string): Promise<MilestoneWithProduct | null> {
    const result = await DatabaseService.query(
      `
			SELECT
				m.*,
				json_build_object(
					'id', p.id,
					'name', p.name,
					'code', p.code,
					'status', p.status
				) as product,
				(SELECT COUNT(*) FROM planner_initiatives WHERE milestone_id = m.id AND deleted_at IS NULL) as initiative_count
			FROM planner_milestones m
			JOIN planner_products p ON m.product_id = p.id
			WHERE m.id = $1 AND m.deleted_at IS NULL
		`,
      [id],
    )

    return result.rows[0] || null
  }

  async list(filters: MilestoneFilters = {}): Promise<MilestoneWithProduct[]> {
    const conditions: string[] = ['m.deleted_at IS NULL']
    const params: unknown[] = []
    let paramIndex = 1

    if (filters.product_id) {
      conditions.push(`m.product_id = $${paramIndex}`)
      params.push(filters.product_id)
      paramIndex++
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(`m.status = ANY($${paramIndex}::varchar[])`)
        params.push(filters.status)
      } else {
        conditions.push(`m.status = $${paramIndex}`)
        params.push(filters.status)
      }
      paramIndex++
    }

    if (filters.target_before) {
      conditions.push(`m.target_date <= $${paramIndex}`)
      params.push(filters.target_before)
      paramIndex++
    }

    if (filters.target_after) {
      conditions.push(`m.target_date >= $${paramIndex}`)
      params.push(filters.target_after)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const limit = filters.limit || 100
    const offset = filters.offset || 0

    const result = await DatabaseService.query(
      `
			SELECT
				m.id,
				m.product_id,
				m.name,
				m.description,
				m.target_date::text as target_date,
				m.status,
				m.achieved_at::text as achieved_at,
				m.achievement_notes,
				m.deleted_at::text as deleted_at,
				m.created_at::text as created_at,
				m.updated_at::text as updated_at,
				json_build_object(
					'id', p.id,
					'name', p.name,
					'code', p.code,
					'status', p.status
				) as product,
				(SELECT COUNT(*) FROM planner_initiatives WHERE milestone_id = m.id AND deleted_at IS NULL) as initiative_count
			FROM planner_milestones m
			JOIN planner_products p ON m.product_id = p.id
			${whereClause}
			ORDER BY m.target_date ASC NULLS LAST, m.created_at DESC
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
		`,
      [...params, limit, offset],
    )

    return result.rows
  }

  // =============================================
  // UPDATE
  // =============================================

  async update(
    id: string,
    input: UpdateMilestoneInput,
    actorId: string,
  ): Promise<Milestone | null> {
    const current = await this.getById(id)
    if (!current) return null

    const updates: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      params.push(input.name)
      paramIndex++
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      params.push(input.description)
      paramIndex++
    }

    if (input.target_date !== undefined) {
      updates.push(`target_date = $${paramIndex}`)
      params.push(input.target_date)
      paramIndex++
    }

    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      params.push(input.status)
      paramIndex++

      // If status is 'achieved', set achieved_at
      if (input.status === 'achieved') {
        updates.push(`achieved_at = NOW()`)
      }
    }

    if (input.achievement_notes !== undefined) {
      updates.push(`achievement_notes = $${paramIndex}`)
      params.push(input.achievement_notes)
      paramIndex++
    }

    if (updates.length === 0) return current

    updates.push(`updated_at = NOW()`)

    const result = await DatabaseService.query(
      `
			UPDATE planner_milestones
			SET ${updates.join(', ')}
			WHERE id = $${paramIndex} AND deleted_at IS NULL
			RETURNING id, product_id, name, description, target_date, status, achieved_at::text, 
                achievement_notes, deleted_at::text, created_at::text, updated_at::text
		`,
      [...params, id],
    )

    if (result.rows[0]) {
      await this.logActivity('milestone', id, 'updated', actorId, current, result.rows[0])
    }

    return result.rows[0] || null
  }

  // =============================================
  // STATE TRANSITIONS
  // =============================================

  async changeStatus(
    id: string,
    newStatus: MilestoneStatus,
    actorId: string,
    notes?: string,
  ): Promise<Milestone | null> {
    const current = await this.getById(id)
    if (!current) return null

    const input: UpdateMilestoneInput = {
      status: newStatus,
    }

    if (notes) {
      input.achievement_notes = notes
    }

    return this.update(id, input, actorId)
  }

  // =============================================
  // DELETE
  // =============================================

  async delete(id: string, actorId: string): Promise<boolean> {
    const current = await this.getById(id)
    if (!current) return false

    const result = await DatabaseService.query(
      `
			UPDATE planner_milestones
			SET deleted_at = NOW(), updated_at = NOW()
			WHERE id = $1 AND deleted_at IS NULL
		`,
      [id],
    )

    if (result.rowCount && result.rowCount > 0) {
      await this.logActivity('milestone', id, 'deleted', actorId, current, null)
      return true
    }

    return false
  }

  // =============================================
  // ACTIVITY LOG
  // =============================================

  private async logActivity(
    entityType: string,
    entityId: string,
    action: string,
    actorId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<void> {
    await DatabaseService.query(
      `
			INSERT INTO planner_activity_log (
				entity_type, entity_id, action, actor_id,
				old_value, new_value, created_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, NOW())
		`,
      [
        entityType,
        entityId,
        action,
        actorId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
      ],
    )
  }
}

export const milestoneService = new MilestoneService()
