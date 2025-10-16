/**
 * Asset Request Service
 * 자산 신청/승인 관리 비즈니스 로직
 */

import { query, transaction } from '$lib/database/connection'
import type {
  AssetRequest,
  AssetRequestFilters,
  CreateAssetRequestDto,
  DatabaseAssetRequest,
} from '$lib/types/asset'
import { logger } from '$lib/utils/logger'

export class AssetRequestService {
  /**
   * 자산 신청 생성
   */
  async createRequest(
    data: CreateAssetRequestDto,
    requesterId: string,
  ): Promise<DatabaseAssetRequest> {
    try {
      const result = await query<DatabaseAssetRequest>(
        `INSERT INTO asset_requests (
          requester_id, asset_id, category_id, request_type, purpose,
          start_datetime, end_datetime, return_reason
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, requester_id, asset_id, category_id, request_type, purpose,
                  start_datetime, end_datetime, return_reason, status,
                  created_at::text as created_at, updated_at::text as updated_at`,
        [
          requesterId,
          data.asset_id || null,
          data.category_id || null,
          data.request_type,
          data.purpose || null,
          data.start_datetime || null,
          data.end_datetime || null,
          data.return_reason || null,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('자산 신청 생성에 실패했습니다.')
      }

      logger.info(`Asset request created: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create asset request:', error)
      throw error
    }
  }

  /**
   * 자산 신청 목록 조회
   */
  async list(filters: AssetRequestFilters = {}): Promise<AssetRequest[]> {
    try {
      const conditions: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (filters.requester_id) {
        conditions.push(`ar.requester_id = $${paramIndex++}`)
        params.push(filters.requester_id)
      }

      if (filters.status) {
        conditions.push(`ar.status = $${paramIndex++}`)
        params.push(filters.status)
      }

      if (filters.request_type) {
        conditions.push(`ar.request_type = $${paramIndex++}`)
        params.push(filters.request_type)
      }

      if (filters.start_date) {
        conditions.push(`ar.start_datetime >= $${paramIndex++}`)
        params.push(filters.start_date)
      }

      if (filters.end_date) {
        conditions.push(`ar.end_datetime <= $${paramIndex++}`)
        params.push(filters.end_date)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const limitClause = filters.limit ? `LIMIT $${paramIndex++}` : ''
      const offsetClause = filters.offset ? `OFFSET $${paramIndex++}` : ''

      if (filters.limit) params.push(filters.limit)
      if (filters.offset) params.push(filters.offset)

      const result = await query<AssetRequest>(
        `SELECT 
          ar.id, ar.requester_id, ar.asset_id, ar.category_id, ar.request_type, ar.purpose,
          ar.start_datetime, ar.end_datetime, ar.return_reason, ar.status,
          ar.approved_by, ar.approved_at, ar.rejection_reason,
          ar.created_at::text as created_at, ar.updated_at::text as updated_at,
          r.first_name as requester_first_name, r.last_name as requester_last_name, r.employee_id as requester_emp_id,
          a.name as asset_name, a.asset_code, a.status as asset_status,
          ac.name as category_name,
          approver.first_name as approved_by_first_name, approver.last_name as approved_by_last_name, approver.employee_id as approved_by_emp_id
        FROM asset_requests ar
        LEFT JOIN employees r ON r.id = ar.requester_id
        LEFT JOIN assets a ON a.id = ar.asset_id
        LEFT JOIN asset_categories ac ON ac.id = ar.category_id
        LEFT JOIN employees approver ON approver.id = ar.approved_by
        ${whereClause}
        ORDER BY ar.created_at DESC
        ${limitClause} ${offsetClause}`,
        params,
      )

      return result.rows.map((request) => ({
        ...request,
        requester: {
          id: request.requester_id,
          first_name: request.requester_first_name,
          last_name: request.requester_last_name,
          employee_id: request.requester_emp_id,
        },
        asset: request.asset_name
          ? ({
              id: request.asset_id,
              name: request.asset_name,
              asset_code: request.asset_code,
              status: request.asset_status,
            } as any)
          : undefined,
        category: request.category_name
          ? ({
              id: request.category_id,
              name: request.category_name,
            } as any)
          : undefined,
        approved_by_user: request.approved_by_first_name
          ? {
              id: request.approved_by,
              first_name: request.approved_by_first_name,
              last_name: request.approved_by_last_name,
              employee_id: request.approved_by_emp_id,
            }
          : undefined,
      }))
    } catch (error) {
      logger.error('Failed to list asset requests:', error)
      throw error
    }
  }

  /**
   * 자산 신청 상세 조회
   */
  async getById(id: string): Promise<AssetRequest | null> {
    try {
      const result = await query<AssetRequest>(
        `SELECT 
          ar.id, ar.requester_id, ar.asset_id, ar.category_id, ar.request_type, ar.purpose,
          ar.start_datetime, ar.end_datetime, ar.return_reason, ar.status,
          ar.approved_by, ar.approved_at, ar.rejection_reason,
          ar.created_at::text as created_at, ar.updated_at::text as updated_at,
          r.first_name as requester_first_name, r.last_name as requester_last_name, r.employee_id as requester_emp_id,
          a.name as asset_name, a.asset_code, a.status as asset_status, a.location as asset_location,
          ac.name as category_name,
          approver.first_name as approved_by_first_name, approver.last_name as approved_by_last_name, approver.employee_id as approved_by_emp_id
        FROM asset_requests ar
        LEFT JOIN employees r ON r.id = ar.requester_id
        LEFT JOIN assets a ON a.id = ar.asset_id
        LEFT JOIN asset_categories ac ON ac.id = ar.category_id
        LEFT JOIN employees approver ON approver.id = ar.approved_by
        WHERE ar.id = $1`,
        [id],
      )

      if (!result.rows[0]) return null

      const request = result.rows[0]
      return {
        ...request,
        requester: {
          id: request.requester_id,
          first_name: request.requester_first_name,
          last_name: request.requester_last_name,
          employee_id: request.requester_emp_id,
        },
        asset: request.asset_name
          ? ({
              id: request.asset_id,
              name: request.asset_name,
              asset_code: request.asset_code,
              status: request.asset_status,
              location: request.asset_location,
            } as any)
          : undefined,
        category: request.category_name
          ? ({
              id: request.category_id,
              name: request.category_name,
            } as any)
          : undefined,
        approved_by_user: request.approved_by_first_name
          ? {
              id: request.approved_by,
              first_name: request.approved_by_first_name,
              last_name: request.approved_by_last_name,
              employee_id: request.approved_by_emp_id,
            }
          : undefined,
      }
    } catch (error) {
      logger.error('Failed to get asset request by ID:', error)
      throw error
    }
  }

  /**
   * 자산 신청 승인
   */
  async approveRequest(id: string, approverId: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // 신청 상태 확인
        const requestResult = await client.query(
          `SELECT * FROM asset_requests WHERE id = $1 AND status = 'pending'`,
          [id],
        )

        if (!requestResult.rows[0]) {
          throw new Error('승인 가능한 신청을 찾을 수 없습니다.')
        }

        const request = requestResult.rows[0]

        // 신청 승인
        await client.query(
          `UPDATE asset_requests 
           SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW()
           WHERE id = $2`,
          [approverId, id],
        )

        // 차량 예약인 경우 - 특별 처리 없음 (예약만)
        if (request.request_type === 'vehicle_reservation') {
          logger.info(`Vehicle reservation approved: ${id}`)
          return
        }

        // 장비 지급인 경우 - 자산 할당 생성
        if (request.request_type === 'equipment_assignment' && request.asset_id) {
          await client.query(
            `INSERT INTO asset_assignments (
              asset_id, employee_id, assigned_date, purpose, assigned_by
            )
            VALUES ($1, $2, CURRENT_DATE, $3, $4)`,
            [request.asset_id, request.requester_id, request.purpose, approverId],
          )

          // 자산 상태를 in_use로 변경
          await client.query(
            `UPDATE assets SET status = 'in_use', updated_at = NOW() WHERE id = $1`,
            [request.asset_id],
          )

          logger.info(`Equipment assignment approved: ${id}`)
          return
        }

        // 장비 반납인 경우 - 할당 종료 처리
        if (request.request_type === 'equipment_return' && request.asset_id) {
          await client.query(
            `UPDATE asset_assignments 
             SET status = 'returned', actual_return_date = CURRENT_DATE, 
                 notes = COALESCE(notes, '') || $1, updated_at = NOW()
             WHERE asset_id = $2 AND employee_id = $3 AND status = 'active'`,
            [
              `\n반납 사유: ${request.return_reason || '일반 반납'}\n`,
              request.asset_id,
              request.requester_id,
            ],
          )

          // 자산 상태를 available로 변경
          await client.query(
            `UPDATE assets SET status = 'available', updated_at = NOW() WHERE id = $1`,
            [request.asset_id],
          )

          logger.info(`Equipment return approved: ${id}`)
          return
        }
      })
    } catch (error) {
      logger.error('Failed to approve asset request:', error)
      throw error
    }
  }

  /**
   * 자산 신청 거부
   */
  async rejectRequest(id: string, approverId: string, reason: string): Promise<void> {
    try {
      const result = await query(
        `UPDATE asset_requests 
         SET status = 'rejected', approved_by = $1, approved_at = NOW(), 
             rejection_reason = $2, updated_at = NOW()
         WHERE id = $3 AND status = 'pending'`,
        [approverId, reason, id],
      )

      if (result.rowCount === 0) {
        throw new Error('거부 가능한 신청을 찾을 수 없습니다.')
      }

      logger.info(`Asset request rejected: ${id}`)
    } catch (error) {
      logger.error('Failed to reject asset request:', error)
      throw error
    }
  }

  /**
   * 자산 신청 취소
   */
  async cancelRequest(id: string, requesterId: string): Promise<void> {
    try {
      const result = await query(
        `UPDATE asset_requests 
         SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1 AND requester_id = $2 AND status = 'pending'`,
        [id, requesterId],
      )

      if (result.rowCount === 0) {
        throw new Error('취소 가능한 신청을 찾을 수 없습니다.')
      }

      logger.info(`Asset request cancelled: ${id}`)
    } catch (error) {
      logger.error('Failed to cancel asset request:', error)
      throw error
    }
  }

  /**
   * 사용자의 자산 신청 목록 조회
   */
  async getMyRequests(
    userId: string,
    filters: Partial<AssetRequestFilters> = {},
  ): Promise<AssetRequest[]> {
    return this.list({ ...filters, requester_id: userId })
  }

  /**
   * 대기 중인 신청 목록 조회 (관리자용)
   */
  async getPendingRequests(limit = 50): Promise<AssetRequest[]> {
    return this.list({ status: 'pending', limit })
  }

  /**
   * 차량 예약 가능 여부 확인
   */
  async checkVehicleAvailability(
    assetId: string,
    startDatetime: string,
    endDatetime: string,
    excludeRequestId?: string,
  ): Promise<boolean> {
    try {
      const conditions = [
        'ar.asset_id = $1',
        'ar.request_type = $2',
        'ar.status = $3',
        'ar.start_datetime < $5',
        'ar.end_datetime > $4',
      ]
      const params: unknown[] = [
        assetId,
        'vehicle_reservation',
        'approved',
        startDatetime,
        endDatetime,
      ]
      let paramIndex = 6

      if (excludeRequestId) {
        conditions.push(`ar.id != $${paramIndex++}`)
        params.push(excludeRequestId)
      }

      const result = await query(
        `SELECT id FROM asset_requests 
         WHERE ${conditions.join(' AND ')}`,
        params,
      )

      return result.rows.length === 0
    } catch (error) {
      logger.error('Failed to check vehicle availability:', error)
      throw error
    }
  }

  /**
   * 신청 통계 조회
   */
  async getRequestStats(): Promise<{
    pending: number
    approved: number
    rejected: number
    completed: number
  }> {
    try {
      const result = await query(
        `SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM asset_requests`,
      )

      return {
        pending: parseInt(result.rows[0].pending),
        approved: parseInt(result.rows[0].approved),
        rejected: parseInt(result.rows[0].rejected),
        completed: parseInt(result.rows[0].completed),
      }
    } catch (error) {
      logger.error('Failed to get request stats:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const assetRequestService = new AssetRequestService()
