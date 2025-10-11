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

    // user.id가 곧 employee_id입니다 (출퇴근/연차 조회 API와 동일)
    const employeeId = user.id

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
    // DB에서 KST 기준 오늘 날짜 가져오기
    const todayResult = await query(`SELECT CURRENT_DATE::text as today`)
    const today = todayResult.rows[0].today // KST 기준 오늘 날짜 (예: "2025-10-11")
    const startDate = leaveRequest.start_date.substring(0, 10) // KST 문자열에서 날짜 부분

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
    console.error('❌ Leave cancellation error:', error)
    const message = error instanceof Error ? error.message : '연차 취소에 실패했습니다.'
    return json({ error: message }, { status: 500 })
  }
}
