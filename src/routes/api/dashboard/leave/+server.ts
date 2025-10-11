import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { getWorkingDays, isNonWorkingDay } from '$lib/utils/holidays'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * GET /api/dashboard/leave
 * 연차 데이터 조회 (캘린더용)
 * Query params:
 * - date: YYYY-MM-DD (해당 월의 데이터 조회)
 */
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { url } = event

    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
    const all = url.searchParams.get('all') === 'true' // 올해 전체 데이터 요청 여부
    const [year, month] = date.split('-')

    // user.id가 곧 employee_id입니다 (출퇴근 API와 동일한 패턴)
    const employeeId = user.id

    // 직원 기본 정보 조회 (이름 표시용)
    const employeeInfoResult = await query(
      `SELECT employee_id, first_name, last_name FROM employees WHERE id = $1`,
      [employeeId],
    )
    const employeeInfo = employeeInfoResult.rows[0] || {
      employee_id: '',
      first_name: '',
      last_name: '',
    }

    // 연차 신청 내역 조회
    let leaveRequestsResult
    if (all) {
      // 올해 전체 데이터 조회
      leaveRequestsResult = await query(
        `SELECT
          lr.id,
          lr.start_date::text as start_date,
          lr.end_date::text as end_date,
          lr.total_days,
          lr.reason,
          lr.status,
          COALESCE(lr.created_at::text, '') as created_at,
          COALESCE(lr.approved_at::text, '') as approved_at,
          lt.name as leave_type_name,
          lt.id as leave_type_id
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.employee_id = $1
          AND EXTRACT(YEAR FROM lr.start_date) = $2
        ORDER BY lr.start_date`,
        [employeeId, parseInt(year)],
      )
    } else {
      // 해당 월의 연차 신청 내역 조회
      leaveRequestsResult = await query(
        `SELECT
          lr.id,
          lr.start_date::text as start_date,
          lr.end_date::text as end_date,
          lr.total_days,
          lr.reason,
          lr.status,
          COALESCE(lr.created_at::text, '') as created_at,
          COALESCE(lr.approved_at::text, '') as approved_at,
          lt.name as leave_type_name,
          lt.id as leave_type_id
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.employee_id = $1
          AND DATE_TRUNC('month', lr.start_date) = DATE_TRUNC('month', $2::date)
        ORDER BY lr.start_date`,
        [employeeId, `${year}-${month}-01`],
      )
    }

    // 연차 잔액 조회 (현재 연도)
    // total_days는 테이블에서, used_days와 remaining_days는 실시간 집계
    // 모든 타입(연차, 반차, 반반차)의 승인된 요청을 합산 (경조사 제외)
    const balanceResult = await query(
      `WITH used_calc AS (
        SELECT
          lb.employee_id,
          lb.year,
          COALESCE(SUM(lr.total_days), 0) as total_used
        FROM leave_balances lb
        LEFT JOIN leave_requests lr ON lr.employee_id = lb.employee_id
          AND lr.status = 'approved'
          AND EXTRACT(YEAR FROM lr.start_date) = lb.year
          AND lr.leave_type_id IN (
            SELECT id FROM leave_types WHERE name IN ('연차', '반차', '반반차')
          )
        WHERE lb.employee_id = $1 AND lb.year = $2
        GROUP BY lb.employee_id, lb.year
      )
      SELECT
        lb.year,
        lb.total_days,
        uc.total_used as used_days,
        lb.total_days - uc.total_used as remaining_days,
        lt.name as leave_type_name
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      JOIN used_calc uc ON uc.employee_id = lb.employee_id
        AND uc.year = lb.year
      WHERE lb.employee_id = $1
        AND lb.year = $2
        AND lt.name = '연차'
      LIMIT 1`,
      [employeeId, parseInt(year)],
    )

    // 연차 촉진 대상 여부 확인 (9월 1일 이후, 입사 1년 이상, 소진율 50% 이하)
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    let needsPromotion = false

    if (currentMonth >= 9 && balanceResult.rows[0]) {
      const balance = balanceResult.rows[0]
      const usageRate = balance.used_days / balance.total_days

      // 입사일 확인
      const employeeInfoResult = await query(
        `SELECT hire_date::text FROM employees WHERE id = $1`,
        [employeeId],
      )

      if (employeeInfoResult.rows[0]) {
        const hireDate = new Date(employeeInfoResult.rows[0].hire_date)
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

        // 입사 1년 이상 && 소진율 50% 이하
        if (hireDate <= oneYearAgo && usageRate <= 0.5) {
          needsPromotion = true
        }
      }
    }

    const responseData = {
      employee: {
        id: employeeId,
        employeeId: employeeInfo.employee_id,
        name: `${employeeInfo.last_name}${employeeInfo.first_name}`,
      },
      balance: balanceResult.rows[0] || null,
      requests: leaveRequestsResult.rows,
      needsPromotion,
    }

    return json(responseData)
  } catch (error) {
    console.error('❌ Leave data fetch error:', error)
    const message = error instanceof Error ? error.message : '연차 데이터 조회에 실패했습니다.'
    return json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/dashboard/leave
 * 연차 신청 (승인 없이 바로 approved 처리)
 * Body:
 * - leaveTypeId: string
 * - startDate: YYYY-MM-DD
 * - endDate: YYYY-MM-DD
 * - totalDays: number
 * - reason: string
 * - halfDayType?: '10-15' | '15-19' (반차인 경우)
 * - quarterDayType?: '10-12' | '13-15' | '15-17' | '17-19' (반반차인 경우)
 */
export const POST: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { leaveTypeId, startDate, endDate, totalDays, reason, halfDayType, quarterDayType } =
      await event.request.json()

    // 입력 검증
    if (!leaveTypeId || !startDate || !endDate || !totalDays || !reason) {
      return json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    // 반차/반반차는 휴일 불가 검증
    const leaveTypeResult = await query(`SELECT name FROM leave_types WHERE id = $1`, [leaveTypeId])

    if (leaveTypeResult.rows.length === 0) {
      return json({ error: '올바르지 않은 연차 타입입니다.' }, { status: 400 })
    }

    const leaveTypeName = leaveTypeResult.rows[0].name

    // 반차, 반반차는 하루만 신청 가능하고, 휴일에는 불가
    if (leaveTypeName === '반차' || leaveTypeName === '반반차') {
      if (startDate !== endDate) {
        return json({ error: '반차/반반차는 하루만 신청 가능합니다.' }, { status: 400 })
      }
      if (isNonWorkingDay(startDate)) {
        return json({ error: '휴일에는 반차/반반차를 신청할 수 없습니다.' }, { status: 400 })
      }
    }

    // 연차의 경우: 실제 근무일 수 계산
    const actualWorkingDays = getWorkingDays(startDate, endDate)

    // 기간 내에 근무일이 하나도 없으면 신청 불가
    if (actualWorkingDays === 0) {
      return json({ error: '선택한 기간에 근무일이 없습니다.' }, { status: 400 })
    }

    // user.id가 곧 employee_id입니다 (출퇴근 API와 동일한 패턴)
    const employeeId = user.id

    // 타임스탬프 생성 (한국 시간 기준)
    let startTimestamp: string
    let endTimestamp: string

    if (leaveTypeName === '연차') {
      // 연차: 00:00:00 ~ 23:59:59
      startTimestamp = `${startDate}T00:00:00+09:00`
      endTimestamp = `${endDate}T23:59:59+09:00`
    } else if (leaveTypeName === '반차') {
      // 반차: 10-15시 또는 15-19시
      if (halfDayType === '10-15') {
        startTimestamp = `${startDate}T10:00:00+09:00`
        endTimestamp = `${startDate}T15:00:00+09:00`
      } else {
        // 15-19
        startTimestamp = `${startDate}T15:00:00+09:00`
        endTimestamp = `${startDate}T19:00:00+09:00`
      }
    } else if (leaveTypeName === '반반차') {
      // 반반차: 10-12, 13-15, 15-17, 17-19
      if (quarterDayType === '10-12') {
        startTimestamp = `${startDate}T10:00:00+09:00`
        endTimestamp = `${startDate}T12:00:00+09:00`
      } else if (quarterDayType === '13-15') {
        startTimestamp = `${startDate}T13:00:00+09:00`
        endTimestamp = `${startDate}T15:00:00+09:00`
      } else if (quarterDayType === '15-17') {
        startTimestamp = `${startDate}T15:00:00+09:00`
        endTimestamp = `${startDate}T17:00:00+09:00`
      } else {
        // 17-19
        startTimestamp = `${startDate}T17:00:00+09:00`
        endTimestamp = `${startDate}T19:00:00+09:00`
      }
    } else {
      // 기본값 (연차와 동일)
      startTimestamp = `${startDate}T00:00:00+09:00`
      endTimestamp = `${endDate}T23:59:59+09:00`
    }

    // 연차 차감이 필요한 타입만 잔액 확인 (경조사, 예비군/민방위는 제외)
    const deductibleLeaveTypes = ['연차', '반차', '반반차']
    const shouldDeductLeave = deductibleLeaveTypes.includes(leaveTypeName)

    if (shouldDeductLeave) {
      // 연차 잔액 확인 (실시간 집계)
      // 모든 타입(연차, 반차, 반반차)의 승인된 요청을 합산 (경조사, 예비군/민방위 제외)
      const year = new Date(startDate).getFullYear()
      const balanceResult = await query(
        `WITH used_calc AS (
          SELECT
            lb.employee_id,
            lb.year,
            COALESCE(SUM(lr.total_days), 0) as total_used
          FROM leave_balances lb
          LEFT JOIN leave_requests lr ON lr.employee_id = lb.employee_id
            AND lr.status = 'approved'
            AND EXTRACT(YEAR FROM lr.start_date) = lb.year
            AND lr.leave_type_id IN (
              SELECT id FROM leave_types WHERE name IN ('연차', '반차', '반반차')
            )
          WHERE lb.employee_id = $1 AND lb.year = $2
          GROUP BY lb.employee_id, lb.year
        )
        SELECT
          lb.total_days - uc.total_used as remaining_days
        FROM leave_balances lb
        JOIN leave_types lt ON lb.leave_type_id = lt.id
        JOIN used_calc uc ON uc.employee_id = lb.employee_id
          AND uc.year = lb.year
        WHERE lb.employee_id = $1 AND lb.year = $2 AND lt.name = '연차'
        LIMIT 1`,
        [employeeId, year],
      )

      if (balanceResult.rows.length === 0) {
        return json({ error: `${year}년도 연차 정보가 없습니다.` }, { status: 400 })
      }

      const remainingDays = parseFloat(balanceResult.rows[0].remaining_days)

      // 연차의 경우 실제 근무일 수 사용, 반차/반반차는 그대로
      const daysToDeduct = leaveTypeName === '연차' ? actualWorkingDays : totalDays

      if (remainingDays < daysToDeduct) {
        return json(
          {
            error: `연차가 부족합니다. (잔여: ${remainingDays}일, 필요: ${daysToDeduct}일)`,
          },
          { status: 400 },
        )
      }
    }

    // 중복 신청 확인 (타임스탬프 기준)
    const overlapResult = await query(
      `SELECT id FROM leave_requests
       WHERE employee_id = $1
         AND status IN ('pending', 'approved')
         AND (
           (start_date <= $2::timestamptz AND end_date >= $2::timestamptz) OR
           (start_date <= $3::timestamptz AND end_date >= $3::timestamptz) OR
           (start_date >= $2::timestamptz AND end_date <= $3::timestamptz)
         )
       LIMIT 1`,
      [employeeId, startTimestamp, endTimestamp],
    )

    if (overlapResult.rows.length > 0) {
      return json({ error: '이미 해당 기간에 신청한 연차가 있습니다.' }, { status: 400 })
    }

    // 연차 신청 생성 (승인 없이 바로 approved, 타임스탬프 저장)
    // total_days: 연차 차감 타입은 실제 근무일 수, 비차감 타입(경조사/예비군)은 0
    const finalDaysToDeduct = shouldDeductLeave
      ? leaveTypeName === '연차'
        ? actualWorkingDays
        : totalDays
      : 0
    const insertResult = await query(
      `INSERT INTO leave_requests
       (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_at, created_at)
       VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5, $6, 'approved', now(), now())
       RETURNING id`,
      [employeeId, leaveTypeId, startTimestamp, endTimestamp, finalDaysToDeduct, reason],
    )

    const requestId = insertResult.rows[0].id

    // 연차 잔액은 실시간 집계로 처리하므로 별도 업데이트 불필요

    return json({
      success: true,
      requestId,
      message: '연차 신청이 완료되었습니다.',
    })
  } catch (error) {
    console.error('❌ Leave request creation error:', error)
    const message = error instanceof Error ? error.message : '연차 신청에 실패했습니다.'
    return json({ error: message }, { status: 500 })
  }
}
