import { requireRole } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 연차 승인 대기 목록 조회 (관리자용)
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireRole(event, ['ADMIN', 'MANAGER'])
    const { url } = event

    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status') || 'pending'
    const department = url.searchParams.get('department')
    const employeeName = url.searchParams.get('employeeName')

    const offset = (page - 1) * limit

    // WHERE 조건 구성
    const whereConditions = ['lr.status = $1']
    const params = [status, limit, offset]
    let paramIndex = 4

    if (department) {
      whereConditions.push(`e.department = $${paramIndex}`)
      params.push(department)
      paramIndex++
    }

    if (employeeName) {
      whereConditions.push(`(e.first_name || ' ' || e.last_name) ILIKE $${paramIndex}`)
      params.push(`%${employeeName}%`)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // 연차 신청 목록 조회
    const requestsResult = await query(
      `
      SELECT
        lr.id,
        lr.employee_id,
        lr.leave_type_id,
        lr.start_date::text as start_date,
        lr.end_date::text as end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.approved_by,
        lr.approved_at::text as approved_at,
        lr.rejection_reason,
        lr.created_at::text as created_at,
        lr.updated_at::text as updated_at,
        e.first_name || ' ' || e.last_name as employee_name,
        e.employee_id,
        e.department,
        e.position,
        e.email,
        e.phone,
        approver.first_name || ' ' || approver.last_name as approver_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN employees approver ON lr.approved_by = approver.id
      WHERE ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      params,
    )

    // 전체 개수 조회
    const countResult = await query(
      `
      SELECT COUNT(*) as total
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      WHERE ${whereClause}
    `,
      params.slice(0, -2),
    ) // limit, offset 제거

    const total = parseInt(countResult.rows[0].total)

    // 통계 조회
    const statsResult = await query(`
      SELECT
        COUNT(*) as total_requests,
        COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN lr.status = 'rejected' THEN 1 END) as rejected_requests,
        COUNT(CASE WHEN lr.status = 'cancelled' THEN 1 END) as cancelled_requests
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      WHERE lr.created_at >= CURRENT_DATE - INTERVAL '30 days'
    `)

    const stats = statsResult.rows[0]

    return json({
      success: true,
      data: {
        requests: requestsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          totalRequests: parseInt(stats.total_requests),
          pendingRequests: parseInt(stats.pending_requests),
          approvedRequests: parseInt(stats.approved_requests),
          rejectedRequests: parseInt(stats.rejected_requests),
          cancelledRequests: parseInt(stats.cancelled_requests),
        },
      },
    })
  } catch (error) {
    logger.error('Error fetching leave approval requests:', error)
    return json({ success: false, message: '연차 승인 요청 조회에 실패했습니다.' }, { status: 500 })
  }
}

// 연차 승인/반려 처리
export const POST: RequestHandler = async (event) => {
  try {
    const { user } = await requireRole(event, ['ADMIN', 'MANAGER'])
    const { requestId, action, rejectionReason } = await event.request.json()

    if (!requestId || !action) {
      return json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return json({ success: false, message: '잘못된 액션입니다.' }, { status: 400 })
    }

    // 연차 신청 정보 조회
    const requestResult = await query(
      `
      SELECT 
        lr.id,
        lr.employee_id,
        lr.leave_type_id,
        lr.start_date::text as start_date,
        lr.end_date::text as end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.approved_by,
        lr.approved_at::text as approved_at,
        lr.rejection_reason,
        lr.created_at::text as created_at,
        lr.updated_at::text as updated_at,
        e.first_name || ' ' || e.last_name as employee_name,
        e.email as employee_email
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      WHERE lr.id = $1
    `,
      [requestId],
    )

    if (requestResult.rows.length === 0) {
      return json({ success: false, message: '연차 신청을 찾을 수 없습니다.' }, { status: 404 })
    }

    const leaveRequest = requestResult.rows[0]

    if (leaveRequest.status !== 'pending') {
      return json({ success: false, message: '이미 처리된 연차 신청입니다.' }, { status: 400 })
    }

    // 연차 신청 상태 업데이트
    const updateResult = await query(
      `
      UPDATE leave_requests 
      SET 
        status = $2,
        approved_by = $3,
        approved_at = CURRENT_TIMESTAMP,
        rejection_reason = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING 
        id,
        employee_id,
        leave_type_id,
        start_date::text,
        end_date::text,
        total_days,
        reason,
        status,
        approved_by,
        approved_at::text,
        rejection_reason,
        created_at::text,
        updated_at::text
    `,
      [requestId, action === 'approve' ? 'approved' : 'rejected', user.id, rejectionReason],
    )

    // 승인된 경우 연차 잔여일수 차감 (트리거에서 자동 처리됨)

    // 신청자에게 알림 생성
    await query(
      `
      INSERT INTO notifications (
        employee_id,
        title,
        message,
        type,
        category,
        action_url,
        action_data
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'leave',
        '/dashboard/leave',
        $5::jsonb
      )
    `,
      [
        leaveRequest.employee_id,
        action === 'approve' ? '연차 승인 알림' : '연차 반려 알림',
        action === 'approve'
          ? `귀하의 ${leaveRequest.start_date}부터 ${leaveRequest.end_date}까지 ${leaveRequest.days}일 연차가 승인되었습니다.`
          : `귀하의 ${leaveRequest.start_date}부터 ${leaveRequest.end_date}까지 연차 신청이 반려되었습니다. 사유: ${rejectionReason || '없음'}`,
        action === 'approve' ? 'success' : 'warning',
        JSON.stringify({ requestId, action }),
      ],
    )

    return json({
      success: true,
      message: action === 'approve' ? '연차가 승인되었습니다.' : '연차가 반려되었습니다.',
      data: updateResult.rows[0],
    })
  } catch (error) {
    logger.error('Error processing leave approval:', error)
    return json({ success: false, message: '연차 승인 처리에 실패했습니다.' }, { status: 500 })
  }
}
