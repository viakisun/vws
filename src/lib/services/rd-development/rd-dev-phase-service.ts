/**
 * R&D Development Phase Service
 * 프로젝트 단계 관리
 */

import { query } from '$lib/database/connection'
import type {
  CreateRdDevPhaseRequest,
  RdDevPhase,
  RdDevPhaseProgress,
} from '$lib/types/rd-development'
import { logger } from '$lib/utils/logger'

export class RdDevPhaseService {
  /**
   * 프로젝트의 모든 단계 조회
   */
  async getPhasesByProjectId(projectId: string): Promise<RdDevPhase[]> {
    try {
      const sql = `
        SELECT 
          id,
          project_id,
          phase_number,
          year_number,
          start_date,
          end_date,
          status,
          objectives,
          key_technologies,
          created_at,
          updated_at
        FROM rd_dev_phases
        WHERE project_id = $1
        ORDER BY phase_number, year_number
      `

      const result = await query(sql, [projectId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch phases by project ID:', error)
      throw new Error('Failed to fetch phases')
    }
  }

  /**
   * 단계 상세 조회
   */
  async getPhaseById(id: string): Promise<RdDevPhase | null> {
    try {
      const sql = `
        SELECT 
          id,
          project_id,
          phase_number,
          year_number,
          start_date,
          end_date,
          status,
          objectives,
          key_technologies,
          created_at,
          updated_at
        FROM rd_dev_phases
        WHERE id = $1
      `

      const result = await query(sql, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch phase by ID:', error)
      throw new Error('Failed to fetch phase')
    }
  }

  /**
   * 단계 생성
   */
  async createPhase(projectId: string, data: CreateRdDevPhaseRequest): Promise<RdDevPhase> {
    try {
      const sql = `
        INSERT INTO rd_dev_phases (
          project_id,
          phase_number,
          year_number,
          start_date,
          end_date,
          objectives,
          key_technologies
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
          id,
          project_id,
          phase_number,
          year_number,
          start_date,
          end_date,
          status,
          objectives,
          key_technologies,
          created_at,
          updated_at
      `

      const params = [
        projectId,
        data.phase_number,
        data.year_number,
        data.start_date,
        data.end_date,
        JSON.stringify(data.objectives),
        JSON.stringify(data.key_technologies),
      ]

      const result = await query(sql, params)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create phase:', error)
      throw new Error('Failed to create phase')
    }
  }

  /**
   * 단계 수정
   */
  async updatePhase(
    id: string,
    data: Partial<CreateRdDevPhaseRequest & { status?: string }>,
  ): Promise<RdDevPhase> {
    try {
      const fields = []
      const params: unknown[] = []
      let paramCount = 0

      if (data.phase_number !== undefined) {
        paramCount++
        fields.push(`phase_number = $${paramCount}`)
        params.push(data.phase_number)
      }

      if (data.year_number !== undefined) {
        paramCount++
        fields.push(`year_number = $${paramCount}`)
        params.push(data.year_number)
      }

      if (data.start_date !== undefined) {
        paramCount++
        fields.push(`start_date = $${paramCount}`)
        params.push(data.start_date)
      }

      if (data.end_date !== undefined) {
        paramCount++
        fields.push(`end_date = $${paramCount}`)
        params.push(data.end_date)
      }

      if (data.status !== undefined) {
        paramCount++
        fields.push(`status = $${paramCount}`)
        params.push(data.status)
      }

      if (data.objectives !== undefined) {
        paramCount++
        fields.push(`objectives = $${paramCount}`)
        params.push(JSON.stringify(data.objectives))
      }

      if (data.key_technologies !== undefined) {
        paramCount++
        fields.push(`key_technologies = $${paramCount}`)
        params.push(JSON.stringify(data.key_technologies))
      }

      if (fields.length === 0) {
        throw new Error('No fields to update')
      }

      paramCount++
      fields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE rd_dev_phases 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING 
          id,
          project_id,
          phase_number,
          year_number,
          start_date,
          end_date,
          status,
          objectives,
          key_technologies,
          created_at,
          updated_at
      `

      params.push(id)
      const result = await query(sql, params)

      if (result.rows.length === 0) {
        throw new Error('Phase not found')
      }

      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update phase:', error)
      throw new Error('Failed to update phase')
    }
  }

  /**
   * 단계 삭제
   */
  async deletePhase(id: string): Promise<boolean> {
    try {
      const sql = 'DELETE FROM rd_dev_phases WHERE id = $1'
      const result = await query(sql, [id])
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to delete phase:', error)
      throw new Error('Failed to delete phase')
    }
  }

  /**
   * 프로젝트의 현재 활성 단계 조회
   */
  async getCurrentActivePhase(projectId: string): Promise<RdDevPhase | null> {
    try {
      const sql = `
        SELECT 
          id,
          project_id,
          phase_number,
          year_number,
          start_date,
          end_date,
          status,
          objectives,
          key_technologies,
          created_at,
          updated_at
        FROM rd_dev_phases
        WHERE project_id = $1 AND status = 'active'
        ORDER BY phase_number, year_number
        LIMIT 1
      `

      const result = await query(sql, [projectId])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch current active phase:', error)
      throw new Error('Failed to fetch current phase')
    }
  }

  /**
   * 단계별 진행률 조회
   */
  async getPhaseProgress(projectId: string): Promise<RdDevPhaseProgress[]> {
    try {
      const sql = `
        SELECT 
          p.id as phase_id,
          CONCAT('Phase ', p.phase_number, '-Year ', p.year_number) as phase_name,
          p.start_date,
          p.end_date,
          p.status,
          COUNT(d.id) as total_deliverables,
          COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as completed_deliverables,
          CASE 
            WHEN p.status = 'completed' THEN 100
            WHEN p.status = 'active' AND p.end_date::date >= CURRENT_DATE THEN 
              GREATEST(0, LEAST(100, 
                ROUND(
                  (EXTRACT(epoch FROM (CURRENT_DATE - p.start_date::date)) / 
                   EXTRACT(epoch FROM (p.end_date::date - p.start_date::date))) * 100
                )
              ))
            ELSE 0
          END as completion_percentage,
          CASE 
            WHEN p.status = 'active' AND p.end_date::date > CURRENT_DATE THEN 
              EXTRACT(days FROM (p.end_date::date - CURRENT_DATE))
            ELSE NULL
          END as days_remaining
        FROM rd_dev_phases p
        LEFT JOIN rd_dev_deliverables d ON p.id = d.phase_id
        WHERE p.project_id = $1
        GROUP BY p.id, p.phase_number, p.year_number, p.start_date, p.end_date, p.status
        ORDER BY p.phase_number, p.year_number
      `

      const result = await query(sql, [projectId])
      return result.rows.map((row) => ({
        phase_id: row.phase_id,
        phase_name: row.phase_name,
        completion_percentage: parseInt(row.completion_percentage),
        completed_deliverables: parseInt(row.completed_deliverables),
        total_deliverables: parseInt(row.total_deliverables),
        days_remaining: row.days_remaining ? parseInt(row.days_remaining) : undefined,
      }))
    } catch (error) {
      logger.error('Failed to fetch phase progress:', error)
      throw new Error('Failed to fetch phase progress')
    }
  }

  /**
   * 단계별 산출물 통계
   */
  async getPhaseDeliverableStats(phaseId: string): Promise<{
    total: number
    completed: number
    in_progress: number
    planned: number
    delayed: number
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned,
          COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed
        FROM rd_dev_deliverables
        WHERE phase_id = $1
      `

      const result = await query(sql, [phaseId])
      const stats = result.rows[0]

      return {
        total: parseInt(stats.total),
        completed: parseInt(stats.completed),
        in_progress: parseInt(stats.in_progress),
        planned: parseInt(stats.planned),
        delayed: parseInt(stats.delayed),
      }
    } catch (error) {
      logger.error('Failed to fetch phase deliverable stats:', error)
      throw new Error('Failed to fetch deliverable stats')
    }
  }
}
