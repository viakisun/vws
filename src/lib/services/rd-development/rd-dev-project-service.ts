/**
 * R&D Development Project Service
 * 프로젝트 CRUD 및 관련 데이터 관리
 */

import { query } from '$lib/database/connection'
import type {
  CreateRdDevProjectRequest,
  RdDevProject,
  RdDevProjectFilters,
  RdDevProjectStats,
  UpdateRdDevProjectRequest,
} from '$lib/types/rd-development'
import { logger } from '$lib/utils/logger'

export class RdDevProjectService {
  /**
   * 프로젝트 목록 조회
   */
  async getProjects(filters: RdDevProjectFilters = {}): Promise<RdDevProject[]> {
    try {
      let sql = `
        SELECT 
          rdp.id,
          rdp.project_id,
          rdp.project_type,
          rdp.total_duration_months,
          rdp.government_funding,
          rdp.institution_funding,
          rdp.phase_1_duration_months,
          rdp.phase_2_duration_months,
          rdp.phase_3_duration_months,
          rdp.created_at,
          rdp.updated_at,
          p.code,
          p.title,
          p.description,
          p.sponsor,
          p.status as project_status
        FROM rd_dev_projects rdp
        JOIN projects p ON rdp.project_id = p.id
        WHERE 1=1
      `

      const params: unknown[] = []
      let paramCount = 0

      if (filters.project_type) {
        paramCount++
        sql += ` AND rdp.project_type = $${paramCount}`
        params.push(filters.project_type)
      }

      if (filters.status) {
        paramCount++
        sql += ` AND p.status = $${paramCount}`
        params.push(filters.status)
      }

      if (filters.search) {
        paramCount++
        sql += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`
        params.push(`%${filters.search}%`)
      }

      sql += ' ORDER BY rdp.created_at DESC'

      if (filters.limit) {
        paramCount++
        sql += ` LIMIT $${paramCount}`
        params.push(filters.limit)
      }

      if (filters.offset) {
        paramCount++
        sql += ` OFFSET $${paramCount}`
        params.push(filters.offset)
      }

      const result = await query(sql, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch R&D development projects:', error)
      throw new Error('Failed to fetch projects')
    }
  }

  /**
   * 프로젝트 상세 조회
   */
  async getProjectById(id: string): Promise<RdDevProject | null> {
    try {
      const sql = `
        SELECT 
          rdp.id,
          rdp.project_id,
          rdp.project_type,
          rdp.total_duration_months,
          rdp.government_funding,
          rdp.institution_funding,
          rdp.phase_1_duration_months,
          rdp.phase_2_duration_months,
          rdp.phase_3_duration_months,
          rdp.created_at,
          rdp.updated_at,
          p.code,
          p.title,
          p.description,
          p.sponsor,
          p.status as project_status
        FROM rd_dev_projects rdp
        JOIN projects p ON rdp.project_id = p.id
        WHERE rdp.id = $1
      `

      const result = await query(sql, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch R&D development project by ID:', error)
      throw new Error('Failed to fetch project')
    }
  }

  /**
   * 프로젝트 생성
   */
  async createProject(projectId: string, data: CreateRdDevProjectRequest): Promise<RdDevProject> {
    try {
      const sql = `
        INSERT INTO rd_dev_projects (
          project_id,
          project_type,
          total_duration_months,
          government_funding,
          institution_funding,
          phase_1_duration_months,
          phase_2_duration_months,
          phase_3_duration_months
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING 
          id,
          project_id,
          project_type,
          total_duration_months,
          government_funding,
          institution_funding,
          phase_1_duration_months,
          phase_2_duration_months,
          phase_3_duration_months,
          created_at,
          updated_at
      `

      const params = [
        projectId,
        data.project_type,
        data.total_duration_months,
        data.government_funding || null,
        data.institution_funding || null,
        data.phase_1_duration_months || null,
        data.phase_2_duration_months || null,
        data.phase_3_duration_months || null,
      ]

      const result = await query(sql, params)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create R&D development project:', error)
      throw new Error('Failed to create project')
    }
  }

  /**
   * 프로젝트 수정
   */
  async updateProject(id: string, data: UpdateRdDevProjectRequest): Promise<RdDevProject> {
    try {
      const fields: string[] = []
      const params: unknown[] = []
      let paramCount = 0

      if (data.project_type !== undefined) {
        paramCount++
        fields.push(`project_type = $${paramCount}`)
        params.push(data.project_type)
      }

      if (data.total_duration_months !== undefined) {
        paramCount++
        fields.push(`total_duration_months = $${paramCount}`)
        params.push(data.total_duration_months)
      }

      if (data.government_funding !== undefined) {
        paramCount++
        fields.push(`government_funding = $${paramCount}`)
        params.push(data.government_funding)
      }

      if (data.institution_funding !== undefined) {
        paramCount++
        fields.push(`institution_funding = $${paramCount}`)
        params.push(data.institution_funding)
      }

      if (data.phase_1_duration_months !== undefined) {
        paramCount++
        fields.push(`phase_1_duration_months = $${paramCount}`)
        params.push(data.phase_1_duration_months)
      }

      if (data.phase_2_duration_months !== undefined) {
        paramCount++
        fields.push(`phase_2_duration_months = $${paramCount}`)
        params.push(data.phase_2_duration_months)
      }

      if (data.phase_3_duration_months !== undefined) {
        paramCount++
        fields.push(`phase_3_duration_months = $${paramCount}`)
        params.push(data.phase_3_duration_months)
      }

      if (fields.length === 0) {
        throw new Error('No fields to update')
      }

      paramCount++
      fields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE rd_dev_projects 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING 
          id,
          project_id,
          project_type,
          total_duration_months,
          government_funding,
          institution_funding,
          phase_1_duration_months,
          phase_2_duration_months,
          phase_3_duration_months,
          created_at,
          updated_at
      `

      params.push(id)
      const result = await query(sql, params)

      if (result.rows.length === 0) {
        throw new Error('Project not found')
      }

      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update R&D development project:', error)
      throw new Error('Failed to update project')
    }
  }

  /**
   * 프로젝트 삭제
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const sql = 'DELETE FROM rd_dev_projects WHERE id = $1'
      const result = await query(sql, [id])
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to delete R&D development project:', error)
      throw new Error('Failed to delete project')
    }
  }

  /**
   * 프로젝트 통계 조회
   */
  async getProjectStats(): Promise<RdDevProjectStats> {
    try {
      const sql = `
        SELECT 
          COUNT(DISTINCT rdp.id) as total_projects,
          COUNT(DISTINCT CASE WHEN p.status = 'active' THEN rdp.id END) as active_projects,
          COUNT(DISTINCT rdi.id) as institutions_count
        FROM rd_dev_projects rdp
        JOIN projects p ON rdp.project_id = p.id
        LEFT JOIN rd_dev_institutions rdi ON rdp.id = rdi.project_id
      `

      const result = await query(sql)
      const stats = result.rows[0]

      // Deliverables 통계
      const deliverablesSql = `
        SELECT 
          COUNT(*) as total_deliverables,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_deliverables
        FROM rd_dev_deliverables
      `

      const deliverablesResult = await query(deliverablesSql)
      const deliverablesStats = deliverablesResult.rows[0]

      // Phase 분포
      const phaseSql = `
        SELECT 
          CONCAT('Phase ', phase_number, '-Year ', year_number) as phase_name,
          COUNT(*) as count
        FROM rd_dev_phases
        WHERE status = 'active'
        GROUP BY phase_number, year_number
        ORDER BY phase_number, year_number
      `

      const phaseResult = await query(phaseSql)
      const currentPhaseDistribution = phaseResult.rows.reduce(
        (acc, row) => {
          acc[row.phase_name] = parseInt(row.count)
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        total_projects: parseInt(stats.total_projects),
        active_projects: parseInt(stats.active_projects),
        completed_deliverables: parseInt(deliverablesStats.completed_deliverables),
        total_deliverables: parseInt(deliverablesStats.total_deliverables),
        institutions_count: parseInt(stats.institutions_count),
        current_phase_distribution: currentPhaseDistribution,
      }
    } catch (error) {
      logger.error('Failed to fetch project statistics:', error)
      throw new Error('Failed to fetch statistics')
    }
  }

  /**
   * 프로젝트 ID로 R&D 개발 프로젝트 조회
   */
  async getProjectByProjectId(projectId: string): Promise<RdDevProject | null> {
    try {
      const sql = `
        SELECT 
          rdp.id,
          rdp.project_id,
          rdp.project_type,
          rdp.total_duration_months,
          rdp.government_funding,
          rdp.institution_funding,
          rdp.phase_1_duration_months,
          rdp.phase_2_duration_months,
          rdp.phase_3_duration_months,
          rdp.created_at,
          rdp.updated_at
        FROM rd_dev_projects rdp
        WHERE rdp.project_id = $1
      `

      const result = await query(sql, [projectId])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch R&D development project by project ID:', error)
      throw new Error('Failed to fetch project')
    }
  }
}
