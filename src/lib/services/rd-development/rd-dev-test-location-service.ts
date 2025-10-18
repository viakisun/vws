/**
 * R&D Development Test Location Service
 * 시연/실증 장소 관리
 */

import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

export interface RdDevTestLocation {
  id: string
  project_id: string
  location_name: string
  location_type: string | null
  address: string | null
  facility_details: Record<string, unknown>
  available_from: string | null
  available_to: string | null
  contact_info: Record<string, unknown>
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateTestLocationRequest {
  project_id: string
  location_name: string
  location_type?: string
  address?: string
  facility_details?: Record<string, unknown>
  available_from?: string
  available_to?: string
  contact_info?: Record<string, unknown>
  notes?: string
}

export interface UpdateTestLocationRequest {
  location_name?: string
  location_type?: string
  address?: string
  facility_details?: Record<string, unknown>
  available_from?: string
  available_to?: string
  contact_info?: Record<string, unknown>
  notes?: string
}

export class RdDevTestLocationService {
  /**
   * 프로젝트의 모든 테스트 장소 조회
   */
  async getTestLocationsByProjectId(projectId: string): Promise<RdDevTestLocation[]> {
    try {
      const sql = `
        SELECT * FROM rd_dev_test_locations
        WHERE project_id = $1
        ORDER BY location_name
      `
      const result = await query(sql, [projectId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch test locations:', error)
      throw new Error('Failed to fetch test locations')
    }
  }

  /**
   * 테스트 장소 ID로 조회
   */
  async getTestLocationById(id: string): Promise<RdDevTestLocation | null> {
    try {
      const sql = 'SELECT * FROM rd_dev_test_locations WHERE id = $1'
      const result = await query(sql, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch test location:', error)
      throw new Error('Failed to fetch test location')
    }
  }

  /**
   * 유형별 테스트 장소 조회
   */
  async getTestLocationsByType(
    projectId: string,
    locationType: string,
  ): Promise<RdDevTestLocation[]> {
    try {
      const sql = `
        SELECT * FROM rd_dev_test_locations
        WHERE project_id = $1 AND location_type = $2
        ORDER BY location_name
      `
      const result = await query(sql, [projectId, locationType])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch test locations by type:', error)
      throw new Error('Failed to fetch test locations by type')
    }
  }

  /**
   * 테스트 장소 생성
   */
  async createTestLocation(data: CreateTestLocationRequest): Promise<RdDevTestLocation> {
    try {
      const sql = `
        INSERT INTO rd_dev_test_locations (
          project_id, location_name, location_type, address,
          facility_details, available_from, available_to, contact_info, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `
      const result = await query(sql, [
        data.project_id,
        data.location_name,
        data.location_type || null,
        data.address || null,
        JSON.stringify(data.facility_details || {}),
        data.available_from || null,
        data.available_to || null,
        JSON.stringify(data.contact_info || {}),
        data.notes || null,
      ])
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create test location:', error)
      throw new Error('Failed to create test location')
    }
  }

  /**
   * 테스트 장소 업데이트
   */
  async updateTestLocation(
    id: string,
    data: UpdateTestLocationRequest,
  ): Promise<RdDevTestLocation> {
    try {
      const updates: string[] = []
      const params: unknown[] = []
      let paramCount = 0

      if (data.location_name !== undefined) {
        paramCount++
        updates.push(`location_name = $${paramCount}`)
        params.push(data.location_name)
      }

      if (data.location_type !== undefined) {
        paramCount++
        updates.push(`location_type = $${paramCount}`)
        params.push(data.location_type)
      }

      if (data.address !== undefined) {
        paramCount++
        updates.push(`address = $${paramCount}`)
        params.push(data.address)
      }

      if (data.facility_details !== undefined) {
        paramCount++
        updates.push(`facility_details = $${paramCount}`)
        params.push(JSON.stringify(data.facility_details))
      }

      if (data.available_from !== undefined) {
        paramCount++
        updates.push(`available_from = $${paramCount}`)
        params.push(data.available_from)
      }

      if (data.available_to !== undefined) {
        paramCount++
        updates.push(`available_to = $${paramCount}`)
        params.push(data.available_to)
      }

      if (data.contact_info !== undefined) {
        paramCount++
        updates.push(`contact_info = $${paramCount}`)
        params.push(JSON.stringify(data.contact_info))
      }

      if (data.notes !== undefined) {
        paramCount++
        updates.push(`notes = $${paramCount}`)
        params.push(data.notes)
      }

      updates.push('updated_at = CURRENT_TIMESTAMP')

      paramCount++
      const sql = `
        UPDATE rd_dev_test_locations
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `
      params.push(id)

      const result = await query(sql, params)
      if (result.rows.length === 0) {
        throw new Error('Test location not found')
      }
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update test location:', error)
      throw new Error('Failed to update test location')
    }
  }

  /**
   * 테스트 장소 삭제
   */
  async deleteTestLocation(id: string): Promise<boolean> {
    try {
      const sql = 'DELETE FROM rd_dev_test_locations WHERE id = $1 RETURNING id'
      const result = await query(sql, [id])
      return result.rows.length > 0
    } catch (error) {
      logger.error('Failed to delete test location:', error)
      throw new Error('Failed to delete test location')
    }
  }
}
