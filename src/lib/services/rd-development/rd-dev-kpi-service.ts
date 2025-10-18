/**
 * R&D Development KPI Service
 * KPI 및 성능 지표 관리
 */

import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

export interface RdDevKpi {
  id: string
  project_id: string
  phase_id: string | null
  kpi_category: string
  kpi_name: string
  kpi_description: string | null
  target_value: string | null
  current_value: string | null
  unit: string | null
  measurement_date: string | null
  status: '목표달성' | '진행중' | '지연' | '미측정'
  verification_method: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateKpiRequest {
  project_id: string
  phase_id?: string
  kpi_category: string
  kpi_name: string
  kpi_description?: string
  target_value?: string
  unit?: string
  verification_method?: string
}

export interface UpdateKpiRequest {
  current_value?: string
  measurement_date?: string
  status?: '목표달성' | '진행중' | '지연' | '미측정'
  notes?: string
}

export interface KpiStats {
  total: number
  achieved: number
  in_progress: number
  delayed: number
  not_measured: number
  by_category: Record<string, number>
}

export class RdDevKpiService {
  /**
   * 프로젝트의 모든 KPI 조회
   */
  async getKpisByProjectId(projectId: string): Promise<RdDevKpi[]> {
    try {
      const sql = `
        SELECT * FROM rd_dev_kpis
        WHERE project_id = $1
        ORDER BY kpi_category, kpi_name
      `
      const result = await query(sql, [projectId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch KPIs:', error)
      throw new Error('Failed to fetch KPIs')
    }
  }

  /**
   * 단계별 KPI 조회
   */
  async getKpisByPhaseId(phaseId: string): Promise<RdDevKpi[]> {
    try {
      const sql = `
        SELECT * FROM rd_dev_kpis
        WHERE phase_id = $1
        ORDER BY kpi_category, kpi_name
      `
      const result = await query(sql, [phaseId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch KPIs by phase:', error)
      throw new Error('Failed to fetch KPIs by phase')
    }
  }

  /**
   * 카테고리별 KPI 조회
   */
  async getKpisByCategory(projectId: string, category: string): Promise<RdDevKpi[]> {
    try {
      const sql = `
        SELECT * FROM rd_dev_kpis
        WHERE project_id = $1 AND kpi_category = $2
        ORDER BY kpi_name
      `
      const result = await query(sql, [projectId, category])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch KPIs by category:', error)
      throw new Error('Failed to fetch KPIs by category')
    }
  }

  /**
   * KPI 통계 조회
   */
  async getKpiStats(projectId: string): Promise<KpiStats> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = '목표달성') as achieved,
          COUNT(*) FILTER (WHERE status = '진행중') as in_progress,
          COUNT(*) FILTER (WHERE status = '지연') as delayed,
          COUNT(*) FILTER (WHERE status = '미측정') as not_measured,
          jsonb_object_agg(
            kpi_category, 
            count
          ) FILTER (WHERE kpi_category IS NOT NULL) as by_category
        FROM (
          SELECT 
            status,
            kpi_category,
            COUNT(*) as count
          FROM rd_dev_kpis
          WHERE project_id = $1
          GROUP BY status, kpi_category
        ) subq
        GROUP BY ()
      `
      const result = await query(sql, [projectId])

      if (result.rows.length === 0) {
        return {
          total: 0,
          achieved: 0,
          in_progress: 0,
          delayed: 0,
          not_measured: 0,
          by_category: {},
        }
      }

      return {
        total: parseInt(result.rows[0].total),
        achieved: parseInt(result.rows[0].achieved),
        in_progress: parseInt(result.rows[0].in_progress),
        delayed: parseInt(result.rows[0].delayed),
        not_measured: parseInt(result.rows[0].not_measured),
        by_category: result.rows[0].by_category || {},
      }
    } catch (error) {
      logger.error('Failed to fetch KPI stats:', error)
      throw new Error('Failed to fetch KPI stats')
    }
  }

  /**
   * KPI 생성
   */
  async createKpi(data: CreateKpiRequest): Promise<RdDevKpi> {
    try {
      const sql = `
        INSERT INTO rd_dev_kpis (
          project_id, phase_id, kpi_category, kpi_name, 
          kpi_description, target_value, unit, verification_method
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `
      const result = await query(sql, [
        data.project_id,
        data.phase_id || null,
        data.kpi_category,
        data.kpi_name,
        data.kpi_description || null,
        data.target_value || null,
        data.unit || null,
        data.verification_method || null,
      ])
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create KPI:', error)
      throw new Error('Failed to create KPI')
    }
  }

  /**
   * KPI 업데이트 (측정값 기록)
   */
  async updateKpi(id: string, data: UpdateKpiRequest): Promise<RdDevKpi> {
    try {
      const updates: string[] = []
      const params: unknown[] = []
      let paramCount = 0

      if (data.current_value !== undefined) {
        paramCount++
        updates.push(`current_value = $${paramCount}`)
        params.push(data.current_value)
      }

      if (data.measurement_date !== undefined) {
        paramCount++
        updates.push(`measurement_date = $${paramCount}`)
        params.push(data.measurement_date)
      }

      if (data.status !== undefined) {
        paramCount++
        updates.push(`status = $${paramCount}`)
        params.push(data.status)
      }

      if (data.notes !== undefined) {
        paramCount++
        updates.push(`notes = $${paramCount}`)
        params.push(data.notes)
      }

      paramCount++
      updates.push(`updated_at = CURRENT_TIMESTAMP`)

      paramCount++
      const sql = `
        UPDATE rd_dev_kpis
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `
      params.push(id)

      const result = await query(sql, params)
      if (result.rows.length === 0) {
        throw new Error('KPI not found')
      }
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update KPI:', error)
      throw new Error('Failed to update KPI')
    }
  }

  /**
   * KPI 삭제
   */
  async deleteKpi(id: string): Promise<boolean> {
    try {
      const sql = 'DELETE FROM rd_dev_kpis WHERE id = $1 RETURNING id'
      const result = await query(sql, [id])
      return result.rows.length > 0
    } catch (error) {
      logger.error('Failed to delete KPI:', error)
      throw new Error('Failed to delete KPI')
    }
  }

  /**
   * KPI ID로 조회
   */
  async getKpiById(id: string): Promise<RdDevKpi | null> {
    try {
      const sql = 'SELECT * FROM rd_dev_kpis WHERE id = $1'
      const result = await query(sql, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch KPI by ID:', error)
      throw new Error('Failed to fetch KPI')
    }
  }
}
