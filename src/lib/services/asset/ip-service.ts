/**
 * Intellectual Property Service
 * 지식재산권 관리 비즈니스 로직
 */

import { query, transaction } from '$lib/database/connection'
import type {
  CreateIpDto,
  DatabaseIntellectualProperty,
  DatabaseIpRenewalHistory,
  IntellectualProperty,
  IpFilters,
} from '$lib/types/asset'
import { logger } from '$lib/utils/logger'

export class IpService {
  /**
   * 지식재산권 생성
   */
  async create(data: CreateIpDto): Promise<DatabaseIntellectualProperty> {
    try {
      const result = await query<DatabaseIntellectualProperty>(
        `INSERT INTO intellectual_properties (
          ip_type, title, registration_number, application_number, application_date,
          registration_date, expiry_date, renewal_date, status, country, owner,
          inventor_names, description, classification_code, annual_fee, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, ip_type, title, registration_number, application_number, application_date,
                  registration_date, expiry_date, renewal_date, status, country, owner,
                  inventor_names, description, classification_code, annual_fee, document_s3_key,
                  notes, created_at::text as created_at, updated_at::text as updated_at`,
        [
          data.ip_type,
          data.title,
          data.registration_number || null,
          data.application_number || null,
          data.application_date || null,
          data.registration_date || null,
          data.expiry_date || null,
          null, // renewal_date
          data.status || 'planning',
          data.country || 'KR',
          data.owner || null,
          data.inventor_names || null,
          data.description || null,
          data.classification_code || null,
          data.annual_fee || null,
          data.notes || null,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('지식재산권 생성에 실패했습니다.')
      }

      logger.info(`IP created: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create IP:', error)
      throw error
    }
  }

  /**
   * 지식재산권 ID로 조회
   */
  async getById(id: string): Promise<IntellectualProperty | null> {
    try {
      const result = await query<IntellectualProperty>(
        `SELECT 
          ip.id, ip.ip_type, ip.title, ip.registration_number, ip.application_number,
          ip.application_date, ip.registration_date, ip.expiry_date, ip.renewal_date,
          ip.status, ip.country, ip.owner, ip.inventor_names, ip.description,
          ip.classification_code, ip.annual_fee, ip.document_s3_key, ip.notes,
          ip.created_at::text as created_at, ip.updated_at::text as updated_at,
          rh.id as renewal_id, rh.renewal_date as rh_renewal_date, rh.fee_paid,
          rh.next_renewal_date, rh.notes as rh_notes, rh.created_at as rh_created_at
        FROM intellectual_properties ip
        LEFT JOIN ip_renewal_history rh ON rh.ip_id = ip.id
        WHERE ip.id = $1
        ORDER BY rh.renewal_date DESC`,
        [id],
      )

      if (!result.rows[0]) return null

      const ip = result.rows[0]
      const renewalHistory = result.rows
        .filter((row) => row.renewal_id)
        .map((row) => ({
          id: row.renewal_id,
          ip_id: ip.id,
          renewal_date: row.rh_renewal_date,
          fee_paid: row.fee_paid,
          next_renewal_date: row.next_renewal_date,
          notes: row.rh_notes,
          created_at: row.rh_created_at,
          paid_by: null,
        }))

      return {
        ...ip,
        renewal_history: renewalHistory,
      }
    } catch (error) {
      logger.error('Failed to get IP by ID:', error)
      throw error
    }
  }

  /**
   * 지식재산권 목록 조회
   */
  async list(filters: IpFilters = {}): Promise<IntellectualProperty[]> {
    try {
      const conditions: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (filters.ip_type) {
        conditions.push(`ip.ip_type = $${paramIndex++}`)
        params.push(filters.ip_type)
      }

      if (filters.status) {
        conditions.push(`ip.status = $${paramIndex++}`)
        params.push(filters.status)
      }

      if (filters.country) {
        conditions.push(`ip.country = $${paramIndex++}`)
        params.push(filters.country)
      }

      if (filters.search) {
        conditions.push(`(
          ip.title ILIKE $${paramIndex} OR 
          ip.registration_number ILIKE $${paramIndex} OR 
          ip.application_number ILIKE $${paramIndex} OR
          ip.description ILIKE $${paramIndex}
        )`)
        params.push(`%${filters.search}%`)
        paramIndex++
      }

      if (filters.expiry_soon) {
        conditions.push(`ip.expiry_date IS NOT NULL AND ip.expiry_date <= $${paramIndex++}`)
        params.push(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const limitClause = filters.limit ? `LIMIT $${paramIndex++}` : ''
      const offsetClause = filters.offset ? `OFFSET $${paramIndex++}` : ''

      if (filters.limit) params.push(filters.limit)
      if (filters.offset) params.push(filters.offset)

      const result = await query<IntellectualProperty>(
        `SELECT 
          ip.id, ip.ip_type, ip.title, ip.registration_number, ip.application_number,
          ip.application_date, ip.registration_date, ip.expiry_date, ip.renewal_date,
          ip.status, ip.country, ip.owner, ip.inventor_names, ip.description,
          ip.classification_code, ip.annual_fee, ip.document_s3_key, ip.notes,
          ip.created_at::text as created_at, ip.updated_at::text as updated_at
        FROM intellectual_properties ip
        ${whereClause}
        ORDER BY ip.created_at DESC
        ${limitClause} ${offsetClause}`,
        params,
      )

      return result.rows
    } catch (error) {
      logger.error('Failed to list IPs:', error)
      throw error
    }
  }

  /**
   * 지식재산권 업데이트
   */
  async update(id: string, data: Partial<CreateIpDto>): Promise<DatabaseIntellectualProperty> {
    try {
      const fields: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = $${paramIndex++}`)
          params.push(value)
        }
      })

