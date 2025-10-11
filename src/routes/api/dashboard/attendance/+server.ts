/**
 * Attendance API Handler
 *
 * HTTP 요청/응답만 처리
 * 비즈니스 로직은 attendance-service에 위임
 */

import { requireAuth } from '$lib/auth/middleware'
import * as attendanceService from '$lib/services/attendance/attendance-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * GET: 출퇴근 데이터 조회
 * - 오늘의 출퇴근 기록
 * - 이번 주 출퇴근 기록
 * - 이번 달 통계
 * - 월간 캘린더 데이터
 */
export const GET: RequestHandler = async (event) => {
  const { user } = await requireAuth(event)
  const date = event.url.searchParams.get('date') || undefined

  const result = await attendanceService.fetchAttendanceData(user.id, date)

  if (!result.success) {
    return json({ success: false, message: result.message }, { status: 500 })
  }

  return json({ success: true, data: result.data })
}

/**
 * POST: 출퇴근 기록
 * - check_in: 출근
 * - check_out: 퇴근
 * - break_start: 휴게 시작
 * - break_end: 휴게 종료
 */
export const POST: RequestHandler = async (event) => {
  const { user } = await requireAuth(event)
  const { action, notes } = await event.request.json()

  const employeeId = user.id
  const today = new Date().toISOString().split('T')[0]
  const clientIp = event.getClientAddress()

  let result

  switch (action) {
    case 'check_in':
      result = await attendanceService.recordCheckIn(employeeId, today, clientIp, notes)
      break

    case 'check_out':
      result = await attendanceService.recordCheckOut(employeeId, today, clientIp, notes)
      break

    case 'break_start':
      result = await attendanceService.recordBreakStart(employeeId, today)
      break

    case 'break_end':
      result = await attendanceService.recordBreakEnd(employeeId, today)
      break

    default:
      return json({ success: false, message: '알 수 없는 액션입니다.' }, { status: 400 })
  }

  if (!result.success) {
    const status = result.message?.includes('허용되지 않은 IP') ? 403 : 400
    return json({ success: false, message: result.message }, { status })
  }

  return json({
    success: true,
    message: result.message,
    data: result.data,
  })
}
