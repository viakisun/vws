/**
 * R&D Development Institution Service
 * 참여기관 관리
 */

import { query } from '$lib/database/connection'
import type { CreateRdDevInstitutionRequest, RdDevInstitution } from '$lib/types/rd-development'
import { logger } from '$lib/utils/logger'

export class RdDevInstitutionService {
  /**
   * 필터를 사용한 참여기관 조회
   */
  async getInstitutions(filters: {
    project_id?: number
    type?: string
    search?: string
  }): Promise<RdDevInstitution[]> {
    try {
      let sql = `
        SELECT 
          id,
          project_id,
          institution_name,
          institution_type,
          role_description,
          primary_researcher_name,
          contact_info,
          created_at,
          updated_at
        FROM rd_dev_institutions
        WHERE 1=1
      `
      const params: unknown[] = []
      let paramCount = 0

      if (filters.project_id) {
        paramCount++
        sql += ` AND project_id = $${paramCount}`
        params.push(filters.project_id)
      }

      if (filters.type) {
        paramCount++
        sql += ` AND institution_type = $${paramCount}`
        params.push(filters.type)
      }

      if (filters.search) {
        paramCount++
        sql += ` AND (institution_name ILIKE $${paramCount} OR role_description ILIKE $${paramCount})`
        params.push(`%${filters.search}%`)
      }

      sql += ` ORDER BY institution_name`

      const result = await query(sql, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch institutions:', error)
      throw new Error('Failed to fetch institutions')
    }
  }

  /**
   * 프로젝트의 모든 참여기관 조회
   */
  async getInstitutionsByProjectId(projectId: string): Promise<RdDevInstitution[]> {
    try {
      const sql = `
        SELECT 
          id,
          project_id,
          institution_name,
          institution_type,
          role_description,
          primary_researcher_name,
          contact_info,
          created_at,
          updated_at
        FROM rd_dev_institutions
        WHERE project_id = $1
        ORDER BY institution_name
      `

      const result = await query(sql, [projectId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch institutions by project ID:', error)
      throw new Error('Failed to fetch institutions')
    }
  }

  /**
   * 기관 상세 조회
   */
  async getInstitutionById(id: string): Promise<RdDevInstitution | null> {
    try {
      const sql = `
        SELECT 
          id,
          project_id,
          institution_name,
          institution_type,
          role_description,
          primary_researcher_name,
          contact_info,
          created_at,
          updated_at
        FROM rd_dev_institutions
        WHERE id = $1
      `

      const result = await query(sql, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch institution by ID:', error)
      throw new Error('Failed to fetch institution')
    }
  }

  /**
   * 기관 생성
   */
  async createInstitution(
    projectId: string,
    data: CreateRdDevInstitutionRequest,
  ): Promise<RdDevInstitution> {
    try {
      const sql = `
        INSERT INTO rd_dev_institutions (
          project_id,
          institution_name,
          institution_type,
          role_description,
          primary_researcher_name,
          contact_info
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id,
          project_id,
          institution_name,
          institution_type,
          role_description,
          primary_researcher_name,
          contact_info,
          created_at,
          updated_at
      `

      const params = [
        projectId,
        data.institution_name,
        data.institution_type || null,
        data.role_description || null,
        data.primary_researcher_name || null,
        JSON.stringify(data.contact_info || {}),
      ]

      const result = await query(sql, params)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create institution:', error)
      throw new Error('Failed to create institution')
    }
  }

  /**
   * 기관 수정
   */
  async updateInstitution(
    id: string,
    data: Partial<CreateRdDevInstitutionRequest>,
  ): Promise<RdDevInstitution> {
    try {
      const fields: string[] = []
      const params: unknown[] = []
      let paramCount = 0

      if (data.institution_name !== undefined) {
        paramCount++
        fields.push(`institution_name = $${paramCount}`)
        params.push(data.institution_name)
      }

      if (data.institution_type !== undefined) {
        paramCount++
        fields.push(`institution_type = $${paramCount}`)
        params.push(data.institution_type)
      }

      if (data.role_description !== undefined) {
        paramCount++
        fields.push(`role_description = $${paramCount}`)
        params.push(data.role_description)
      }

      if (data.primary_researcher_name !== undefined) {
        paramCount++
        fields.push(`primary_researcher_name = $${paramCount}`)
        params.push(data.primary_researcher_name)
      }

      if (data.contact_info !== undefined) {
        paramCount++
        fields.push(`contact_info = $${paramCount}`)
        params.push(JSON.stringify(data.contact_info))
      }

      if (fields.length === 0) {
        throw new Error('No fields to update')
      }

      paramCount++
      fields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE rd_dev_institutions 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING 
          id,
          project_id,
          institution_name,
          institution_type,
          role_description,
          primary_researcher_name,
          contact_info,
          created_at,
          updated_at
      `

      params.push(id)
      const result = await query(sql, params)

      if (result.rows.length === 0) {
        throw new Error('Institution not found')
      }

      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update institution:', error)
      throw new Error('Failed to update institution')
    }
  }

  /**
   * 기관 삭제
   */
  async deleteInstitution(id: string): Promise<boolean> {
    try {
      const sql = 'DELETE FROM rd_dev_institutions WHERE id = $1'
      const result = await query(sql, [id])
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to delete institution:', error)
      throw new Error('Failed to delete institution')
    }
  }

  /**
   * 기관별 산출물 및 역할 요약
   */
  async getInstitutionSummary(projectId: string): Promise<
    Array<{
      institution: RdDevInstitution
      deliverables_count: number
      completed_deliverables: number
      via_roles: string[]
    }>
  > {
    try {
      const sql = `
        SELECT 
          i.id,
          i.project_id,
          i.institution_name,
          i.institution_type,
          i.role_description,
          i.primary_researcher_name,
          i.contact_info,
          i.created_at,
          i.updated_at,
          COUNT(d.id) as deliverables_count,
          COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as completed_deliverables
        FROM rd_dev_institutions i
        LEFT JOIN rd_dev_deliverables d ON i.id = d.institution_id
        WHERE i.project_id = $1
        GROUP BY i.id, i.project_id, i.institution_name, i.institution_type, 
                 i.role_description, i.primary_researcher_name, i.contact_info, 
                 i.created_at, i.updated_at
        ORDER BY i.institution_name
      `

      const result = await query(sql, [projectId])

      // VIA 역할 정보 추가
      const institutionSummaries = await Promise.all(
        result.rows.map(async (row) => {
          const viaRolesSql = `
            SELECT DISTINCT role_category
            FROM rd_dev_via_roles vr
            WHERE vr.project_id = $1
            AND (
              vr.integration_points::text ILIKE '%' || $2 || '%'
              OR vr.technical_details::text ILIKE '%' || $2 || '%'
            )
          `

          const viaRolesResult = await query(viaRolesSql, [projectId, row.institution_name])
          const viaRoles = viaRolesResult.rows.map((r) => r.role_category)

          return {
            institution: {
              id: row.id,
              project_id: row.project_id,
              institution_name: row.institution_name,
              institution_type: row.institution_type,
              role_description: row.role_description,
              primary_researcher_name: row.primary_researcher_name,
              contact_info: row.contact_info,
              created_at: row.created_at,
              updated_at: row.updated_at,
            },
            deliverables_count: parseInt(row.deliverables_count),
            completed_deliverables: parseInt(row.completed_deliverables),
            via_roles: viaRoles,
          }
        }),
      )

      return institutionSummaries
    } catch (error) {
      logger.error('Failed to fetch institution summary:', error)
      throw new Error('Failed to fetch institution summary')
    }
  }

  /**
   * 기관별 연계 매트릭스 데이터
   */
  async getInstitutionMatrix(projectId: string): Promise<
    Array<{
      institution_name: string
      role_description: string
      via_connections: Array<{
        role_category: string
        connection_type: string
        description: string
      }>
    }>
  > {
    try {
      const institutions = await this.getInstitutionsByProjectId(projectId)

      const matrix = await Promise.all(
        institutions.map(async (institution) => {
          const connectionsSql = `
            SELECT 
              role_category,
              technical_details,
              integration_points
            FROM rd_dev_via_roles
            WHERE project_id = $1
            AND (
              integration_points::text ILIKE '%' || $2 || '%'
              OR technical_details::text ILIKE '%' || $2 || '%'
            )
          `

          const connectionsResult = await query(connectionsSql, [
            projectId,
            institution.institution_name,
          ])

          const via_connections = connectionsResult.rows.map((row) => ({
            role_category: row.role_category,
            connection_type: 'integration',
            description: Array.isArray(row.integration_points)
              ? row.integration_points.join(', ')
              : row.technical_details?.description || '통합 연계',
          }))

          return {
            institution_name: institution.institution_name,
            role_description: institution.role_description || '',
            via_connections,
          }
        }),
      )

      return matrix
    } catch (error) {
      logger.error('Failed to fetch institution matrix:', error)
      throw new Error('Failed to fetch institution matrix')
    }
  }
}
