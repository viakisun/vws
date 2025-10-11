import { DatabaseService } from '$lib/database/connection'

export interface Notification {
  id: number
  employee_id: string
  title: string
  message: string
  type: string
  category: string
  is_read: boolean
  read_at?: string
  action_url?: string
  action_data?: any
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface CreateNotificationInput {
  employee_id: string
  title: string
  message: string
  type: 'mention' | 'assignment' | 'reply' | 'status_change' | 'info'
  category?: string
  action_url?: string
  action_data?: any
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    const result = await DatabaseService.query(
      `INSERT INTO notifications (
        employee_id, title, message, type, category, action_url, action_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, employee_id, title, message, type, category, is_read, read_at::text, 
                action_url, action_data, expires_at::text, created_at::text, updated_at::text`,
      [
        input.employee_id,
        input.title,
        input.message,
        input.type,
        input.category || 'planner',
        input.action_url || null,
        input.action_data ? JSON.stringify(input.action_data) : null,
      ],
    )

    return result.rows[0]
  }

  /**
   * Create mention notification for thread
   */
  async createMentionNotification(params: {
    mentionedUserId: string
    actorName: string
    threadId: string
    threadTitle: string
    isReply?: boolean
  }): Promise<void> {
    await this.create({
      employee_id: params.mentionedUserId,
      title: params.isReply
        ? `${params.actorName}님이 댓글에서 회원님을 멘션했습니다`
        : `${params.actorName}님이 스레드에서 회원님을 멘션했습니다`,
      message: params.threadTitle,
      type: 'mention',
      category: 'planner',
      action_url: `/planner/threads/${params.threadId}`,
      action_data: {
        thread_id: params.threadId,
        actor_name: params.actorName,
      },
    })
  }

  /**
   * Get notifications for a user
   */
  async getForUser(
    employeeId: string,
    filters?: {
      unread_only?: boolean
      category?: string
      limit?: number
      offset?: number
    },
  ): Promise<Notification[]> {
    let query = `
      SELECT * FROM notifications
      WHERE employee_id = $1
    `
    const params: any[] = [employeeId]
    let paramCount = 1

    if (filters?.unread_only) {
      query += ` AND is_read = false`
    }

    if (filters?.category) {
      paramCount++
      query += ` AND category = $${paramCount}`
      params.push(filters.category)
    }

    query += ` ORDER BY created_at DESC`

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
   * Get unread count for a user
   */
  async getUnreadCount(employeeId: string): Promise<number> {
    const result = await DatabaseService.query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE employee_id = $1 AND is_read = false`,
      [employeeId],
    )

    return parseInt(result.rows[0]?.count || '0')
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await DatabaseService.query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE id = $1`,
      [notificationId],
    )
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(employeeId: string): Promise<void> {
    await DatabaseService.query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE employee_id = $1 AND is_read = false`,
      [employeeId],
    )
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: number): Promise<void> {
    await DatabaseService.query(`DELETE FROM notifications WHERE id = $1`, [notificationId])
  }

  /**
   * Delete old read notifications (cleanup)
   */
  async deleteOldReadNotifications(daysOld = 30): Promise<void> {
    await DatabaseService.query(
      `DELETE FROM notifications
       WHERE is_read = true
       AND read_at < NOW() - INTERVAL '${daysOld} days'`,
    )
  }
}

export const notificationService = new NotificationService()