      if (fields.length === 0) {
        throw new Error('업데이트할 데이터가 없습니다.')
      }

      fields.push(`updated_at = NOW()`)
      params.push(id)

      const result = await query<DatabaseIntellectualProperty>(
        `UPDATE intellectual_properties 
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, ip_type, title, registration_number, application_number, application_date,
                   registration_date, expiry_date, renewal_date, status, country, owner,
                   inventor_names, description, classification_code, annual_fee, document_s3_key,
                   notes, created_at::text as created_at, updated_at::text as updated_at`,
        params,
      )

      if (!result.rows[0]) {
        throw new Error('지식재산권을 찾을 수 없습니다.')
      }

      logger.info(`IP updated: ${id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update IP:', error)
      throw error
    }
  }

  /**
   * 지식재산권 상태 업데이트
   */
  async updateStatus(id: string, status: string): Promise<void> {
    try {
      const result = await query(
        `UPDATE intellectual_properties 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [status, id],
      )

      if (result.rowCount === 0) {
        throw new Error('지식재산권을 찾을 수 없습니다.')
      }

      logger.info(`IP status updated: ${id} -> ${status}`)
    } catch (error) {
      logger.error('Failed to update IP status:', error)
      throw error
    }
  }

  /**
   * 갱신 이력 추가
   */
  async addRenewalHistory(
    ipId: string,
    renewalDate: string,
    feePaid?: number,
    nextRenewalDate?: string,
    notes?: string,
    paidBy?: string,
  ): Promise<DatabaseIpRenewalHistory> {
    try {
      const result = await query<DatabaseIpRenewalHistory>(
        `INSERT INTO ip_renewal_history (
          ip_id, renewal_date, fee_paid, next_renewal_date, notes, paid_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, ip_id, renewal_date, fee_paid, next_renewal_date, notes,
                  paid_by, created_at::text as created_at`,
        [
          ipId,
          renewalDate,
          feePaid || null,
          nextRenewalDate || null,
          notes || null,
          paidBy || null,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('갱신 이력 추가에 실패했습니다.')
      }

      // 지식재산권의 renewal_date 업데이트
      await query(
        `UPDATE intellectual_properties 
         SET renewal_date = $1, updated_at = NOW()
         WHERE id = $2`,
        [renewalDate, ipId],
      )

      logger.info(`Renewal history added for IP: ${ipId}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to add renewal history:', error)
      throw error
    }
  }

  /**
   * 갱신 예정 목록 조회
   */
  async getRenewalDue(daysAhead = 90): Promise<IntellectualProperty[]> {
    try {
      const targetDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const result = await query<IntellectualProperty>(
        `SELECT 
          ip.id, ip.ip_type, ip.title, ip.registration_number, ip.application_number,
          ip.application_date, ip.registration_date, ip.expiry_date, ip.renewal_date,
          ip.status, ip.country, ip.owner, ip.inventor_names, ip.description,
          ip.classification_code, ip.annual_fee, ip.document_s3_key, ip.notes,
          ip.created_at::text as created_at, ip.updated_at::text as updated_at
        FROM intellectual_properties ip
        WHERE ip.expiry_date IS NOT NULL 
          AND ip.expiry_date <= $1 
          AND ip.status IN ('registered', 'applied')
        ORDER BY ip.expiry_date ASC`,
        [targetDate],
      )

      return result.rows
    } catch (error) {
      logger.error('Failed to get renewal due IPs:', error)
      throw error
    }
  }

  /**
   * 갱신 알림 스케줄링
   */
  async scheduleRenewalNotifications(): Promise<void> {
    try {
      const notificationDates = [90, 60, 30, 7] // 일 단위

      for (const days of notificationDates) {
        const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]

        const ips = await query<DatabaseIntellectualProperty>(
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
            await query(
              `INSERT INTO asset_notifications (
                notification_type, reference_type, reference_id, title, message,
                priority, scheduled_date
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                'renewal_due',
                'ip',
                ip.id,
                `지식재산권 갱신 알림 (D-${days})`,
                `${ip.title}의 갱신일이 ${days}일 남았습니다.`,
                days <= 7 ? 'urgent' : days <= 30 ? 'high' : 'normal',
                targetDate,
              ],
            )
          }
        }
      }

      logger.info('Renewal notifications scheduled')
    } catch (error) {
      logger.error('Failed to schedule renewal notifications:', error)
      throw error
    }
  }

  /**
   * 지식재산권 통계 조회
   */
  async getStats(): Promise<{
    total: number
    by_type: Record<string, number>
    by_status: Record<string, number>
    expiring_soon: number
    total_annual_fees: number
  }> {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 1 END) as expiring_soon,
          COALESCE(SUM(annual_fee), 0) as total_annual_fees
        FROM intellectual_properties
        WHERE status IN ('registered', 'applied')`,
      )

      const typeResult = await query(
        `SELECT ip_type, COUNT(*) as count
         FROM intellectual_properties
         GROUP BY ip_type`,
      )

      const statusResult = await query(
        `SELECT status, COUNT(*) as count
         FROM intellectual_properties
         GROUP BY status`,
      )

      const byType: Record<string, number> = {}
      typeResult.rows.forEach((row) => {
        byType[row.ip_type] = parseInt(row.count)
      })

      const byStatus: Record<string, number> = {}
      statusResult.rows.forEach((row) => {
        byStatus[row.status] = parseInt(row.count)
      })

      return {
        total: parseInt(result.rows[0].total),
        by_type: byType,
        by_status: byStatus,
        expiring_soon: parseInt(result.rows[0].expiring_soon),
        total_annual_fees: parseFloat(result.rows[0].total_annual_fees),
      }
    } catch (error) {
      logger.error('Failed to get IP stats:', error)
      throw error
    }
  }

  /**
   * 지식재산권 삭제
   */
  async delete(id: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // 갱신 이력 삭제
        await client.query(`DELETE FROM ip_renewal_history WHERE ip_id = $1`, [id])

        // 알림 삭제
        await client.query(
          `DELETE FROM asset_notifications WHERE reference_type = 'ip' AND reference_id = $1`,
          [id],
        )

        // 지식재산권 삭제
        await client.query(`DELETE FROM intellectual_properties WHERE id = $1`, [id])
      })

      logger.info(`IP deleted: ${id}`)
    } catch (error) {
      logger.error('Failed to delete IP:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const ipService = new IpService()
