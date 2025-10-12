/**
 * Attendance Service
 *
 * 출퇴근 관련 비즈니스 로직을 처리하는 서비스 레이어
 *
 * 책임:
 * - 데이터베이스 쿼리 실행
 * - 비즈니스 규칙 적용 (지각/조기퇴근 판정)
 * - IP 검증
 * - 날짜 계산
 */

import { query } from '$lib/database/connection'
import { getHoliday } from '$lib/utils/holidays'
import { logger } from '$lib/utils/logger'

// ============================================================================
// 상수 정의
// ============================================================================

export const ATTENDANCE_ERRORS = {
  NO_CHECK_IN: '출근 기록이 없습니다. 먼저 출근을 기록해주세요.',
  IP_NOT_ALLOWED: '허용되지 않은 IP 주소입니다.',
  FETCH_FAILED: '출퇴근 데이터 조회에 실패했습니다.',
  RECORD_FAILED: '출퇴근 기록에 실패했습니다.',
} as const

export const ATTENDANCE_MESSAGES = {
  CHECK_IN: '출근이 기록되었습니다.',
  CHECK_IN_LATE: '출근이 기록되었습니다. (지각)',
  CHECK_OUT: '퇴근이 기록되었습니다.',
  CHECK_OUT_EARLY: '퇴근이 기록되었습니다. (조기퇴근)',
  BREAK_START: '휴게가 시작되었습니다.',
  BREAK_END: '휴게가 종료되었습니다.',
} as const

// ============================================================================
// SQL 쿼리 템플릿
// ============================================================================

