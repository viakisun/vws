/**
 * R&D Development Verification Scenario Service
 * 검증 시나리오 관리
 */

import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

export interface RdDevVerificationScenario {
  id: string
  project_id: string
  scenario_name: string
  scenario_description: string | null
  scenario_steps: string[]
  related_deliverables: string[]
  related_kpis: string[]
  test_location_id: string | null
  test_date: string | null
  status: '계획' | '준비중' | '진행중' | '완료' | '실패'
  test_results: Record<string, unknown>
  attachments: unknown[]
  created_at: string
  updated_at: string
}

export interface CreateScenarioRequest {
  project_id: string
  scenario_name: string
  scenario_description?: string
  scenario_steps?: string[]
  related_deliverables?: string[]
  related_kpis?: string[]
  test_location_id?: string
  test_date?: string
}

export interface UpdateScenarioRequest {
  scenario_name?: string
  scenario_description?: string
  scenario_steps?: string[]
  test_location_id?: string
  test_date?: string
  status?: '계획' | '준비중' | '진행중' | '완료' | '실패'
  test_results?: Record<string, unknown>
  attachments?: unknown[]
}

export class RdDevVerificationScenarioService {
  /**
   * 프로젝트의 모든 시나리오 조회
   */
  async getScenariosByProjectId(projectId: string): Promise<RdDevVerificationScenario[]> {
    try {
      const sql = `
        SELECT 
          s.*,
          tl.location_name as test_location_name
        FROM rd_dev_verification_scenarios s
        LEFT JOIN rd_dev_test_locations tl ON s.test_location_id = tl.id
        WHERE s.project_id = $1
        ORDER BY s.test_date NULLS LAST, s.scenario_name
      `
      const result = await query(sql, [projectId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch verification scenarios:', error)
      throw new Error('Failed to fetch verification scenarios')
    }
  }

  /**
   * 시나리오 ID로 조회
   */
  async getScenarioById(id: string): Promise<RdDevVerificationScenario | null> {
    try {
      const sql = `
        SELECT 
          s.*,
          tl.location_name as test_location_name,
          tl.location_type,
          tl.address
        FROM rd_dev_verification_scenarios s
        LEFT JOIN rd_dev_test_locations tl ON s.test_location_id = tl.id
        WHERE s.id = $1
      `
      const result = await query(sql, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch verification scenario:', error)
      throw new Error('Failed to fetch verification scenario')
    }
  }

  /**
   * 상태별 시나리오 조회
   */
  async getScenariosByStatus(
    projectId: string,
    status: string,
  ): Promise<RdDevVerificationScenario[]> {
    try {
      const sql = `
        SELECT * FROM rd_dev_verification_scenarios
        WHERE project_id = $1 AND status = $2
        ORDER BY test_date NULLS LAST
      `
      const result = await query(sql, [projectId, status])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch scenarios by status:', error)
      throw new Error('Failed to fetch scenarios by status')
    }
  }

  /**
   * 시나리오 생성
   */
  async createScenario(data: CreateScenarioRequest): Promise<RdDevVerificationScenario> {
    try {
      const sql = `
        INSERT INTO rd_dev_verification_scenarios (
          project_id, scenario_name, scenario_description, scenario_steps,
          related_deliverables, related_kpis, test_location_id, test_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `
      const result = await query(sql, [
        data.project_id,
        data.scenario_name,
        data.scenario_description || null,
        JSON.stringify(data.scenario_steps || []),
        data.related_deliverables || [],
        data.related_kpis || [],
        data.test_location_id || null,
        data.test_date || null,
      ])
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create verification scenario:', error)
      throw new Error('Failed to create verification scenario')
    }
  }

  /**
   * 시나리오 업데이트
   */
  async updateScenario(
    id: string,
    data: UpdateScenarioRequest,
  ): Promise<RdDevVerificationScenario> {
    try {
      const updates: string[] = []
      const params: unknown[] = []
      let paramCount = 0

      if (data.scenario_name !== undefined) {
        paramCount++
        updates.push(`scenario_name = $${paramCount}`)
        params.push(data.scenario_name)
      }

      if (data.scenario_description !== undefined) {
        paramCount++
        updates.push(`scenario_description = $${paramCount}`)
        params.push(data.scenario_description)
      }

      if (data.scenario_steps !== undefined) {
        paramCount++
        updates.push(`scenario_steps = $${paramCount}`)
        params.push(JSON.stringify(data.scenario_steps))
      }

      if (data.test_location_id !== undefined) {
        paramCount++
        updates.push(`test_location_id = $${paramCount}`)
        params.push(data.test_location_id)
      }

      if (data.test_date !== undefined) {
        paramCount++
        updates.push(`test_date = $${paramCount}`)
        params.push(data.test_date)
      }

      if (data.status !== undefined) {
        paramCount++
        updates.push(`status = $${paramCount}`)
        params.push(data.status)
      }

      if (data.test_results !== undefined) {
        paramCount++
        updates.push(`test_results = $${paramCount}`)
        params.push(JSON.stringify(data.test_results))
      }

      if (data.attachments !== undefined) {
        paramCount++
        updates.push(`attachments = $${paramCount}`)
        params.push(JSON.stringify(data.attachments))
      }

      updates.push('updated_at = CURRENT_TIMESTAMP')

      paramCount++
      const sql = `
        UPDATE rd_dev_verification_scenarios
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `
      params.push(id)

      const result = await query(sql, params)
      if (result.rows.length === 0) {
        throw new Error('Verification scenario not found')
      }
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update verification scenario:', error)
      throw new Error('Failed to update verification scenario')
    }
  }

  /**
   * 시나리오 삭제
   */
  async deleteScenario(id: string): Promise<boolean> {
    try {
      const sql = 'DELETE FROM rd_dev_verification_scenarios WHERE id = $1 RETURNING id'
      const result = await query(sql, [id])
      return result.rows.length > 0
    } catch (error) {
      logger.error('Failed to delete verification scenario:', error)
      throw new Error('Failed to delete verification scenario')
    }
  }

  /**
   * 시나리오 통계
   */
  async getScenarioStats(projectId: string): Promise<{
    total: number
    by_status: Record<string, number>
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total,
          status,
          COUNT(*) as count
        FROM rd_dev_verification_scenarios
        WHERE project_id = $1
        GROUP BY status
      `
      const result = await query(sql, [projectId])

      const stats = {
        total: 0,
        by_status: {} as Record<string, number>,
      }

      result.rows.forEach((row: any) => {
        stats.total += parseInt(row.count)
        stats.by_status[row.status] = parseInt(row.count)
      })

      return stats
    } catch (error) {
      logger.error('Failed to fetch scenario stats:', error)
      throw new Error('Failed to fetch scenario stats')
    }
  }
}
