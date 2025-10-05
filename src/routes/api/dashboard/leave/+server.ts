import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { LeaveCalculator } from '$lib/utils/leave-calculator'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 연차 현황 및 휴가 신청 내역 조회
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { url } = event

    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())

    // 직원 정보 조회 (입사일 확인)
    const employeeResult = await query(
      `
      SELECT id, first_name, last_name, hire_date, email
      FROM employees 
      WHERE id = $1
    `,
      [user.id],
    )

    if (employeeResult.rows.length === 0) {
      return json({ success: false, message: '직원 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const employee = employeeResult.rows[0]
    const hireDate = new Date(employee.hire_date)

    // 대한민국 연차부여 시스템에 따른 연차 계산
    const leaveCalculation = LeaveCalculator.calculateLeaveBalance(hireDate, 0, new Date())

    // 연차 잔여일수 조회
    const balanceResult = await query(
      `
      SELECT 
        used_annual_leave,
        used_sick_leave
      FROM leave_balances 
      WHERE employee_id = $1 AND year = $2
    `,
      [user.id, year],
    )

    let usedAnnualLeave = 0
    let usedSickLeave = 0

    if (balanceResult.rows.length > 0) {
      usedAnnualLeave = parseFloat(balanceResult.rows[0].used_annual_leave || 0)
      usedSickLeave = parseFloat(balanceResult.rows[0].used_sick_leave || 0)
    }

    // 연차 잔여일수 레코드가 없으면 생성
    if (balanceResult.rows.length === 0) {
      await query(
        `
        INSERT INTO leave_balances (
          employee_id, 
          year, 
          total_annual_leave, 
          used_annual_leave,
          remaining_annual_leave, 
          total_sick_leave, 
          used_sick_leave,
          remaining_sick_leave
        )
        VALUES ($1, $2, $3, $4, $5, 5, 0, 5)
      `,
        [
          user.id,
          year,
          leaveCalculation.totalAnnualLeave,
          usedAnnualLeave,
          leaveCalculation.totalAnnualLeave - usedAnnualLeave,
        ],
      )
    } else {
      // 기존 레코드 업데이트
      await query(
        `
        UPDATE leave_balances 
        SET 
          total_annual_leave = $3,
          remaining_annual_leave = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $1 AND year = $2
      `,
        [
          user.id,
          year,
          leaveCalculation.totalAnnualLeave,
          leaveCalculation.totalAnnualLeave - usedAnnualLeave,
        ],
      )
    }

    const balance = {
      total_annual_leave: leaveCalculation.totalAnnualLeave,
      used_annual_leave: usedAnnualLeave,
      remaining_annual_leave: leaveCalculation.totalAnnualLeave - usedAnnualLeave,
      total_sick_leave: 5,
      used_sick_leave: usedSickLeave,
      remaining_sick_leave: 5 - usedSickLeave,
    }

    // 휴가 신청 내역 조회
    const requestsResult = await query(
      `
      SELECT 
        lr.*,
        approver.first_name || ' ' || approver.last_name as approver_name
      FROM leave_requests lr
      LEFT JOIN employees approver ON lr.approved_by = approver.id
      WHERE lr.employee_id = $1
      ORDER BY lr.created_at DESC
      LIMIT 20
    `,
      [user.id],
    )

    // 이번 달 휴가 신청 조회
    const monthStart = new Date()
    monthStart.setDate(1)
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setDate(0)

    const monthlyResult = await query(
      `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN days ELSE 0 END), 0) as approved_days
      FROM leave_requests 
      WHERE employee_id = $1 
        AND start_date >= $2 
        AND start_date <= $3
    `,
      [user.id, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]],
    )

    const monthlyStats = monthlyResult.rows[0]

    return json({
      success: true,
      data: {
        balance: {
          annual: {
            total: balance.total_annual_leave,
            used: parseFloat(balance.used_annual_leave),
            remaining: parseFloat(balance.remaining_annual_leave),
          },
          sick: {
            total: balance.total_sick_leave,
            used: parseFloat(balance.used_sick_leave),
            remaining: parseFloat(balance.remaining_sick_leave),
          },
        },
        requests: requestsResult.rows,
        monthlyStats: {
          totalRequests: parseInt(monthlyStats.total_requests),
          pendingRequests: parseInt(monthlyStats.pending_requests),
          approvedRequests: parseInt(monthlyStats.approved_requests),
          approvedDays: parseFloat(monthlyStats.approved_days),
        },
      },
    })
  } catch (error) {
    logger.error('Error fetching leave data:', error)
    return json({ success: false, message: '연차 데이터 조회에 실패했습니다.' }, { status: 500 })
  }
}