const QUERIES = {
  // 오늘의 출퇴근 기록
  GET_TODAY_ATTENDANCE: `
    SELECT
      id,
      DATE(check_in_time)::text as date,
      check_in_time::text as check_in_time,
      check_out_time::text as check_out_time,
      break_start_time::text as break_start_time,
      break_end_time::text as break_end_time,
      total_work_hours,
      overtime_hours,
      status,
      notes
    FROM attendance
    WHERE employee_id = $1 AND DATE(check_in_time) = $2::date
  `,

  // 주간 출퇴근 기록
  GET_WEEK_ATTENDANCE: `
    SELECT
      DATE(check_in_time)::text as date,
      check_in_time::text as check_in_time,
      check_out_time::text as check_out_time,
      total_work_hours,
      overtime_hours,
      status
    FROM attendance
    WHERE employee_id = $1
      AND DATE(check_in_time) >= $2::date
      AND DATE(check_in_time) <= $3::date
    ORDER BY DATE(check_in_time) DESC
  `,

  // 월간 통계
  GET_MONTH_STATS: `
    SELECT
      COUNT(*) as total_days,
      COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END) as work_days,
      COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
      COUNT(CASE WHEN status = 'early_leave' THEN 1 END) as early_leave_days,
      COALESCE(SUM(total_work_hours), 0) as total_work_hours,
      COALESCE(SUM(overtime_hours), 0) as total_overtime_hours
    FROM attendance
    WHERE employee_id = $1
      AND DATE(check_in_time) >= $2::date
      AND DATE(check_in_time) <= $3::date
  `,

  // 월간 캘린더 기록
  GET_MONTH_CALENDAR: `
    SELECT
      DATE(check_in_time)::text as date_str,
      check_in_time::text as check_in_time,
      check_out_time::text as check_out_time,
      total_work_hours,
      status
    FROM attendance
    WHERE employee_id = $1
      AND DATE(check_in_time) >= $2::date
      AND DATE(check_in_time) <= $3::date
    ORDER BY DATE(check_in_time) ASC
  `,

  // 출근 기록
  RECORD_CHECK_IN: `
    INSERT INTO attendance (employee_id, check_in_time, check_in_ip, notes, status)
    VALUES ($1, now(), $2, $3, $4)
    ON CONFLICT (employee_id, check_in_date)
    DO UPDATE SET
      check_in_time = now(),
      check_in_ip = $2,
      notes = $3,
      status = $4,
      updated_at = now()
    RETURNING 
      id,
      employee_id,
      check_in_time::text,
      check_out_time::text,
      break_start_time::text,
      break_end_time::text,
      total_work_hours,
      overtime_hours,
      status,
      notes,
      created_at::text,
      updated_at::text
  `,

  // 퇴근 기록
  RECORD_CHECK_OUT: `
    UPDATE attendance
    SET
      check_out_time = now(),
      check_out_ip = $2,
      notes = COALESCE($3, notes),
      updated_at = now()
    WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE
    RETURNING 
      id,
      employee_id,
      check_in_time::text,
      check_out_time::text,
      break_start_time::text,
      break_end_time::text,
      total_work_hours,
      overtime_hours,
      status,
      notes,
      created_at::text,
      updated_at::text
  `,

  // 조기퇴근 기록
  RECORD_CHECK_OUT_EARLY: `
    UPDATE attendance
    SET
      check_out_time = now(),
      check_out_ip = $2,
      notes = COALESCE($3, notes),
      status = 'early_leave',
      updated_at = now()
    WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE
    RETURNING 
      id,
      employee_id,
      check_in_time::text,
      check_out_time::text,
      break_start_time::text,
      break_end_time::text,
      total_work_hours,
      overtime_hours,
      status,
      notes,
      created_at::text,
      updated_at::text
  `,

  // 휴게 시작
  RECORD_BREAK_START: `
    UPDATE attendance
    SET
      break_start_time = now(),
      updated_at = now()
    WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE
    RETURNING 
      id,
      employee_id,
      check_in_time::text,
      check_out_time::text,
      break_start_time::text,
      break_end_time::text,
      total_work_hours,
      overtime_hours,
      status,
      notes,
      created_at::text,
      updated_at::text
  `,

  // 휴게 종료
  RECORD_BREAK_END: `
    UPDATE attendance
    SET
      break_end_time = now(),
      updated_at = now()
    WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE
    RETURNING 
      id,
      employee_id,
      check_in_time::text,
      check_out_time::text,
      break_start_time::text,
      break_end_time::text,
      total_work_hours,
      overtime_hours,
      status,
      notes,
      created_at::text,
      updated_at::text
  `,

  // 회사 ID 조회
  GET_COMPANY_ID: `SELECT id FROM companies LIMIT 1`,

  // 출퇴근 설정 조회
  GET_ATTENDANCE_SETTINGS: `
    SELECT
      work_start_time,
      work_end_time,
      late_threshold_minutes,
      early_leave_threshold_minutes,
      allowed_ips,
      require_ip_check
    FROM attendance_settings
    WHERE company_id = $1
  `,
} as const

// ============================================================================
// 타입 정의
// ============================================================================

export interface AttendanceSettings {
  work_start_time: string
  work_end_time: string
  late_threshold_minutes: number
  early_leave_threshold_minutes: number
  allowed_ips: string[]
  require_ip_check: boolean
}

export interface AttendanceRecord {
  id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  break_start_time: string | null
  break_end_time: string | null
  total_work_hours: number | null
  overtime_hours: number | null
  status: string | null
  notes: string | null
}

export interface AttendanceStats {
  totalDays: number
  workDays: number
  lateDays: number
  earlyLeaveDays: number
  totalWorkHours: number
  totalOvertimeHours: number
}

export interface AttendanceData {
  today: AttendanceRecord | null
  week: AttendanceRecord[]
  month: AttendanceRecord[]
  stats: AttendanceStats
}

export interface ServiceResult<T> {
  success: boolean
  data?: T
  message?: string
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 주간 범위 계산
 */
function getWeekRange(date: string) {
  const weekStart = new Date(date)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
  }
}

/**
 * 월간 범위 계산
 */
function getMonthRange(date: string) {
  const monthStart = new Date(date)
  monthStart.setDate(1)

  const monthEnd = new Date(monthStart)
  monthEnd.setMonth(monthEnd.getMonth() + 1)
  monthEnd.setDate(0)

  return {
    start: monthStart.toISOString().split('T')[0],
    end: monthEnd.toISOString().split('T')[0],
  }
}

