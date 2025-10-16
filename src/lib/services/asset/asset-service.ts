/**
 * Asset Service
 * 물리적 자산 관리 비즈니스 로직
 */

import { query, transaction } from '$lib/database/connection'
import type {
  Asset,
  AssetFilters,
  CreateAssetDto,
  DatabaseAsset,
  UpdateAssetDto,
} from '$lib/types/asset'
import { logger } from '$lib/utils/logger'

export class AssetService {
  /**
   * 자산 생성
   */
  async create(data: CreateAssetDto): Promise<DatabaseAsset> {
    try {
      const result = await query<DatabaseAsset>(
        `INSERT INTO assets (
          category_id, asset_code, name, description, serial_number,
          manufacturer, model, purchase_date, purchase_price, warranty_end_date,
          location, condition, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, category_id, asset_code, name, description, serial_number,
                  manufacturer, model, purchase_date, purchase_price, warranty_end_date,
                  location, status, condition, notes,
                  created_at::text as created_at, updated_at::text as updated_at`,
        [
          data.category_id,
          data.asset_code,
          data.name,
          data.description || null,
          data.serial_number || null,
          data.manufacturer || null,
          data.model || null,
          data.purchase_date || null,
          data.purchase_price || null,
          data.warranty_end_date || null,
          data.location || null,
          data.condition || null,
          data.notes || null,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('자산 생성에 실패했습니다.')
      }

      logger.info(`Asset created: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create asset:', error)
      throw error
    }
  }

  /**
   * 자산 ID로 조회
   */
  async getById(id: string): Promise<Asset | null> {
    try {
      const result = await query<Asset>(
        `SELECT 
          a.id, a.category_id, a.asset_code, a.name, a.description, a.serial_number,
          a.manufacturer, a.model, a.purchase_date, a.purchase_price, a.warranty_end_date,
          a.location, a.status, a.condition, a.notes,
          a.created_at::text as created_at, a.updated_at::text as updated_at,
          ac.name as category_name, ac.type as category_type,
          aa.id as assignment_id, aa.employee_id, aa.assigned_date, aa.expected_return_date,
          aa.actual_return_date, aa.status as assignment_status, aa.purpose as assignment_purpose,
          e.first_name, e.last_name, e.employee_id as emp_id
        FROM assets a
        LEFT JOIN asset_categories ac ON ac.id = a.category_id
        LEFT JOIN asset_assignments aa ON aa.asset_id = a.id AND aa.status = 'active'
        LEFT JOIN employees e ON e.id = aa.employee_id
        WHERE a.id = $1`,
        [id],
      )

      if (!result.rows[0]) return null

      const asset = result.rows[0]
      return {
        ...asset,
        category: asset.category_name
          ? {
              id: asset.category_id,
              name: asset.category_name,
              type: asset.category_type,
              description: null,
              requires_serial: false,
              requires_location: false,
              requires_datetime_booking: false,
              requires_assignment: false,
              created_at: '',
              updated_at: '',
            }
          : undefined,
        current_assignment: asset.assignment_id
          ? {
              id: asset.assignment_id,
              asset_id: asset.id,
              employee_id: asset.employee_id,
              assigned_date: asset.assigned_date,
              expected_return_date: asset.expected_return_date,
              actual_return_date: asset.actual_return_date,
              status: asset.assignment_status,
              purpose: asset.assignment_purpose,
              notes: null,
              assigned_by: null,
              returned_by: null,
              created_at: '',
              updated_at: '',
              employee: {
                id: asset.employee_id,
                first_name: asset.first_name,
                last_name: asset.last_name,
                employee_id: asset.emp_id,
              },
            }
          : undefined,
      }
    } catch (error) {
      logger.error('Failed to get asset by ID:', error)
      throw error
    }
  }

  /**
   * 자산 목록 조회 (필터링)
   */
  async list(filters: AssetFilters = {}): Promise<Asset[]> {
    try {
      const conditions: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (filters.category_id) {
        conditions.push(`a.category_id = $${paramIndex++}`)
        params.push(filters.category_id)
      }

      if (filters.status) {
        conditions.push(`a.status = $${paramIndex++}`)
        params.push(filters.status)
      }

      if (filters.condition) {
        conditions.push(`a.condition = $${paramIndex++}`)
        params.push(filters.condition)
      }

      if (filters.location) {
        conditions.push(`a.location ILIKE $${paramIndex++}`)
        params.push(`%${filters.location}%`)
      }

      if (filters.search) {
        conditions.push(`(
          a.name ILIKE $${paramIndex} OR 
          a.asset_code ILIKE $${paramIndex} OR 
          a.serial_number ILIKE $${paramIndex} OR
          a.description ILIKE $${paramIndex}
        )`)
        params.push(`%${filters.search}%`)
        paramIndex++
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const limitClause = filters.limit ? `LIMIT $${paramIndex++}` : ''
      const offsetClause = filters.offset ? `OFFSET $${paramIndex++}` : ''

      if (filters.limit) params.push(filters.limit)
      if (filters.offset) params.push(filters.offset)

      const result = await query<Asset>(
        `SELECT 
          a.id, a.category_id, a.asset_code, a.name, a.description, a.serial_number,
          a.manufacturer, a.model, a.purchase_date, a.purchase_price, a.warranty_end_date,
          a.location, a.status, a.condition, a.notes,
          a.created_at::text as created_at, a.updated_at::text as updated_at,
          ac.name as category_name, ac.type as category_type,
          aa.id as assignment_id, aa.employee_id, aa.assigned_date, aa.expected_return_date,
          aa.actual_return_date, aa.status as assignment_status, aa.purpose as assignment_purpose,
          e.first_name, e.last_name, e.employee_id as emp_id
        FROM assets a
        LEFT JOIN asset_categories ac ON ac.id = a.category_id
        LEFT JOIN asset_assignments aa ON aa.asset_id = a.id AND aa.status = 'active'
        LEFT JOIN employees e ON e.id = aa.employee_id
        ${whereClause}
        ORDER BY a.created_at DESC
        ${limitClause} ${offsetClause}`,
        params,
      )

      return result.rows.map((asset) => ({
        ...asset,
        category: asset.category_name
          ? {
              id: asset.category_id,
              name: asset.category_name,
              type: asset.category_type,
              description: null,
              requires_serial: false,
              requires_location: false,
              requires_datetime_booking: false,
              requires_assignment: false,
              created_at: '',
              updated_at: '',
            }
          : undefined,
        current_assignment: asset.assignment_id
          ? {
              id: asset.assignment_id,
              asset_id: asset.id,
              employee_id: asset.employee_id,
              assigned_date: asset.assigned_date,
              expected_return_date: asset.expected_return_date,
              actual_return_date: asset.actual_return_date,
              status: asset.assignment_status,
              purpose: asset.assignment_purpose,
              notes: null,
              assigned_by: null,
              returned_by: null,
              created_at: '',
              updated_at: '',
              employee: {
                id: asset.employee_id,
                first_name: asset.first_name,
                last_name: asset.last_name,
                employee_id: asset.emp_id,
              },
            }
          : undefined,
      }))
    } catch (error) {
      logger.error('Failed to list assets:', error)
      throw error
    }
  }

  /**
   * 자산 업데이트
   */
  async update(id: string, data: UpdateAssetDto): Promise<DatabaseAsset> {
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

      const result = await query<DatabaseAsset>(
        `UPDATE assets 
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, category_id, asset_code, name, description, serial_number,
                   manufacturer, model, purchase_date, purchase_price, warranty_end_date,
                   location, status, condition, notes,
                   created_at::text as created_at, updated_at::text as updated_at`,
        params,
      )

      if (!result.rows[0]) {
        throw new Error('자산을 찾을 수 없습니다.')
      }

      logger.info(`Asset updated: ${id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update asset:', error)
      throw error
    }
  }

  /**
   * 자산 상태 업데이트
   */
  async updateStatus(id: string, status: string): Promise<void> {
    try {
      const result = await query(
        `UPDATE assets 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [status, id],
      )

      if (result.rowCount === 0) {
        throw new Error('자산을 찾을 수 없습니다.')
      }

      logger.info(`Asset status updated: ${id} -> ${status}`)
    } catch (error) {
      logger.error('Failed to update asset status:', error)
      throw error
    }
  }

  /**
   * 자산 폐기
   */
  async dispose(id: string, reason: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // 자산 상태를 disposed로 변경
        await client.query(
          `UPDATE assets 
           SET status = 'disposed', notes = COALESCE(notes, '') || $1, updated_at = NOW()
           WHERE id = $2`,
          [`\n폐기 사유: ${reason}\n폐기일: ${new Date().toISOString().split('T')[0]}\n`, id],
        )

        // 활성 할당이 있다면 반납 처리
        await client.query(
          `UPDATE asset_assignments 
           SET status = 'returned', actual_return_date = CURRENT_DATE, 
               notes = COALESCE(notes, '') || $1, updated_at = NOW()
           WHERE asset_id = $2 AND status = 'active'`,
          [`\n자산 폐기로 인한 자동 반납\n`, id],
        )
      })

      logger.info(`Asset disposed: ${id}`)
    } catch (error) {
      logger.error('Failed to dispose asset:', error)
      throw error
    }
  }

  /**
   * 자산 삭제 (soft delete)
   */
  async delete(id: string): Promise<void> {
    try {
      const result = await query(`DELETE FROM assets WHERE id = $1`, [id])

      if (result.rowCount === 0) {
        throw new Error('자산을 찾을 수 없습니다.')
      }

      logger.info(`Asset deleted: ${id}`)
    } catch (error) {
      logger.error('Failed to delete asset:', error)
      throw error
    }
  }

  /**
   * 자산 코드 중복 확인
   */
  async isAssetCodeExists(assetCode: string, excludeId?: string): Promise<boolean> {
    try {
      const conditions = ['asset_code = $1']
      const params: unknown[] = [assetCode]
      let paramIndex = 2

      if (excludeId) {
        conditions.push(`id != $${paramIndex++}`)
        params.push(excludeId)
      }

      const result = await query(`SELECT id FROM assets WHERE ${conditions.join(' AND ')}`, params)

      return result.rows.length > 0
    } catch (error) {
      logger.error('Failed to check asset code existence:', error)
      throw error
    }
  }

  /**
   * 자산 통계 조회
   */
  async getStats(): Promise<{
    total: number
    available: number
    in_use: number
    maintenance: number
    disposed: number
    total_value: number
  }> {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'in_use' THEN 1 END) as in_use,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
          COUNT(CASE WHEN status = 'disposed' THEN 1 END) as disposed,
          COALESCE(SUM(purchase_price), 0) as total_value
        FROM assets`,
      )

      return {
        total: parseInt(result.rows[0].total),
        available: parseInt(result.rows[0].available),
        in_use: parseInt(result.rows[0].in_use),
        maintenance: parseInt(result.rows[0].maintenance),
        disposed: parseInt(result.rows[0].disposed),
        total_value: parseFloat(result.rows[0].total_value),
      }
    } catch (error) {
      logger.error('Failed to get asset stats:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const assetService = new AssetService()
