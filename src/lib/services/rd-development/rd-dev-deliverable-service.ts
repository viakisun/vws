/**
 * R&D Development Deliverable Service
 * 산출물 관리
 */

import { query } from '$lib/database/connection'
import type {
  CreateRdDevDeliverableRequest,
  RdDevDeliverable,
  RdDevDeliverableFilters,
  RdDevDeliverableStatus,
} from '$lib/types/rd-development'
import { logger } from '$lib/utils/logger'

export class RdDevDeliverableService {
  /**
   * 산출물 목록 조회
   */
  async getDeliverables(filters: RdDevDeliverableFilters = {}): Promise<RdDevDeliverable[]> {
    try {
      let sql = `
        SELECT 
          d.id,
          d.project_id,
          d.phase_id,
          d.institution_id,
          d.deliverable_type,
          d.title,
          d.description,
          d.target_date,
          d.completion_date,
          d.status,
          d.verification_notes,
          d.created_at,
          d.updated_at,
          p.phase_number,
          p.year_number,
          i.institution_name
        FROM rd_dev_deliverables d
        LEFT JOIN rd_dev_phases p ON d.phase_id = p.id
        LEFT JOIN rd_dev_institutions i ON d.institution_id = i.id
        WHERE 1=1
      `

      const params: unknown[] = []
      let paramCount = 0

      if (filters.project_id) {
        paramCount++
        sql += ` AND d.project_id = $${paramCount}`
        params.push(filters.project_id)
      }

      if (filters.phase_id) {
        paramCount++
        sql += ` AND d.phase_id = $${paramCount}`
        params.push(filters.phase_id)
      }

      if (filters.institution_id) {
        paramCount++
        sql += ` AND d.institution_id = $${paramCount}`
        params.push(filters.institution_id)
      }

      if (filters.status) {
        paramCount++
        sql += ` AND d.status = $${paramCount}`
        params.push(filters.status)
      }

      if (filters.deliverable_type) {
        paramCount++
        sql += ` AND d.deliverable_type = $${paramCount}`
        params.push(filters.deliverable_type)
      }

      sql += ' ORDER BY d.target_date ASC, d.created_at DESC'

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
      logger.error('Failed to fetch deliverables:', error)
      throw new Error('Failed to fetch deliverables')
    }
  }