// 휴가 신청
export const POST: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { leaveType, startDate, endDate, startTime, endTime, days, reason } =
      await event.request.json()

    // 필수 필드 검증
    if (!leaveType || !startDate || !endDate || !days || !reason) {
      return json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 날짜 유효성 검증
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      return json(
        { success: false, message: '시작일이 종료일보다 늦을 수 없습니다.' },
        { status: 400 },
      )
    }

    if (start < new Date()) {
      return json(
        { success: false, message: '과거 날짜로 휴가를 신청할 수 없습니다.' },
        { status: 400 },
      )
    }

    // 연차 잔여일수 확인
    if (leaveType === 'annual') {
      // 직원 정보 조회 (입사일 확인)
      const employeeResult = await query(
        `
        SELECT hire_date
        FROM employees 
        WHERE id = $1
      `,
        [user.id],
      )

      if (employeeResult.rows.length === 0) {
        return json({ success: false, message: '직원 정보를 찾을 수 없습니다.' }, { status: 404 })
      }

      const hireDate = new Date(employeeResult.rows[0].hire_date)

      // 사용한 연차 조회
      const usedLeaveResult = await query(
        `
        SELECT used_annual_leave 
        FROM leave_balances 
        WHERE employee_id = $1 AND year = $2
      `,
        [user.id, new Date().getFullYear()],
      )

      const usedLeave =
        usedLeaveResult.rows.length > 0
          ? parseFloat(usedLeaveResult.rows[0].used_annual_leave || 0)
          : 0

      // 연차 사용 가능 여부 확인
      const canUse = LeaveCalculator.canUseLeave(hireDate, usedLeave, days)

      if (!canUse) {
        const balance = LeaveCalculator.calculateLeaveBalance(hireDate, usedLeave)
        return json(
          {
            success: false,
            message: `연차 잔여일수가 부족합니다. (잔여: ${balance.remainingAnnualLeave}일, 신청: ${days}일)`,
          },
          { status: 400 },
        )
      }
    }

    // 휴가 신청 등록
    const result = await query(
      `
      INSERT INTO leave_requests (
        employee_id, 
        leave_type, 
        start_date, 
        end_date, 
        start_time, 
        end_time, 
        days, 
        reason, 
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *
    `,
      [user.id, leaveType, startDate, endDate, startTime, endTime, days, reason],
    )

    // 승인자에게 알림 생성 (관리자)
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
      SELECT 
        e.id,
        '휴가 신청 알림',
        $1 || '님이 ' || $2 || '부터 ' || $3 || '까지 ' || $4 || '일 휴가를 신청했습니다.',
        'approval_request',
        'leave',
        '/hr/leave-approval',
        $5::jsonb
      FROM employees e
      WHERE e.role IN ('ADMIN', 'MANAGER')
    `,
      [
        user.name || user.email,
        startDate,
        endDate,
        days,
        JSON.stringify({ requestId: result.rows[0].id, employeeId: user.id }),
      ],
    )

    return json({
      success: true,
      message: '휴가 신청이 완료되었습니다.',
      data: result.rows[0],
    })
  } catch (error) {
    logger.error('Error creating leave request:', error)
    return json({ success: false, message: '휴가 신청에 실패했습니다.' }, { status: 500 })
  }
}
