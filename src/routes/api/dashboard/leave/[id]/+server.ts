import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { requireAuth } from '$lib/auth/middleware'

/**
 * DELETE /api/dashboard/leave/[id]
 * 연차 신청 취소
 */
export const DELETE: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const requestId = event.params.id

    // 직원 정보 조회
    const employeeResult = await query(
      `SELECT id FROM employees WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [user.id],
    )

    if (employeeResult.rows.length === 0) {
      return json({ error: '직원 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const employeeId = employeeResult.rows[0].id

    // 연차 신청 조회
    const leaveResult = await query(
      `SELECT lr.*, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.id = $1 AND lr.employee_id = $2`,
      [requestId, employeeId],
    )

    if (leaveResult.rows.length === 0) {
      return json({ error: '연차 신청을 찾을 수 없습니다.' }, { status: 404 })
    }

    const leaveRequest = leaveResult.rows[0]

    // 이미 시작된 연차는 취소 불가
    const today = new Date().toISOString().split('T')[0]
    const startDate = new Date(leaveRequest.start_date).toISOString().split('T')[0]

    if (startDate <= today) {
      return json({ error: '이미 시작된 연차는 취소할 수 없습니다.' }, { status: 400 })
    }

    // 연차 신청 삭제
    await query(`DELETE FROM leave_requests WHERE id = $1`, [requestId])

    // 연차 잔액은 실시간 집계로 처리하므로 별도 복원 불필요

    return json({
      success: true,
      message: '연차 신청이 취소되었습니다.',
    })
  } catch (error) {
    console.error('연차 취소 실패:', error)
    return json({ error: '연차 취소에 실패했습니다.' }, { status: 500 })
  }
}