  /**
   * 산출물 상세 조회
   */
  async getDeliverableById(id: string): Promise<RdDevDeliverable | null> {
    try {
      const sql = `
        SELECT 
          d.id,
          d.project_id,
          d.phase_id,
          d.institution_id,
          d.deliverable_type,
          d.title,
          d.description,
          d.target_date,
          d.completion_date,
          d.status,
          d.verification_notes,
          d.created_at,
          d.updated_at,
          p.phase_number,
          p.year_number,
          p.status as phase_status,
          i.institution_name,
          i.role_description
        FROM rd_dev_deliverables d
        LEFT JOIN rd_dev_phases p ON d.phase_id = p.id
        LEFT JOIN rd_dev_institutions i ON d.institution_id = i.id
        WHERE d.id = $1
      `

      const result = await query(sql, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch deliverable by ID:', error)
      throw new Error('Failed to fetch deliverable')
    }
  }

  /**
   * 산출물 생성
   */
  async createDeliverable(
    projectId: string,
    data: CreateRdDevDeliverableRequest,
  ): Promise<RdDevDeliverable> {
    try {
      const sql = `
        INSERT INTO rd_dev_deliverables (
          project_id,
          phase_id,
          institution_id,
          deliverable_type,
          title,
          description,
          target_date,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING 
          id,
          project_id,
          phase_id,
          institution_id,
          deliverable_type,
          title,
          description,
          target_date,
          completion_date,
          status,
          verification_notes,
          created_at,
          updated_at
      `

      const params = [
        projectId,
        data.phase_id || null,
        data.institution_id || null,
        data.deliverable_type,
        data.title,
        data.description || null,
        data.target_date || null,
        data.status || 'planned',
      ]

      const result = await query(sql, params)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create deliverable:', error)
      throw new Error('Failed to create deliverable')
    }
  }

  /**
   * 산출물 수정
   */
  async updateDeliverable(
    id: string,
    data: Partial<
      CreateRdDevDeliverableRequest & {
        completion_date?: string
        verification_notes?: string
      }
    >,
  ): Promise<RdDevDeliverable> {
    try {
      const fields: string[] = []
      const params: unknown[] = []
      let paramCount = 0

      if (data.phase_id !== undefined) {
        paramCount++
        fields.push(`phase_id = $${paramCount}`)
        params.push(data.phase_id)
      }

      if (data.institution_id !== undefined) {
        paramCount++
        fields.push(`institution_id = $${paramCount}`)
        params.push(data.institution_id)
      }

      if (data.deliverable_type !== undefined) {
        paramCount++
        fields.push(`deliverable_type = $${paramCount}`)
        params.push(data.deliverable_type)
      }

      if (data.title !== undefined) {
        paramCount++
        fields.push(`title = $${paramCount}`)
        params.push(data.title)
      }

      if (data.description !== undefined) {
        paramCount++
        fields.push(`description = $${paramCount}`)
        params.push(data.description)
      }

      if (data.target_date !== undefined) {
        paramCount++
        fields.push(`target_date = $${paramCount}`)
        params.push(data.target_date)
      }

      if (data.completion_date !== undefined) {
        paramCount++
        fields.push(`completion_date = $${paramCount}`)
        params.push(data.completion_date)
      }

      if (data.status !== undefined) {
        paramCount++
        fields.push(`status = $${paramCount}`)
        params.push(data.status)
      }

      if (data.verification_notes !== undefined) {
        paramCount++
        fields.push(`verification_notes = $${paramCount}`)
        params.push(data.verification_notes)
      }

      if (fields.length === 0) {
        throw new Error('No fields to update')
      }

      paramCount++
      fields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE rd_dev_deliverables 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING 
          id,
          project_id,
          phase_id,
          institution_id,
          deliverable_type,
          title,
          description,
          target_date,
          completion_date,
          status,
          verification_notes,
          created_at,
          updated_at
      `

      params.push(id)
      const result = await query(sql, params)

      if (result.rows.length === 0) {
        throw new Error('Deliverable not found')
      }

      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update deliverable:', error)
      throw new Error('Failed to update deliverable')
    }
  }

  /**
   * 산출물 상태 업데이트
   */
  async updateDeliverableStatus(
    id: string,
    status: RdDevDeliverableStatus,
    notes?: string,
  ): Promise<RdDevDeliverable | null> {
    try {
      const sql = `
        UPDATE rd_dev_deliverables 
        SET 
          status = $1,
          verification_notes = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING 
          id,
          project_id,
          phase_id,
          institution_id,
          deliverable_type,
          title,
          description,
          target_date,
          completion_date,
          status,
          verification_notes,
          created_at,
          updated_at
      `

      const result = await query(sql, [status, notes || null, id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to update deliverable status:', error)
      throw new Error('Failed to update deliverable status')
    }
  }

  /**
   * 산출물 삭제
   */
  async deleteDeliverable(id: string): Promise<boolean> {
    try {
      const sql = 'DELETE FROM rd_dev_deliverables WHERE id = $1'
      const result = await query(sql, [id])
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to delete deliverable:', error)
      throw new Error('Failed to delete deliverable')
    }
  }

  /**
   * 기관별 산출물 통계
   */
  async getDeliverableStatsByInstitution(projectId: string): Promise<
    Array<{
      institution_name: string
      institution_id: string
      total: number
      completed: number
      in_progress: number
      planned: number
      delayed: number
      completion_rate: number
    }>
  > {
    try {
      const sql = `
        SELECT 
          i.id as institution_id,
          i.institution_name,
          COUNT(d.id) as total,
          COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN d.status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN d.status = 'planned' THEN 1 END) as planned,
          COUNT(CASE WHEN d.status = 'delayed' THEN 1 END) as delayed,
          CASE 
            WHEN COUNT(d.id) > 0 THEN 
              ROUND((COUNT(CASE WHEN d.status = 'completed' THEN 1 END)::numeric / COUNT(d.id)) * 100, 2)
            ELSE 0
          END as completion_rate
        FROM rd_dev_institutions i
        LEFT JOIN rd_dev_deliverables d ON i.id = d.institution_id
        WHERE i.project_id = $1
        GROUP BY i.id, i.institution_name
        ORDER BY completion_rate DESC, i.institution_name
      `

      const result = await query(sql, [projectId])
      return result.rows.map((row) => ({
        institution_name: row.institution_name,
        institution_id: row.institution_id,
        total: parseInt(row.total),
        completed: parseInt(row.completed),
        in_progress: parseInt(row.in_progress),
        planned: parseInt(row.planned),
        delayed: parseInt(row.delayed),
        completion_rate: parseFloat(row.completion_rate),
      }))
    } catch (error) {
      logger.error('Failed to fetch deliverable stats by institution:', error)
      throw new Error('Failed to fetch deliverable stats')
    }
  }

  /**
   * 단계별 산출물 통계
   */
  async getDeliverableStatsByPhase(projectId: string): Promise<
    Array<{
      phase_id: string
      phase_name: string
      total: number
      completed: number
      in_progress: number
      planned: number
      delayed: number
      completion_rate: number
    }>
  > {
    try {
      const sql = `
        SELECT 
          p.id as phase_id,
          CONCAT('Phase ', p.phase_number, '-Year ', p.year_number) as phase_name,
          COUNT(d.id) as total,
          COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN d.status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN d.status = 'planned' THEN 1 END) as planned,
          COUNT(CASE WHEN d.status = 'delayed' THEN 1 END) as delayed,
          CASE 
            WHEN COUNT(d.id) > 0 THEN 
              ROUND((COUNT(CASE WHEN d.status = 'completed' THEN 1 END)::numeric / COUNT(d.id)) * 100, 2)
            ELSE 0
          END as completion_rate
        FROM rd_dev_phases p
        LEFT JOIN rd_dev_deliverables d ON p.id = d.phase_id
        WHERE p.project_id = $1
        GROUP BY p.id, p.phase_number, p.year_number
        ORDER BY p.phase_number, p.year_number
      `

      const result = await query(sql, [projectId])
      return result.rows.map((row) => ({
        phase_id: row.phase_id,
        phase_name: row.phase_name,
        total: parseInt(row.total),
        completed: parseInt(row.completed),
        in_progress: parseInt(row.in_progress),
        planned: parseInt(row.planned),
        delayed: parseInt(row.delayed),
        completion_rate: parseFloat(row.completion_rate),
      }))
    } catch (error) {
      logger.error('Failed to fetch deliverable stats by phase:', error)
      throw new Error('Failed to fetch deliverable stats')
    }
  }

  /**
   * 지연된 산출물 조회
   */
  async getDelayedDeliverables(projectId?: string): Promise<RdDevDeliverable[]> {
    try {
      let sql = `
        SELECT 
          d.id,
          d.project_id,
          d.phase_id,
          d.institution_id,
          d.deliverable_type,
          d.title,
          d.description,
          d.target_date,
          d.completion_date,
          d.status,
          d.verification_notes,
          d.created_at,
          d.updated_at,
          p.phase_number,
          p.year_number,
          i.institution_name
        FROM rd_dev_deliverables d
        LEFT JOIN rd_dev_phases p ON d.phase_id = p.id
        LEFT JOIN rd_dev_institutions i ON d.institution_id = i.id
        WHERE d.status IN ('delayed', 'in_progress') 
        AND d.target_date < CURRENT_DATE
        AND d.completion_date IS NULL
      `

      const params: unknown[] = []

      if (projectId) {
        sql += ' AND d.project_id = $1'
        params.push(projectId)
      }

      sql += ' ORDER BY d.target_date ASC'

      const result = await query(sql, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch delayed deliverables:', error)
      throw new Error('Failed to fetch delayed deliverables')
    }
  }
}
