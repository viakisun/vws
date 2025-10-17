/**
 * R&D Development VIA Role Service
 * VIA 역할 및 통합 포인트 관리
 */

import { query } from '$lib/database/connection'
import type {
  CreateRdDevViaRoleRequest,
  RdDevViaRole,
  RdDevViaRoleCategory,
} from '$lib/types/rd-development'
import { logger } from '$lib/utils/logger'

export class RdDevViaRoleService {
  /**
   * 필터를 사용한 VIA 역할 조회
   */
  async getViaRoles(filters: {
    project_id?: number
    phase_id?: number
    category?: string
    search?: string
  }): Promise<RdDevViaRole[]> {
    try {
      let sql = `
        SELECT 
          id,
          project_id,
          phase_id,
          role_category,
          role_title,
          role_description,
          technical_details,
          integration_points,
          created_at,
          updated_at
        FROM rd_dev_via_roles
        WHERE 1=1
      `
      const params: unknown[] = []
      let paramCount = 0

      if (filters.project_id) {
        paramCount++
        sql += ` AND project_id = $${paramCount}`
        params.push(filters.project_id)
      }

      if (filters.phase_id) {
        paramCount++
        sql += ` AND phase_id = $${paramCount}`
        params.push(filters.phase_id)
      }

      if (filters.category) {
        paramCount++
        sql += ` AND role_category = $${paramCount}`
        params.push(filters.category)
      }

      if (filters.search) {
        paramCount++
        sql += ` AND (role_title ILIKE $${paramCount} OR role_description ILIKE $${paramCount})`
        params.push(`%${filters.search}%`)
      }

      sql += ` ORDER BY role_title`

      const result = await query(sql, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch VIA roles:', error)
      throw new Error('Failed to fetch VIA roles')
    }
  }

  /**
   * 프로젝트의 모든 VIA 역할 조회
   */
  async getViaRolesByProjectId(projectId: string): Promise<RdDevViaRole[]> {
    try {
      const sql = `
        SELECT 
          vr.id,
          vr.project_id,
          vr.phase_id,
          vr.role_category,
          vr.role_title,
          vr.role_description,
          vr.technical_details,
          vr.integration_points,
          vr.created_at,
          vr.updated_at,
          p.phase_number,
          p.year_number
        FROM rd_dev_via_roles vr
        LEFT JOIN rd_dev_phases p ON vr.phase_id = p.id
        WHERE vr.project_id = $1
        ORDER BY vr.role_category, p.phase_number, p.year_number
      `

      const result = await query(sql, [projectId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch VIA roles by project ID:', error)
      throw new Error('Failed to fetch VIA roles')
    }
  }

  /**
   * VIA 역할 상세 조회
   */
  async getViaRoleById(id: string): Promise<RdDevViaRole | null> {
    try {
      const sql = `
        SELECT 
          id,
          project_id,
          phase_id,
          role_category,
          role_title,
          role_description,
          technical_details,
          integration_points,
          created_at,
          updated_at
        FROM rd_dev_via_roles
        WHERE id = $1
      `

      const result = await query(sql, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch VIA role by ID:', error)
      throw new Error('Failed to fetch VIA role')
    }
  }

  /**
   * VIA 역할 생성
   */
  async createViaRole(projectId: string, data: CreateRdDevViaRoleRequest): Promise<RdDevViaRole> {
    try {
      const sql = `
        INSERT INTO rd_dev_via_roles (
          project_id,
          phase_id,
          role_category,
          role_title,
          role_description,
          technical_details,
          integration_points
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
          id,
          project_id,
          phase_id,
          role_category,
          role_title,
          role_description,
          technical_details,
          integration_points,
          created_at,
          updated_at
      `

      const params = [
        projectId,
        data.phase_id || null,
        data.role_category,
        data.role_title,
        data.role_description || null,
        JSON.stringify(data.technical_details || {}),
        JSON.stringify(data.integration_points || []),
      ]

      const result = await query(sql, params)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create VIA role:', error)
      throw new Error('Failed to create VIA role')
    }
  }

  /**
   * VIA 역할 수정
   */
  async updateViaRole(id: string, data: Partial<CreateRdDevViaRoleRequest>): Promise<RdDevViaRole> {
    try {
      const fields: string[] = []
      const params: unknown[] = []
      let paramCount = 0

      if (data.phase_id !== undefined) {
        paramCount++
        fields.push(`phase_id = $${paramCount}`)
        params.push(data.phase_id)
      }

      if (data.role_category !== undefined) {
        paramCount++
        fields.push(`role_category = $${paramCount}`)
        params.push(data.role_category)
      }

      if (data.role_title !== undefined) {
        paramCount++
        fields.push(`role_title = $${paramCount}`)
        params.push(data.role_title)
      }

      if (data.role_description !== undefined) {
        paramCount++
        fields.push(`role_description = $${paramCount}`)
        params.push(data.role_description)
      }

      if (data.technical_details !== undefined) {
        paramCount++
        fields.push(`technical_details = $${paramCount}`)
        params.push(JSON.stringify(data.technical_details))
      }

      if (data.integration_points !== undefined) {
        paramCount++
        fields.push(`integration_points = $${paramCount}`)
        params.push(JSON.stringify(data.integration_points))
      }

      if (fields.length === 0) {
        throw new Error('No fields to update')
      }

      paramCount++
      fields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE rd_dev_via_roles 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING 
          id,
          project_id,
          phase_id,
          role_category,
          role_title,
          role_description,
          technical_details,
          integration_points,
          created_at,
          updated_at
      `

      params.push(id)
      const result = await query(sql, params)

      if (result.rows.length === 0) {
        throw new Error('VIA role not found')
      }

      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update VIA role:', error)
      throw new Error('Failed to update VIA role')
    }
  }

  /**
   * VIA 역할 삭제
   */
  async deleteViaRole(id: string): Promise<boolean> {
    try {
      const sql = 'DELETE FROM rd_dev_via_roles WHERE id = $1'
      const result = await query(sql, [id])
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to delete VIA role:', error)
      throw new Error('Failed to delete VIA role')
    }
  }

  /**
   * 역할 카테고리별 VIA 역할 조회
   */
  async getViaRolesByCategory(
    projectId: string,
    category: RdDevViaRoleCategory,
  ): Promise<RdDevViaRole[]> {
    try {
      const sql = `
        SELECT 
          vr.id,
          vr.project_id,
          vr.phase_id,
          vr.role_category,
          vr.role_title,
          vr.role_description,
          vr.technical_details,
          vr.integration_points,
          vr.created_at,
          vr.updated_at,
          p.phase_number,
          p.year_number
        FROM rd_dev_via_roles vr
        LEFT JOIN rd_dev_phases p ON vr.phase_id = p.id
        WHERE vr.project_id = $1 AND vr.role_category = $2
        ORDER BY p.phase_number, p.year_number
      `

      const result = await query(sql, [projectId, category])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch VIA roles by category:', error)
      throw new Error('Failed to fetch VIA roles by category')
    }
  }

  /**
   * 단계별 VIA 역할 조회
   */
  async getViaRolesByPhase(phaseId: string): Promise<RdDevViaRole[]> {
    try {
      const sql = `
        SELECT 
          id,
          project_id,
          phase_id,
          role_category,
          role_title,
          role_description,
          technical_details,
          integration_points,
          created_at,
          updated_at
        FROM rd_dev_via_roles
        WHERE phase_id = $1
        ORDER BY role_category
      `

      const result = await query(sql, [phaseId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch VIA roles by phase:', error)
      throw new Error('Failed to fetch VIA roles by phase')
    }
  }

  /**
   * VIA 역할 통계
   */
  async getViaRoleStats(projectId: string): Promise<{
    total_roles: number
    roles_by_category: Record<string, number>
    roles_by_phase: Record<string, number>
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_roles,
          role_category,
          p.phase_number,
          p.year_number
        FROM rd_dev_via_roles vr
        LEFT JOIN rd_dev_phases p ON vr.phase_id = p.id
        WHERE vr.project_id = $1
        GROUP BY role_category, p.phase_number, p.year_number
      `

      const result = await query(sql, [projectId])

      const total_roles = result.rows.reduce((sum, row) => sum + parseInt(row.total_roles), 0)
      const roles_by_category: Record<string, number> = {}
      const roles_by_phase: Record<string, number> = {}

      result.rows.forEach((row) => {
        // 카테고리별 집계
        if (roles_by_category[row.role_category]) {
          roles_by_category[row.role_category] += parseInt(row.total_roles)
        } else {
          roles_by_category[row.role_category] = parseInt(row.total_roles)
        }

        // 단계별 집계
        if (row.phase_number && row.year_number) {
          const phaseKey = `Phase ${row.phase_number}-Year ${row.year_number}`
          if (roles_by_phase[phaseKey]) {
            roles_by_phase[phaseKey] += parseInt(row.total_roles)
          } else {
            roles_by_phase[phaseKey] = parseInt(row.total_roles)
          }
        }
      })

      return {
        total_roles,
        roles_by_category,
        roles_by_phase,
      }
    } catch (error) {
      logger.error('Failed to fetch VIA role stats:', error)
      throw new Error('Failed to fetch VIA role stats')
    }
  }

  /**
   * 통합 매트릭스 데이터 생성
   */
  async getIntegrationMatrix(projectId: string): Promise<
    Array<{
      via_role: string
      institution: string
      integration_type: string
      description: string
    }>
  > {
    try {
      const sql = `
        SELECT 
          vr.role_category,
          vr.role_title,
          vr.integration_points,
          vr.technical_details
        FROM rd_dev_via_roles vr
        WHERE vr.project_id = $1
      `

      const result = await query(sql, [projectId])
      const matrix: Array<{
        via_role: string
        institution: string
        integration_type: string
        description: string
      }> = []

      result.rows.forEach((row) => {
        const integrationPoints = Array.isArray(row.integration_points)
          ? row.integration_points
          : []

        integrationPoints.forEach((point: string) => {
          matrix.push({
            via_role: `${row.role_category}: ${row.role_title}`,
            institution: point,
            integration_type: 'collaboration',
            description: row.technical_details?.description || '통합 협업',
          })
        })
      })

      return matrix
    } catch (error) {
      logger.error('Failed to fetch integration matrix:', error)
      throw new Error('Failed to fetch integration matrix')
    }
  }
}