/**
 * 출근 상태 판정 (지각 여부)
 */
function determineCheckInStatus(
  now: Date,
  date: string,
  settings: AttendanceSettings | null,
): 'present' | 'late' {
  // 설정이 없거나 휴일이면 정상 처리
  if (!settings || getHoliday(date)) {
    return 'present'
  }

  const workStartTime = new Date(`${date} ${settings.work_start_time}`)
  const diffMinutes = (now.getTime() - workStartTime.getTime()) / (1000 * 60)

  return diffMinutes > settings.late_threshold_minutes ? 'late' : 'present'
}

/**
 * 퇴근 상태 판정 (조기퇴근 여부)
 */
function isEarlyLeave(now: Date, date: string, settings: AttendanceSettings | null): boolean {
  // 설정이 없거나 휴일이면 조기퇴근 아님
  if (!settings || getHoliday(date)) {
    return false
  }

  const workEndTime = new Date(`${date} ${settings.work_end_time}`)
  const diffMinutes = (workEndTime.getTime() - now.getTime()) / (1000 * 60)

  return diffMinutes > settings.early_leave_threshold_minutes
}

/**
 * IP 주소 검증
 */
function validateIpAddress(
  clientIp: string,
  settings: AttendanceSettings | null,
): { valid: boolean; message?: string } {
  if (!settings?.require_ip_check || !settings.allowed_ips?.length) {
    return { valid: true }
  }

  if (!settings.allowed_ips.includes(clientIp)) {
    return {
      valid: false,
      message: `${ATTENDANCE_ERRORS.IP_NOT_ALLOWED} (현재 IP: ${clientIp})`,
    }
  }

  return { valid: true }
}

/**
 * 출퇴근 설정 조회
 */
async function fetchAttendanceSettings(): Promise<AttendanceSettings | null> {
  const companyResult = await query(QUERIES.GET_COMPANY_ID)
  const companyId = companyResult.rows[0]?.id

  if (!companyId) {
    return null
  }

  const settingsResult = await query(QUERIES.GET_ATTENDANCE_SETTINGS, [companyId])
  return settingsResult.rows[0] || null
}

// ============================================================================
// 비즈니스 로직 함수
// ============================================================================

/**
 * 출퇴근 데이터 조회
 *
 * @param employeeId - 직원 ID
 * @param date - 조회 날짜 (YYYY-MM-DD)
 * @returns 오늘/주간/월간 출퇴근 데이터
 */
export async function fetchAttendanceData(
  employeeId: string,
  date?: string,
): Promise<ServiceResult<AttendanceData>> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0]

    // 날짜 범위 계산
    const weekRange = getWeekRange(targetDate)
    const monthRange = getMonthRange(targetDate)

    logger.info(`[fetchAttendanceData] Loading for employee: ${employeeId}, date: ${targetDate}`)

    // 병렬 쿼리 실행 (성능 최적화)
    const [todayResult, weekResult, statsResult, monthResult] = await Promise.all([
      query(QUERIES.GET_TODAY_ATTENDANCE, [employeeId, targetDate]),
      query(QUERIES.GET_WEEK_ATTENDANCE, [employeeId, weekRange.start, weekRange.end]),
      query(QUERIES.GET_MONTH_STATS, [employeeId, monthRange.start, monthRange.end]),
      query(QUERIES.GET_MONTH_CALENDAR, [employeeId, monthRange.start, monthRange.end]),
    ])

    // 응답 데이터 구성
    const stats = statsResult.rows[0]
    const monthRecords = monthResult.rows.map((row) => ({
      date: row.date_str,
      check_in_time: row.check_in_time,
      check_out_time: row.check_out_time,
      total_work_hours: row.total_work_hours,
      status: row.status,
    }))

    logger.info(
      `[fetchAttendanceData] Success: today=${!!todayResult.rows[0]}, week=${weekResult.rows.length}, month=${monthRecords.length}`,
    )

    return {
      success: true,
      data: {
        today: todayResult.rows[0] || null,
        week: weekResult.rows,
        month: monthRecords,
        stats: {
          totalDays: parseInt(stats.total_days),
          workDays: parseInt(stats.work_days),
          lateDays: parseInt(stats.late_days),
          earlyLeaveDays: parseInt(stats.early_leave_days),
          totalWorkHours: parseFloat(stats.total_work_hours),
          totalOvertimeHours: parseFloat(stats.total_overtime_hours),
        },
      },
    }
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [fetchAttendanceData] Error fetching attendance data')
    logger.error('   Employee ID:', employeeId)
    logger.error('   Date:', date)
    logger.error('   Error:', error)
    if (error instanceof Error) {
      logger.error('   Error message:', error.message)
      logger.error('   Stack trace:')
      logger.error(error.stack || 'Stack trace not available')
    }
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return {
      success: false,
      message: ATTENDANCE_ERRORS.FETCH_FAILED,
    }
  }
}

