import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 오늘의 출퇴근 기록 조회
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { url } = event

    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]

    // user_id로 employee_id 조회
    const employeeResult = await query(`SELECT id FROM employees WHERE user_id = $1`, [user.id])

    if (employeeResult.rows.length === 0) {
      return json({ success: false, message: '직원 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const employeeId = employeeResult.rows[0].id

    // 오늘의 출퇴근 기록 조회
    const attendanceResult = await query(
      `
      SELECT
        id,
        date,
        check_in_time,
        check_out_time,
        break_start_time,
        break_end_time,
        total_work_hours,
        overtime_hours,
        status,
        notes
      FROM attendance
      WHERE employee_id = $1 AND date = $2
    `,
      [employeeId, date],
    )

    const attendance = attendanceResult.rows[0] || null

    // 이번 주 출퇴근 기록 조회
    const weekStart = new Date(date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const weekResult = await query(
      `
      SELECT
        date,
        check_in_time,
        check_out_time,
        total_work_hours,
        overtime_hours,
        status
      FROM attendance
      WHERE employee_id = $1
        AND date >= $2
        AND date <= $3
      ORDER BY date DESC
    `,
      [employeeId, weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]],
    )

    // 이번 달 통계 조회
    const monthStart = new Date(date)
    monthStart.setDate(1)
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setDate(0)

    const statsResult = await query(
      `
      SELECT
        COUNT(*) as total_days,
        COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END) as work_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN status = 'early_leave' THEN 1 END) as early_leave_days,
        COALESCE(SUM(total_work_hours), 0) as total_work_hours,
        COALESCE(SUM(overtime_hours), 0) as total_overtime_hours
      FROM attendance
      WHERE employee_id = $1
        AND date >= $2
        AND date <= $3
    `,
      [employeeId, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]],
    )

    const stats = statsResult.rows[0]

    // 월별 출퇴근 기록 조회 (캘린더용)
    const monthRecordsResult = await query(
      `
      SELECT
        TO_CHAR(date, 'YYYY-MM-DD') as date_str,
        TO_CHAR(check_in_time, 'YYYY-MM-DD HH24:MI:SS') as check_in_time,
        TO_CHAR(check_out_time, 'YYYY-MM-DD HH24:MI:SS') as check_out_time,
        TO_CHAR(total_work_hours, 'FM999999.00') as total_work_hours,
        status
      FROM attendance
      WHERE employee_id = $1
        AND date >= $2
        AND date <= $3
      ORDER BY date ASC
    `,
      [employeeId, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]],
    )

    // Rename date_str to date for consistency
    const monthRecords = monthRecordsResult.rows.map((row) => ({
      date: row.date_str,
      check_in_time: row.check_in_time,
      check_out_time: row.check_out_time,
      total_work_hours: row.total_work_hours,
      status: row.status,
    }))

    return json({
      success: true,
      data: {
        today: attendance,
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
    })
  } catch (error) {
    logger.error('Error fetching attendance data:', error)
    return json({ success: false, message: '출퇴근 데이터 조회에 실패했습니다.' }, { status: 500 })
  }
}

