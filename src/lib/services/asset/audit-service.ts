/**
 * Audit Service
 * 자산 실사 관리 비즈니스 로직
 */

import { query, transaction } from '$lib/database/connection'
import type {
  AssetAudit,
  AuditProgress,
  AuditSummary,
  CreateAuditDto,
  DatabaseAssetAudit,
  DatabaseAssetAuditItem,
} from '$lib/types/asset'
import { logger } from '$lib/utils/logger'

export class AuditService {
  /**
   * 자산 실사 생성
   */
  async createAudit(data: CreateAuditDto): Promise<DatabaseAssetAudit> {
    try {
      const result = await query<DatabaseAssetAudit>(
        `INSERT INTO asset_audits (
          audit_name, audit_quarter, audit_year, start_date, end_date, auditor_id, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, audit_name, audit_quarter, audit_year, start_date, end_date,
                  status, auditor_id, notes,
                  created_at::text as created_at, updated_at::text as updated_at`,
        [
          data.audit_name,
          data.audit_quarter,
          data.audit_year,
          data.start_date,
          data.end_date,
          data.auditor_id || null,
          data.notes || null,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('자산 실사 생성에 실패했습니다.')
      }

      logger.info(`Asset audit created: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create audit:', error)
      throw error
    }
  }

  /**
   * 자산 실사 목록 조회
   */
  async list(): Promise<AssetAudit[]> {
    try {
      const result = await query<AssetAudit>(
        `SELECT 
          a.id, a.audit_name, a.audit_quarter, a.audit_year, a.start_date, a.end_date,
          a.status, a.auditor_id, a.notes,
          a.created_at::text as created_at, a.updated_at::text as updated_at,
          e.first_name as auditor_first_name, e.last_name as auditor_last_name, e.employee_id as auditor_emp_id
        FROM asset_audits a
        LEFT JOIN employees e ON e.id = a.auditor_id
        ORDER BY a.audit_year DESC, a.audit_quarter DESC`,
      )

      return result.rows.map((audit) => ({
        ...audit,
        auditor: audit.auditor_first_name
          ? {
              id: audit.auditor_id,
              first_name: audit.auditor_first_name,
              last_name: audit.auditor_last_name,
              employee_id: audit.auditor_emp_id,
            }
          : undefined,
        audit_items: [],
      }))
    } catch (error) {
      logger.error('Failed to list audits:', error)
      throw error
    }
  }

  /**
   * 자산 실사 상세 조회
   */
  async getById(id: string): Promise<AssetAudit | null> {
    try {
      const auditResult = await query<AssetAudit>(
        `SELECT 
          a.id, a.audit_name, a.audit_quarter, a.audit_year, a.start_date, a.end_date,
          a.status, a.auditor_id, a.notes,
          a.created_at::text as created_at, a.updated_at::text as updated_at,
          e.first_name as auditor_first_name, e.last_name as auditor_last_name, e.employee_id as auditor_emp_id
        FROM asset_audits a
        LEFT JOIN employees e ON e.id = a.auditor_id
        WHERE a.id = $1`,
        [id],
      )

      if (!auditResult.rows[0]) return null

      const audit = auditResult.rows[0]

      // 실사 항목 조회
      const itemsResult = await query<DatabaseAssetAuditItem>(
        `SELECT 
          ai.id, ai.audit_id, ai.asset_id, ai.checked, ai.checked_at, ai.checked_by,
          ai.condition, ai.location_verified, ai.discrepancy_notes,
          ai.created_at::text as created_at,
          a.name as asset_name, a.asset_code, a.location, a.status as asset_status,
          e.first_name as checked_by_first_name, e.last_name as checked_by_last_name, e.employee_id as checked_by_emp_id
        FROM asset_audit_items ai
        LEFT JOIN assets a ON a.id = ai.asset_id
        LEFT JOIN employees e ON e.id = ai.checked_by
        WHERE ai.audit_id = $1
        ORDER BY a.asset_code`,
        [id],
      )

      return {
        ...audit,
        auditor: audit.auditor_first_name
          ? {
              id: audit.auditor_id,
              first_name: audit.auditor_first_name,
              last_name: audit.auditor_last_name,
              employee_id: audit.auditor_emp_id,
            }
          : undefined,
        audit_items: itemsResult.rows.map((item) => ({
          ...item,
          asset: {
            id: item.asset_id,
            name: item.asset_name,
            asset_code: item.asset_code,
            location: item.location,
            status: item.asset_status,
          } as any,
          checked_by_user: item.checked_by_first_name
            ? {
                id: item.checked_by,
                first_name: item.checked_by_first_name,
                last_name: item.checked_by_last_name,
                employee_id: item.checked_by_emp_id,
              }
            : undefined,
        })),
      }
    } catch (error) {
      logger.error('Failed to get audit by ID:', error)
      throw error
    }
  }

  /**
   * 자산 실사 항목 생성 (모든 자산을 체크리스트에 추가)
   */
  async generateAuditItems(auditId: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // 기존 항목 삭제
        await client.query(`DELETE FROM asset_audit_items WHERE audit_id = $1`, [auditId])

        // 모든 자산을 실사 항목으로 추가
        const assetsResult = await client.query(`SELECT id FROM assets WHERE status != 'disposed'`)

        for (const asset of assetsResult.rows) {
          await client.query(
            `INSERT INTO asset_audit_items (audit_id, asset_id)
             VALUES ($1, $2)`,
            [auditId, asset.id],
          )
        }

        // 실사 상태를 in_progress로 변경
        await client.query(
          `UPDATE asset_audits SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
          [auditId],
        )
      })

      logger.info(`Audit items generated for audit: ${auditId}`)
    } catch (error) {
      logger.error('Failed to generate audit items:', error)
      throw error
    }
  }

  /**
   * 실사 항목 체크
   */
  async checkItem(
    itemId: string,
    checked: boolean,
    checkedBy: string,
    condition?: string,
    locationVerified?: boolean,
    discrepancyNotes?: string,
  ): Promise<void> {
    try {
      const result = await query(
        `UPDATE asset_audit_items 
         SET checked = $1, checked_at = $2, checked_by = $3, condition = $4,
             location_verified = $5, discrepancy_notes = $6
         WHERE id = $7`,
        [
          checked,
          checked ? new Date().toISOString() : null,
          checked ? checkedBy : null,
          condition || null,
          locationVerified || false,
          discrepancyNotes || null,
          itemId,
        ],
      )

      if (result.rowCount === 0) {
        throw new Error('실사 항목을 찾을 수 없습니다.')
      }

      logger.info(`Audit item checked: ${itemId}`)
    } catch (error) {
      logger.error('Failed to check audit item:', error)
      throw error
    }
  }

  /**
   * 실사 완료
   */
  async completeAudit(auditId: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // 모든 항목이 체크되었는지 확인
        const uncheckedResult = await client.query(
          `SELECT COUNT(*) as count FROM asset_audit_items 
           WHERE audit_id = $1 AND checked = false`,
          [auditId],
        )

        if (parseInt(uncheckedResult.rows[0].count) > 0) {
          throw new Error('모든 실사 항목을 체크해야 완료할 수 있습니다.')
        }

        // 실사 상태를 completed로 변경
        await client.query(
          `UPDATE asset_audits SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [auditId],
        )

        // 불일치 항목이 있는 자산의 상태 업데이트
        await client.query(
          `UPDATE assets 
           SET condition = ai.condition, updated_at = NOW()
           FROM asset_audit_items ai
           WHERE assets.id = ai.asset_id 
             AND ai.audit_id = $1 
             AND ai.discrepancy_notes IS NOT NULL`,
          [auditId],
        )
      })

      logger.info(`Audit completed: ${auditId}`)
    } catch (error) {
      logger.error('Failed to complete audit:', error)
      throw error
    }
  }

  /**
   * 실사 진행률 조회
   */
  async getAuditProgress(auditId: string): Promise<AuditProgress> {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN checked = true THEN 1 END) as checked_items,
          COUNT(CASE WHEN discrepancy_notes IS NOT NULL THEN 1 END) as discrepancies
        FROM asset_audit_items
        WHERE audit_id = $1`,
        [auditId],
      )

      const row = result.rows[0]
      const totalItems = parseInt(row.total_items)
      const checkedItems = parseInt(row.checked_items)
      const discrepancies = parseInt(row.discrepancies)
      const percentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

      return {
        total_items: totalItems,
        checked_items: checkedItems,
        percentage,
        discrepancies,
      }
    } catch (error) {
      logger.error('Failed to get audit progress:', error)
      throw error
    }
  }

  /**
   * 실사 요약 조회
   */
  async getAuditSummary(auditId: string): Promise<AuditSummary> {
    try {
      const audit = await this.getById(auditId)
      if (!audit) {
        throw new Error('실사를 찾을 수 없습니다.')
      }

      const progress = await this.getAuditProgress(auditId)

      // 자산 상태별 통계
      const statusResult = await query(
        `SELECT a.status, COUNT(*) as count
         FROM assets a
         JOIN asset_audit_items ai ON ai.asset_id = a.id
         WHERE ai.audit_id = $1
         GROUP BY a.status`,
        [auditId],
      )

      const assetsByStatus: Record<string, number> = {}
      statusResult.rows.forEach((row) => {
        assetsByStatus[row.status] = parseInt(row.count)
      })

      // 자산 상태별 통계
      const conditionResult = await query(
        `SELECT ai.condition, COUNT(*) as count
         FROM asset_audit_items ai
         WHERE ai.audit_id = $1 AND ai.condition IS NOT NULL
         GROUP BY ai.condition`,
        [auditId],
      )

      const assetsByCondition: Record<string, number> = {}
      conditionResult.rows.forEach((row) => {
        assetsByCondition[row.condition] = parseInt(row.count)
      })

      return {
        audit,
        progress,
        assets_by_status: assetsByStatus,
        assets_by_condition: assetsByCondition,
      }
    } catch (error) {
      logger.error('Failed to get audit summary:', error)
      throw error
    }
  }

  /**
   * 대시보드 통계 조회
   */
  async getDashboardStats(): Promise<any> {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as totalAudits,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as inProgressAudits,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedAudits,
          (SELECT COUNT(*) FROM physical_assets) as totalAssets
        FROM asset_audits`,
      )

      const stats = result.rows[0]

      // 최근 실사 목록과 각각의 진행률 조회
      const auditsResult = await query(
        `SELECT 
          id,
          audit_name,
          status,
          start_date,
          end_date,
          auditor_id,
          notes,
          created_at::text as created_at,
          updated_at::text as updated_at
        FROM asset_audits 
        ORDER BY created_at DESC 
        LIMIT 5`,
      )

      const audits = auditsResult.rows.map((audit) => ({
        auditId: audit.id,
        totalItems: 0, // TODO: 실제 자산 수 계산
        checkedItems: 0, // TODO: 체크된 자산 수 계산
        discrepancies: 0, // TODO: 불일치 자산 수 계산
      }))

      return {
        totalAudits: parseInt(stats.totalaudits) || 0,
        inProgressAudits: parseInt(stats.inprogressaudits) || 0,
        completedAudits: parseInt(stats.completedaudits) || 0,
        totalAssets: parseInt(stats.totalassets) || 0,
        audit: audits,
      }
    } catch (error) {
      logger.error('Failed to get dashboard stats:', error)
      throw error
    }
  }

  /**
   * 분기별 자동 실사 생성
   */
  async createQuarterlyAudit(year: number, quarter: number): Promise<DatabaseAssetAudit> {
    try {
      // 이미 해당 분기 실사가 있는지 확인
      const existingAudit = await query(
        `SELECT id FROM asset_audits WHERE audit_year = $1 AND audit_quarter = $2`,
        [year, quarter],
      )

      if (existingAudit.rows.length > 0) {
        throw new Error(`${year}년 ${quarter}분기 실사가 이미 존재합니다.`)
      }

      // 분기별 날짜 계산
      const quarterStartDates = [
        `${year}-01-01`, // 1분기
        `${year}-04-01`, // 2분기
        `${year}-07-01`, // 3분기
        `${year}-10-01`, // 4분기
      ]

      const quarterEndDates = [
        `${year}-03-31`, // 1분기
        `${year}-06-30`, // 2분기
        `${year}-09-30`, // 3분기
        `${year}-12-31`, // 4분기
      ]

      const startDate = quarterStartDates[quarter - 1]
      const endDate = quarterEndDates[quarter - 1]

      const audit = await this.createAudit({
        audit_name: `${year}년 ${quarter}분기 자산 실사`,
        audit_quarter: quarter,
        audit_year: year,
        start_date: startDate,
        end_date: endDate,
      })

      // 실사 항목 자동 생성
      await this.generateAuditItems(audit.id)

      logger.info(`Quarterly audit created: ${year}년 ${quarter}분기`)
      return audit
    } catch (error) {
      logger.error('Failed to create quarterly audit:', error)
      throw error
    }
  }

  /**
   * 실사 알림 스케줄링
   */
  async scheduleAuditReminders(): Promise<void> {
    try {
      // 진행 중인 실사가 있는지 확인
      const activeAudits = await query(
        `SELECT id, audit_name, end_date FROM asset_audits 
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
            await query(
              `INSERT INTO asset_notifications (
                notification_type, reference_type, reference_id, title, message,
                priority, scheduled_date
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                'audit_reminder',
                'audit',
                audit.id,
                `자산 실사 마감 알림`,
                `${audit.audit_name}의 마감일이 ${daysLeft}일 남았습니다.`,
                daysLeft <= 3 ? 'urgent' : 'high',
                new Date().toISOString().split('T')[0],
              ],
            )
          }
        }
      }

      logger.info('Audit reminders scheduled')
    } catch (error) {
      logger.error('Failed to schedule audit reminders:', error)
      throw error
    }
  }

  /**
   * 실사 삭제
   */
  async delete(auditId: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // 실사 항목 삭제
        await client.query(`DELETE FROM asset_audit_items WHERE audit_id = $1`, [auditId])

        // 알림 삭제
        await client.query(
          `DELETE FROM asset_notifications WHERE reference_type = 'audit' AND reference_id = $1`,
          [auditId],
        )

        // 실사 삭제
        await client.query(`DELETE FROM asset_audits WHERE id = $1`, [auditId])
      })

      logger.info(`Audit deleted: ${auditId}`)
    } catch (error) {
      logger.error('Failed to delete audit:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const auditService = new AuditService()