/**
 * 출근 기록
 *
 * @param employeeId - 직원 ID
 * @param date - 날짜 (YYYY-MM-DD)
 * @param clientIp - 클라이언트 IP
 * @param notes - 메모
 * @returns 출근 기록 결과
 */
export async function recordCheckIn(
  employeeId: string,
  date: string,
  clientIp: string,
  notes?: string,
): Promise<ServiceResult<AttendanceRecord>> {
  try {
    const now = new Date()
    logger.info(`[recordCheckIn] Employee: ${employeeId}, Date: ${date}, IP: ${clientIp}`)

    const settings = await fetchAttendanceSettings()

    // IP 주소 검증
    const ipValidation = validateIpAddress(clientIp, settings)
    if (!ipValidation.valid) {
      logger.warn(`[recordCheckIn] IP validation failed for ${clientIp}`)
      return {
        success: false,
        message: ipValidation.message,
      }
    }

    // 출근 상태 판정
    const status = determineCheckInStatus(now, date, settings)
    logger.info(`[recordCheckIn] Status determined: ${status}`)

    // 출근 기록
    const result = await query(QUERIES.RECORD_CHECK_IN, [employeeId, clientIp, notes || '', status])

    const message =
      status === 'late' ? ATTENDANCE_MESSAGES.CHECK_IN_LATE : ATTENDANCE_MESSAGES.CHECK_IN

    logger.info(`[recordCheckIn] Success: ${message}`)
    return {
      success: true,
      data: result.rows[0],
      message,
    }
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [recordCheckIn] Error recording check-in')
    logger.error('   Employee ID:', employeeId)
    logger.error('   Date:', date)
    logger.error('   Client IP:', clientIp)
    logger.error('   Error:', error)
    if (error instanceof Error) {
      logger.error('   Error message:', error.message)
      logger.error('   Stack trace:')
      logger.error(error.stack || 'Stack trace not available')
    }
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return {
      success: false,
      message: ATTENDANCE_ERRORS.RECORD_FAILED,
    }
  }
}

/**
 * 퇴근 기록
 *
 * @param employeeId - 직원 ID
 * @param clientIp - 클라이언트 IP
 * @param notes - 메모
 * @returns 퇴근 기록 결과
 */
