/**
 * Notification Service
 * 자산 관련 알림 자동화 관리
 */

import { query } from '$lib/database/connection'
import type {
  AssetNotification,
  AssetNotificationSummary,
  DatabaseAssetNotification,
} from '$lib/types/asset'
import { logger } from '$lib/utils/logger'

export class NotificationService {
  /**
   * 알림 생성
   */
  async createNotification(
    notificationType: string,
    referenceType: string,
    referenceId: string,
    recipientId: string,
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    scheduledDate?: string,
  ): Promise<DatabaseAssetNotification> {
    try {
      const result = await query<DatabaseAssetNotification>(
        `INSERT INTO asset_notifications (
          notification_type, reference_type, reference_id, recipient_id,
          title, message, priority, scheduled_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, notification_type, reference_type, reference_id, recipient_id,
                  title, message, priority, status, scheduled_date,
                  created_at::text as created_at`,
        [
          notificationType,
          referenceType,
          referenceId,
          recipientId,
          title,
          message,
          priority,
          scheduledDate || null,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('알림 생성에 실패했습니다.')
      }

      logger.info(`Notification created: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create notification:', error)
      throw error
    }
  }

  /**
   * 사용자 알림 목록 조회
   */
  async getUserNotifications(
    userId: string,
    limit = 50,
    status?: 'pending' | 'sent' | 'read',
  ): Promise<AssetNotification[]> {
    try {
      const conditions = ['n.recipient_id = $1']
      const params: unknown[] = [userId]
      let paramIndex = 2

      if (status) {
        conditions.push(`n.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const result = await query<AssetNotification>(
        `SELECT 
          n.id, n.notification_type, n.reference_type, n.reference_id, n.recipient_id,
          n.title, n.message, n.priority, n.status, n.scheduled_date,
          n.sent_at, n.read_at, n.created_at::text as created_at,
          e.first_name as recipient_first_name, e.last_name as recipient_last_name, e.employee_id as recipient_emp_id
        FROM asset_notifications n
        LEFT JOIN employees e ON e.id = n.recipient_id
        ${whereClause}
        ORDER BY n.created_at DESC
        LIMIT $${paramIndex++}`,
        [...params, limit],
      )

      return result.rows.map((notification) => ({
        ...notification,
        recipient: {
          id: notification.recipient_id,
          first_name: notification.recipient_first_name,
          last_name: notification.recipient_last_name,
          employee_id: notification.recipient_emp_id,
        },
      }))
    } catch (error) {
      logger.error('Failed to get user notifications:', error)
      throw error
    }
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const result = await query(
        `UPDATE asset_notifications 
         SET status = 'read', read_at = NOW()
         WHERE id = $1 AND recipient_id = $2`,
        [notificationId, userId],
      )

      if (result.rowCount === 0) {
        throw new Error('알림을 찾을 수 없습니다.')
      }

      logger.info(`Notification marked as read: ${notificationId}`)
    } catch (error) {
      logger.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  /**
   * 모든 알림 스케줄링 (일일 실행)
   */
  async scheduleAllNotifications(): Promise<void> {
    try {
      // 지식재산권 갱신 알림
      await this.scheduleIpRenewalNotifications()

      // 인증서 만료 알림
      await this.scheduleCertificationExpiryNotifications()

      // 자산 반납 알림
      await this.scheduleAssetReturnNotifications()

      // 자산 실사 알림
      await this.scheduleAuditReminders()

      logger.info('All asset notifications scheduled')
    } catch (error) {
      logger.error('Failed to schedule notifications:', error)
      throw error
    }
  }

  /**
   * 지식재산권 갱신 알림 스케줄링
   */
  private async scheduleIpRenewalNotifications(): Promise<void> {
    const notificationDates = [90, 60, 30, 7] // 일 단위

    for (const days of notificationDates) {
      const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const ips = await query(
        `SELECT id, title, expiry_date FROM intellectual_properties
         WHERE expiry_date = $1 AND status IN ('registered', 'applied')`,
        [targetDate],
      )

      for (const ip of ips.rows) {
        // 이미 알림이 있는지 확인
        const existingNotification = await query(
          `SELECT id FROM asset_notifications
           WHERE reference_type = 'ip' AND reference_id = $1 
             AND notification_type = 'renewal_due' AND scheduled_date = $2`,
          [ip.id, targetDate],
        )

        if (existingNotification.rows.length === 0) {
          await this.createNotification(
            'renewal_due',
            'ip',
            ip.id,
            'system', // 시스템 알림
            `지식재산권 갱신 알림 (D-${days})`,
            `${ip.title}의 갱신일이 ${days}일 남았습니다.`,
            days <= 7 ? 'urgent' : days <= 30 ? 'high' : 'normal',
            targetDate,
          )
        }
      }
    }
  }

  /**
   * 인증서 만료 알림 스케줄링
   */
  private async scheduleCertificationExpiryNotifications(): Promise<void> {
    const notificationDates = [60, 30, 7] // 일 단위

    for (const days of notificationDates) {
      const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const certs = await query(
        `SELECT id, certification_name, expiry_date FROM company_certifications
         WHERE expiry_date = $1 AND status = 'active'`,
        [targetDate],
      )

      for (const cert of certs.rows) {
        // 이미 알림이 있는지 확인
        const existingNotification = await query(
          `SELECT id FROM asset_notifications
           WHERE reference_type = 'certification' AND reference_id = $1 
             AND notification_type = 'expiry_warning' AND scheduled_date = $2`,
          [cert.id, targetDate],
        )

        if (existingNotification.rows.length === 0) {
          await this.createNotification(
            'expiry_warning',
            'certification',
            cert.id,
            'system', // 시스템 알림
            `인증서 만료 알림 (D-${days})`,
            `${cert.certification_name}의 만료일이 ${days}일 남았습니다.`,
            days <= 7 ? 'urgent' : days <= 30 ? 'high' : 'normal',
            targetDate,
          )
        }
      }
    }
  }

  /**
   * 자산 반납 알림 스케줄링
   */
  private async scheduleAssetReturnNotifications(): Promise<void> {
    // 반납 예정일 3일, 1일 전 알림
    const notificationDates = [3, 1]

    for (const days of notificationDates) {
      const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const assignments = await query(
        `SELECT aa.id, aa.asset_id, aa.employee_id, a.name as asset_name, a.asset_code
         FROM asset_assignments aa
         JOIN assets a ON a.id = aa.asset_id
         WHERE aa.expected_return_date = $1 AND aa.status = 'active'`,
        [targetDate],
      )

      for (const assignment of assignments.rows) {
        // 이미 알림이 있는지 확인
        const existingNotification = await query(
          `SELECT id FROM asset_notifications
           WHERE reference_type = 'assignment' AND reference_id = $1 
             AND notification_type = 'overdue_return' AND scheduled_date = $2`,
          [assignment.id, targetDate],
        )

        if (existingNotification.rows.length === 0) {
          await this.createNotification(
            'overdue_return',
            'assignment',
            assignment.id,
            assignment.employee_id,
            `자산 반납 알림 (D-${days})`,
            `${assignment.asset_name}(${assignment.asset_code})의 반납일이 ${days}일 남았습니다.`,
            days <= 1 ? 'urgent' : 'high',
            targetDate,
          )
        }
      }
    }

    // 연체 알림 (매일)
    const overdueAssignments = await query(
      `SELECT aa.id, aa.asset_id, aa.employee_id, a.name as asset_name, a.asset_code,
              aa.expected_return_date
       FROM asset_assignments aa
       JOIN assets a ON a.id = aa.asset_id
       WHERE aa.expected_return_date < CURRENT_DATE AND aa.status = 'active'`,
    )

    for (const assignment of overdueAssignments.rows) {
      const overdueDays = Math.floor(
        (Date.now() - new Date(assignment.expected_return_date).getTime()) / (1000 * 60 * 60 * 24),
      )

      // 오늘 이미 알림을 보냈는지 확인
      const today = new Date().toISOString().split('T')[0]
      const existingNotification = await query(
        `SELECT id FROM asset_notifications
         WHERE reference_type = 'assignment' AND reference_id = $1 
           AND notification_type = 'overdue_return' AND scheduled_date = $2`,
        [assignment.id, today],
      )

      if (existingNotification.rows.length === 0) {
        await this.createNotification(
          'overdue_return',
          'assignment',
          assignment.id,
          assignment.employee_id,
          `자산 반납 연체 알림`,
          `${assignment.asset_name}(${assignment.asset_code})이 ${overdueDays}일 연체되었습니다.`,
          'urgent',
          today,
        )
      }
    }
  }

  /**
   * 자산 실사 알림 스케줄링
   */
  private async scheduleAuditReminders(): Promise<void> {
    // 진행 중인 실사 마감 알림
    const activeAudits = await query(
      `SELECT id, audit_name, end_date::text as end_date FROM asset_audits 
       WHERE status = 'in_progress' AND end_date <= CURRENT_DATE + INTERVAL '7 days'`,
    )

    for (const audit of activeAudits.rows) {
      const endDate = new Date(audit.end_date)
      const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

      if (daysLeft <= 7 && daysLeft > 0) {
        // 이미 알림이 있는지 확인
        const existingNotification = await query(
          `SELECT id FROM asset_notifications
           WHERE reference_type = 'audit' AND reference_id = $1 
             AND notification_type = 'audit_reminder'`,
          [audit.id],
        )

        if (existingNotification.rows.length === 0) {
          await this.createNotification(
            'audit_reminder',
            'audit',
            audit.id,
            'system', // 시스템 알림
            `자산 실사 마감 알림`,
            `${audit.audit_name}의 마감일이 ${daysLeft}일 남았습니다.`,
            daysLeft <= 3 ? 'urgent' : 'high',
          )
        }
      }
    }
  }

  /**
   * 알림 발송 (실제 발송 로직)
   */
  async sendNotifications(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]

      // 발송 예정인 알림 조회
      const notifications = await query<DatabaseAssetNotification>(
        `SELECT id, asset_id, notification_type, title, message, status, 
                scheduled_date, sent_date, priority, created_at::text as created_at, 
                updated_at::text as updated_at
         FROM asset_notifications 
         WHERE status = 'pending' 
           AND (scheduled_date IS NULL OR scheduled_date <= $1)
         ORDER BY priority DESC, created_at ASC`,
        [today],
      )

      for (const notification of notifications.rows) {
        try {
          // 실제 발송 로직 (이메일, SMS, 푸시 등)
          await this.deliverNotification(notification)

          // 발송 완료 상태로 업데이트
          await query(
            `UPDATE asset_notifications 
             SET status = 'sent', sent_at = NOW()
             WHERE id = $1`,
            [notification.id],
          )

          logger.info(`Notification sent: ${notification.id}`)
        } catch (error) {
          logger.error(`Failed to send notification ${notification.id}:`, error)
          // 발송 실패 시 상태는 그대로 유지 (재시도 가능)
        }
      }
    } catch (error) {
      logger.error('Failed to send notifications:', error)
      throw error
    }
  }

  /**
   * 알림 실제 발송 (구현 필요)
   */
  private async deliverNotification(notification: DatabaseAssetNotification): Promise<void> {
    // TODO: 실제 발송 로직 구현
    // - 이메일 발송
    // - SMS 발송
    // - 푸시 알림
    // - 인앱 알림

    logger.info(`Delivering notification: ${notification.title} to ${notification.recipient_id}`)

    // 임시로 1초 대기 (실제 발송 시간 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  /**
   * 알림 통계 조회
   */
  async getNotificationSummary(userId: string): Promise<AssetNotificationSummary> {
    try {
      const result = await query(
        `SELECT 
          COUNT(CASE WHEN priority = 'urgent' AND status = 'pending' THEN 1 END) as urgent,
          COUNT(CASE WHEN priority = 'high' AND status = 'pending' THEN 1 END) as high,
          COUNT(CASE WHEN priority = 'normal' AND status = 'pending' THEN 1 END) as normal,
          COUNT(CASE WHEN priority = 'low' AND status = 'pending' THEN 1 END) as low
        FROM asset_notifications
        WHERE recipient_id = $1`,
        [userId],
      )

      const row = result.rows[0]
      return {
        urgent: parseInt(row.urgent),
        high: parseInt(row.high),
        normal: parseInt(row.normal),
        low: parseInt(row.low),
      }
    } catch (error) {
      logger.error('Failed to get notification summary:', error)
      throw error
    }
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const result = await query(
        `DELETE FROM asset_notifications 
         WHERE id = $1 AND recipient_id = $2`,
        [notificationId, userId],
      )

      if (result.rowCount === 0) {
        throw new Error('알림을 찾을 수 없습니다.')
      }

      logger.info(`Notification deleted: ${notificationId}`)
    } catch (error) {
      logger.error('Failed to delete notification:', error)
      throw error
    }
  }

  /**
   * 모든 알림 삭제 (사용자용)
   */
  async clearAllNotifications(userId: string): Promise<void> {
    try {
      const result = await query(`DELETE FROM asset_notifications WHERE recipient_id = $1`, [
        userId,
      ])

      logger.info(`All notifications cleared for user: ${userId}`)
    } catch (error) {
      logger.error('Failed to clear all notifications:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const notificationService = new NotificationService()
