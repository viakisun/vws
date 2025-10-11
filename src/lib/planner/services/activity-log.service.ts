import { DatabaseService } from '$lib/database/connection'
import type { ActivityLog } from '../types'

interface LogActivityInput {
  entity_type: 'initiative' | 'formation' | 'thread'
  entity_id: string
  action: string
  actor_id: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export class ActivityLogService {
  /**
   * Log an activity
   */
  async log(input: LogActivityInput): Promise<ActivityLog> {
    const result = await DatabaseService.query(
      `INSERT INTO planner_activity_log (
        entity_type, entity_id, action, actor_id, old_value, new_value, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, entity_type, entity_id, action, actor_id, old_value, new_value, 
                metadata, created_at::text, product_id, milestone_id`,
      [
        input.entity_type,
        input.entity_id,
        input.action,
        input.actor_id,
        input.old_value ? JSON.stringify(input.old_value) : null,
        input.new_value ? JSON.stringify(input.new_value) : null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ],
    )

    const log = result.rows[0]
    if (!log) throw new Error('Failed to create activity log')

    return log
  }

  /**
   * Get activity log for an entity
   */
  async getForEntity(entityType: string, entityId: string, limit = 50): Promise<ActivityLog[]> {
    const result = await DatabaseService.query(
      `SELECT
        al.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email
        ) as actor
      FROM planner_activity_log al
      JOIN employees e ON e.id = al.actor_id
      WHERE al.entity_type = $1 AND al.entity_id = $2
      ORDER BY al.created_at DESC
      LIMIT $3`,
      [entityType, entityId, limit],
    )

    return result.rows
  }

  /**
   * Get recent activity across all entities
   */
  async getRecent(limit = 100): Promise<ActivityLog[]> {
    const result = await DatabaseService.query(
      `SELECT
        al.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email
        ) as actor
      FROM planner_activity_log al
      JOIN employees e ON e.id = al.actor_id
      ORDER BY al.created_at DESC
      LIMIT $1`,
      [limit],
    )

    return result.rows
  }

  /**
   * Get activity by actor
   */
  async getByActor(actorId: string, limit = 50): Promise<ActivityLog[]> {
    const result = await DatabaseService.query(
      `SELECT
        al.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email
        ) as actor
      FROM planner_activity_log al
      JOIN employees e ON e.id = al.actor_id
      WHERE al.actor_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2`,
      [actorId, limit],
    )

    return result.rows
  }
}

export const activityLogService = new ActivityLogService()