export async function recordCheckOut(
  employeeId: string,
  clientIp: string,
  notes?: string,
): Promise<ServiceResult<AttendanceRecord>> {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    logger.info(`[recordCheckOut] Employee: ${employeeId}, IP: ${clientIp}`)

    const settings = await fetchAttendanceSettings()

    // IP 주소 검증
    const ipValidation = validateIpAddress(clientIp, settings)
    if (!ipValidation.valid) {
      logger.warn(`[recordCheckOut] IP validation failed for ${clientIp}`)
      return {
        success: false,
        message: ipValidation.message,
      }
    }

    // 조기퇴근 여부 판정
    const earlyLeave = isEarlyLeave(now, today, settings)
    logger.info(`[recordCheckOut] Early leave: ${earlyLeave}`)

    // 퇴근 기록
    const queryStr = earlyLeave ? QUERIES.RECORD_CHECK_OUT_EARLY : QUERIES.RECORD_CHECK_OUT
    const result = await query(queryStr, [employeeId, clientIp, notes || ''])

    if (result.rows.length === 0) {
      logger.warn(`[recordCheckOut] No check-in record found for employee ${employeeId}`)
      return {
        success: false,
        message: ATTENDANCE_ERRORS.NO_CHECK_IN,
      }
    }

    const message = earlyLeave ? ATTENDANCE_MESSAGES.CHECK_OUT_EARLY : ATTENDANCE_MESSAGES.CHECK_OUT

    logger.info(`[recordCheckOut] Success: ${message}`)
    return {
      success: true,
      data: result.rows[0],
      message,
    }
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [recordCheckOut] Error recording check-out')
    logger.error('   Employee ID:', employeeId)
    logger.error('   Client IP:', clientIp)
    logger.error('   Error:', error)
    if (error instanceof Error) {
      logger.error('   Error message:', error.message)
      logger.error('   Stack trace:')
      logger.error(error.stack || 'Stack trace not available')
    }
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return {
      success: false,
      message: ATTENDANCE_ERRORS.RECORD_FAILED,
    }
  }
}

/**
 * 휴게 시작 기록
 *
 * @param employeeId - 직원 ID
 * @returns 휴게 시작 기록 결과
 */
export async function recordBreakStart(
  employeeId: string,
): Promise<ServiceResult<AttendanceRecord>> {
  try {
    logger.info(`[recordBreakStart] Employee: ${employeeId}`)
    const result = await query(QUERIES.RECORD_BREAK_START, [employeeId])

    if (result.rows.length === 0) {
      logger.warn(`[recordBreakStart] No check-in record found for employee ${employeeId}`)
      return {
        success: false,
        message: ATTENDANCE_ERRORS.NO_CHECK_IN,
      }
    }

    logger.info(`[recordBreakStart] Success`)
    return {
      success: true,
      data: result.rows[0],
      message: ATTENDANCE_MESSAGES.BREAK_START,
    }
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [recordBreakStart] Error recording break start')
    logger.error('   Employee ID:', employeeId)
    logger.error('   Error:', error)
    if (error instanceof Error) {
      logger.error('   Error message:', error.message)
      logger.error('   Stack trace:')
      logger.error(error.stack || 'Stack trace not available')
    }
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return {
      success: false,
      message: ATTENDANCE_ERRORS.RECORD_FAILED,
    }
  }
}

/**
 * 휴게 종료 기록
 *
 * @param employeeId - 직원 ID
 * @returns 휴게 종료 기록 결과
 */
export async function recordBreakEnd(employeeId: string): Promise<ServiceResult<AttendanceRecord>> {
  try {
    logger.info(`[recordBreakEnd] Employee: ${employeeId}`)
    const result = await query(QUERIES.RECORD_BREAK_END, [employeeId])

    if (result.rows.length === 0) {
      logger.warn(`[recordBreakEnd] No check-in record found for employee ${employeeId}`)
      return {
        success: false,
        message: ATTENDANCE_ERRORS.NO_CHECK_IN,
      }
    }

    logger.info(`[recordBreakEnd] Success`)
    return {
      success: true,
      data: result.rows[0],
      message: ATTENDANCE_MESSAGES.BREAK_END,
    }
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [recordBreakEnd] Error recording break end')
    logger.error('   Employee ID:', employeeId)
    logger.error('   Error:', error)
    if (error instanceof Error) {
      logger.error('   Error message:', error.message)
      logger.error('   Stack trace:')
      logger.error(error.stack || 'Stack trace not available')
    }
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return {
      success: false,
      message: ATTENDANCE_ERRORS.RECORD_FAILED,
    }
  }
}
