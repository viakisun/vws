/**
 * Certification Service
 * 회사 인증/등록증 관리 비즈니스 로직
 */

import { query, transaction } from '$lib/database/connection'
import type {
  CertificationFilters,
  CompanyCertification,
  CreateCertificationDto,
  DatabaseCertificationRenewalHistory,
  DatabaseCompanyCertification,
} from '$lib/types/asset'
import { logger } from '$lib/utils/logger'

export class CertificationService {
  /**
   * 인증서 생성
   */
  async create(data: CreateCertificationDto): Promise<DatabaseCompanyCertification> {
    try {
      const result = await query<DatabaseCompanyCertification>(
        `INSERT INTO company_certifications (
          company_id, certification_type, certification_name, certification_number,
          issuing_authority, issue_date, expiry_date, renewal_required, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, company_id, certification_type, certification_name, certification_number,
                  issuing_authority, issue_date, expiry_date, status, renewal_required,
                  document_s3_key, ocr_confidence, notes,
                  created_at::text as created_at, updated_at::text as updated_at`,
        [
          data.company_id,
          data.certification_type,
          data.certification_name,
          data.certification_number || null,
          data.issuing_authority || null,
          data.issue_date || null,
          data.expiry_date || null,
          data.renewal_required || false,
          data.notes || null,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('인증서 생성에 실패했습니다.')
      }

      logger.info(`Certification created: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create certification:', error)
      throw error
    }
  }

  /**
   * OCR 결과로 인증서 생성
   */
  async createFromOcr(
    companyId: string,
    ocrResult: {
      certification_name: string
      certification_number?: string
      issuing_authority?: string
      issue_date?: string
      expiry_date?: string
      confidence: number
    },
    documentS3Key?: string,
  ): Promise<DatabaseCompanyCertification> {
    try {
      // 인증서 타입 자동 판별
      const certificationType = this.inferCertificationType(ocrResult.certification_name)

      const result = await query<DatabaseCompanyCertification>(
        `INSERT INTO company_certifications (
          company_id, certification_type, certification_name, certification_number,
          issuing_authority, issue_date, expiry_date, renewal_required, 
          document_s3_key, ocr_confidence
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, company_id, certification_type, certification_name, certification_number,
                  issuing_authority, issue_date, expiry_date, status, renewal_required,
                  document_s3_key, ocr_confidence, notes,
                  created_at::text as created_at, updated_at::text as updated_at`,
        [
          companyId,
          certificationType,
          ocrResult.certification_name,
          ocrResult.certification_number || null,
          ocrResult.issuing_authority || null,
          ocrResult.issue_date || null,
          ocrResult.expiry_date || null,
          true, // 갱신 필요로 기본 설정
          documentS3Key || null,
          ocrResult.confidence,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('OCR 인증서 생성에 실패했습니다.')
      }

      logger.info(`Certification created from OCR: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create certification from OCR:', error)
      throw error
    }
  }

  /**
   * 인증서 타입 자동 판별
   */
  private inferCertificationType(certificationName: string): string {
    const name = certificationName.toLowerCase()

    if (name.includes('전문연구사업자') || name.includes('연구개발전담부서')) {
      return 'research_business'
    }
    if (name.includes('벤처') || name.includes('벤처기업')) {
      return 'venture'
    }
    if (name.includes('이노비즈') || name.includes('innobiz')) {
      return 'innobiz'
    }
    if (name.includes('공장등록') || name.includes('공장설립')) {
      return 'factory_registration'
    }
    if (name.includes('iso')) {
      return 'iso'
    }
    if (name.includes('품질') || name.includes('품질경영')) {
      return 'quality'
    }
    if (name.includes('환경') || name.includes('환경경영')) {
      return 'environment'
    }
    if (name.includes('안전') || name.includes('안전보건')) {
      return 'safety'
    }

    return 'other'
  }

  /**
   * 인증서 ID로 조회
   */
  async getById(id: string): Promise<CompanyCertification | null> {
    try {
      const result = await query<CompanyCertification>(
        `SELECT 
          c.id, c.company_id, c.certification_type, c.certification_name, c.certification_number,
          c.issuing_authority, c.issue_date, c.expiry_date, c.status, c.renewal_required,
          c.document_s3_key, c.ocr_confidence, c.notes,
          c.created_at::text as created_at, c.updated_at::text as updated_at,
          comp.name as company_name,
          rh.id as renewal_id, rh.renewal_date as rh_renewal_date, rh.expiry_date as rh_expiry_date,
          rh.notes as rh_notes, rh.created_at as rh_created_at
        FROM company_certifications c
        LEFT JOIN companies comp ON comp.id = c.company_id
        LEFT JOIN certification_renewal_history rh ON rh.certification_id = c.id
        WHERE c.id = $1
        ORDER BY rh.renewal_date DESC`,
        [id],
      )

      if (!result.rows[0]) return null

      const cert = result.rows[0]
      const renewalHistory = result.rows
        .filter((row) => row.renewal_id)
        .map((row) => ({
          id: row.renewal_id,
          certification_id: cert.id,
          renewal_date: row.rh_renewal_date,
          expiry_date: row.rh_expiry_date,
          notes: row.rh_notes,
          created_at: row.rh_created_at,
          renewed_by: null,
        }))

      return {
        ...cert,
        company: cert.company_name
          ? {
              id: cert.company_id,
              name: cert.company_name,
            }
          : undefined,
        renewal_history: renewalHistory,
      }
    } catch (error) {
      logger.error('Failed to get certification by ID:', error)
      throw error
    }
  }

  /**
   * 인증서 목록 조회
   */
  async list(filters: CertificationFilters = {}): Promise<CompanyCertification[]> {
    try {
      const conditions: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (filters.company_id) {
        conditions.push(`c.company_id = $${paramIndex++}`)
        params.push(filters.company_id)
      }

      if (filters.certification_type) {
        conditions.push(`c.certification_type = $${paramIndex++}`)
        params.push(filters.certification_type)
      }

      if (filters.status) {
        conditions.push(`c.status = $${paramIndex++}`)
        params.push(filters.status)
      }

      if (filters.expiry_soon) {
        conditions.push(`c.expiry_date IS NOT NULL AND c.expiry_date <= $${paramIndex++}`)
        params.push(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const limitClause = filters.limit ? `LIMIT $${paramIndex++}` : ''
      const offsetClause = filters.offset ? `OFFSET $${paramIndex++}` : ''

      if (filters.limit) params.push(filters.limit)
      if (filters.offset) params.push(filters.offset)

      const result = await query<CompanyCertification>(
        `SELECT 
          c.id, c.company_id, c.certification_type, c.certification_name, c.certification_number,
          c.issuing_authority, c.issue_date, c.expiry_date, c.status, c.renewal_required,
          c.document_s3_key, c.ocr_confidence, c.notes,
          c.created_at::text as created_at, c.updated_at::text as updated_at,
          comp.name as company_name
        FROM company_certifications c
        LEFT JOIN companies comp ON comp.id = c.company_id
        ${whereClause}
        ORDER BY c.created_at DESC
        ${limitClause} ${offsetClause}`,
        params,
      )

      return result.rows.map((cert) => ({
        ...cert,
        company: cert.company_name
          ? {
              id: cert.company_id,
              name: cert.company_name,
            }
          : undefined,
        renewal_history: [],
      }))
    } catch (error) {
      logger.error('Failed to list certifications:', error)
      throw error
    }
  }

  /**
   * 인증서 업데이트
   */
  async update(
    id: string,
    data: Partial<
      CreateCertificationDto & {
        status?: string
        document_s3_key?: string
        ocr_confidence?: number
      }
    >,
  ): Promise<DatabaseCompanyCertification> {
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

      const result = await query<DatabaseCompanyCertification>(
        `UPDATE company_certifications 
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, company_id, certification_type, certification_name, certification_number,
                   issuing_authority, issue_date, expiry_date, status, renewal_required,
                   document_s3_key, ocr_confidence, notes,
                   created_at::text as created_at, updated_at::text as updated_at`,
        params,
      )

      if (!result.rows[0]) {
        throw new Error('인증서를 찾을 수 없습니다.')
      }

      logger.info(`Certification updated: ${id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update certification:', error)
      throw error
    }
  }

  /**
   * 갱신 이력 추가
   */
  async addRenewalHistory(
    certificationId: string,
    renewalDate: string,
    expiryDate: string,
    notes?: string,
    renewedBy?: string,
  ): Promise<DatabaseCertificationRenewalHistory> {
    try {
      const result = await query<DatabaseCertificationRenewalHistory>(
        `INSERT INTO certification_renewal_history (
          certification_id, renewal_date, expiry_date, notes, renewed_by
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, certification_id, renewal_date, expiry_date, notes,
                  renewed_by, created_at::text as created_at`,
        [certificationId, renewalDate, expiryDate, notes || null, renewedBy || null],
      )

      if (!result.rows[0]) {
        throw new Error('갱신 이력 추가에 실패했습니다.')
      }

      // 인증서의 expiry_date 업데이트
      await query(
        `UPDATE company_certifications 
         SET expiry_date = $1, updated_at = NOW()
         WHERE id = $2`,
        [expiryDate, certificationId],
      )

      logger.info(`Renewal history added for certification: ${certificationId}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to add renewal history:', error)
      throw error
    }
  }

  /**
   * 만료 임박 인증서 조회
   */
  async getExpiringSoon(daysAhead = 60): Promise<CompanyCertification[]> {
    try {
      const targetDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const result = await query<CompanyCertification>(
        `SELECT 
          c.id, c.company_id, c.certification_type, c.certification_name, c.certification_number,
          c.issuing_authority, c.issue_date, c.expiry_date, c.status, c.renewal_required,
          c.document_s3_key, c.ocr_confidence, c.notes,
          c.created_at::text as created_at, c.updated_at::text as updated_at,
          comp.name as company_name
        FROM company_certifications c
        LEFT JOIN companies comp ON comp.id = c.company_id
        WHERE c.expiry_date IS NOT NULL 
          AND c.expiry_date <= $1 
          AND c.status = 'active'
        ORDER BY c.expiry_date ASC`,
        [targetDate],
      )

      return result.rows.map((cert) => ({
        ...cert,
        company: cert.company_name
          ? {
              id: cert.company_id,
              name: cert.company_name,
            }
          : undefined,
        renewal_history: [],
      }))
    } catch (error) {
      logger.error('Failed to get expiring certifications:', error)
      throw error
    }
  }

  /**
   * 만료 알림 스케줄링
   */
  async scheduleExpiryNotifications(): Promise<void> {
    try {
      const notificationDates = [60, 30, 7] // 일 단위

      for (const days of notificationDates) {
        const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]

        const certs = await query<DatabaseCompanyCertification>(
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
            await query(
              `INSERT INTO asset_notifications (
                notification_type, reference_type, reference_id, title, message,
                priority, scheduled_date
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                'expiry_warning',
                'certification',
                cert.id,
                `인증서 만료 알림 (D-${days})`,
                `${cert.certification_name}의 만료일이 ${days}일 남았습니다.`,
                days <= 7 ? 'urgent' : days <= 30 ? 'high' : 'normal',
                targetDate,
              ],
            )
          }
        }
      }

      logger.info('Certification expiry notifications scheduled')
    } catch (error) {
      logger.error('Failed to schedule expiry notifications:', error)
      throw error
    }
  }

  /**
   * 인증서 상태 업데이트 (만료 처리 등)
   */
  async updateStatus(id: string, status: string): Promise<void> {
    try {
      const result = await query(
        `UPDATE company_certifications 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [status, id],
      )

      if (result.rowCount === 0) {
        throw new Error('인증서를 찾을 수 없습니다.')
      }

      logger.info(`Certification status updated: ${id} -> ${status}`)
    } catch (error) {
      logger.error('Failed to update certification status:', error)
      throw error
    }
  }

  /**
   * 인증서 통계 조회
   */
  async getStats(): Promise<{
    total: number
    by_type: Record<string, number>
    by_status: Record<string, number>
    expiring_soon: number
  }> {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 1 END) as expiring_soon
        FROM company_certifications`,
      )

      const typeResult = await query(
        `SELECT certification_type, COUNT(*) as count
         FROM company_certifications
         GROUP BY certification_type`,
      )

      const statusResult = await query(
        `SELECT status, COUNT(*) as count
         FROM company_certifications
         GROUP BY status`,
      )

      const byType: Record<string, number> = {}
      typeResult.rows.forEach((row) => {
        byType[row.certification_type] = parseInt(row.count)
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
      }
    } catch (error) {
      logger.error('Failed to get certification stats:', error)
      throw error
    }
  }

  /**
   * 인증서 삭제
   */
  async delete(id: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // 갱신 이력 삭제
        await client.query(
          `DELETE FROM certification_renewal_history WHERE certification_id = $1`,
          [id],
        )

        // 알림 삭제
        await client.query(
          `DELETE FROM asset_notifications WHERE reference_type = 'certification' AND reference_id = $1`,
          [id],
        )

        // 인증서 삭제
        await client.query(`DELETE FROM company_certifications WHERE id = $1`, [id])
      })

      logger.info(`Certification deleted: ${id}`)
    } catch (error) {
      logger.error('Failed to delete certification:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const certificationService = new CertificationService()
