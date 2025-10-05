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
      [user.id, date],
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
      [user.id, weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]],
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
      [user.id, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]],
    )

    const stats = statsResult.rows[0]

    return json({
      success: true,
      data: {
        today: attendance,
        week: weekResult.rows,
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

    if (action === 'check_in') {
      // 출근 기록
      const result = await query(
        `
        INSERT INTO attendance (employee_id, date, check_in_time, notes, status)
        VALUES ($1, $2, $3, $4, 'present')
        ON CONFLICT (employee_id, date) 
        DO UPDATE SET 
          check_in_time = $3,
          notes = $4,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `,
        [user.id, today, now, notes],
      )

      return json({
        success: true,
        message: '출근이 기록되었습니다.',
        data: result.rows[0],
      })
    } else if (action === 'check_out') {
      // 퇴근 기록
      const result = await query(
        `
        UPDATE attendance 
        SET 
          check_out_time = $3,
          notes = COALESCE($4, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $1 AND date = $2
        RETURNING *
      `,
        [user.id, today, now, notes],
      )

      if (result.rows.length === 0) {
        return json(
          { success: false, message: '출근 기록이 없습니다. 먼저 출근을 기록해주세요.' },
          { status: 400 },
        )
      }

      return json({
        success: true,
        message: '퇴근이 기록되었습니다.',
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
        [user.id, today, now],
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
        [user.id, today, now],
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