// 출근/퇴근 기록
export const POST: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { action, notes } = await event.request.json()

    const today = new Date().toISOString().split('T')[0]
    const now = new Date()

    // 클라이언트 IP 주소 가져오기
    const clientIp = event.getClientAddress()

    // user_id로 employee_id 및 company_id 조회
    const employeeResult = await query(`SELECT id, company_id FROM employees WHERE user_id = $1`, [
      user.id,
    ])

    if (employeeResult.rows.length === 0) {
      return json({ success: false, message: '직원 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const employeeId = employeeResult.rows[0].id
    const companyId = employeeResult.rows[0].company_id

    const settingsResult = await query(
      `
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
      [companyId],
    )

    let settings: {
      work_start_time: string
      work_end_time: string
      late_threshold_minutes: number
      early_leave_threshold_minutes: number
      allowed_ips: string[]
      require_ip_check: boolean
    } | null = null
    if (settingsResult.rows.length > 0) {
      const settingsRow = settingsResult.rows[0]
      settings = settingsRow

      // IP 주소 검증
      if (
        settingsRow.require_ip_check &&
        settingsRow.allowed_ips &&
        settingsRow.allowed_ips.length > 0
      ) {
        if (!settingsRow.allowed_ips.includes(clientIp)) {
          return json(
            {
              success: false,
              message: `허용되지 않은 IP 주소입니다. (현재 IP: ${clientIp})`,
            },
            { status: 403 },
          )
        }
      }
    }

    if (action === 'check_in') {
      // 출근 시간 검증 및 상태 결정
      let status = 'present'
      if (settings) {
        const checkInTime = new Date(now)
        const workStartTime = new Date(today + ' ' + settings.work_start_time)
        const diffMinutes = (checkInTime.getTime() - workStartTime.getTime()) / (1000 * 60)

        if (diffMinutes > settings.late_threshold_minutes) {
          status = 'late'
        }
      }

      // 출근 기록
      const result = await query(
        `
        INSERT INTO attendance (employee_id, date, check_in_time, check_in_ip, notes, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (employee_id, date)
        DO UPDATE SET
          check_in_time = $3,
          check_in_ip = $4,
          notes = $5,
          status = $6,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `,
        [employeeId, today, now, clientIp, notes, status],
      )

      const message = status === 'late' ? '출근이 기록되었습니다. (지각)' : '출근이 기록되었습니다.'

      return json({
        success: true,
        message,
        data: result.rows[0],
      })
    } else if (action === 'check_out') {
      // 퇴근 시간 검증 및 상태 업데이트
      let statusUpdate = ''
      if (settings) {
        const checkOutTime = new Date(now)
        const workEndTime = new Date(today + ' ' + settings.work_end_time)
        const diffMinutes = (workEndTime.getTime() - checkOutTime.getTime()) / (1000 * 60)

        if (diffMinutes > settings.early_leave_threshold_minutes) {
          statusUpdate = `, status = 'early_leave'`
        }
      }

      // 퇴근 기록
      const result = await query(
        `
        UPDATE attendance
        SET
          check_out_time = $3,
          check_out_ip = $4,
          notes = COALESCE($5, notes)
          ${statusUpdate},
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $1 AND date = $2
        RETURNING *
      `,
        [employeeId, today, now, clientIp, notes],
      )

      if (result.rows.length === 0) {
        return json(
          { success: false, message: '출근 기록이 없습니다. 먼저 출근을 기록해주세요.' },
          { status: 400 },
        )
      }

      const message =
        statusUpdate !== '' ? '퇴근이 기록되었습니다. (조기퇴근)' : '퇴근이 기록되었습니다.'

      return json({
        success: true,
        message,
        data: result.rows[0],
      })
    } else if (action === 'break_start') {
      // 휴게 시작
      const result = await query(
        `
        UPDATE attendance
        SET
          break_start_time = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $1 AND date = $2
        RETURNING *
      `,
        [employeeId, today, now],
      )

      if (result.rows.length === 0) {
        return json({ success: false, message: '출근 기록이 없습니다.' }, { status: 400 })
      }

      return json({
        success: true,
        message: '휴게가 시작되었습니다.',
        data: result.rows[0],
      })
    } else if (action === 'break_end') {
      // 휴게 종료
      const result = await query(
        `
        UPDATE attendance
        SET
          break_end_time = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $1 AND date = $2
        RETURNING *
      `,
        [employeeId, today, now],
      )

      if (result.rows.length === 0) {
        return json({ success: false, message: '출근 기록이 없습니다.' }, { status: 400 })
      }

      return json({
        success: true,
        message: '휴게가 종료되었습니다.',
        data: result.rows[0],
      })
    } else {
      return json({ success: false, message: '잘못된 액션입니다.' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Error recording attendance:', error)
    return json({ success: false, message: '출퇴근 기록에 실패했습니다.' }, { status: 500 })
  }
}
