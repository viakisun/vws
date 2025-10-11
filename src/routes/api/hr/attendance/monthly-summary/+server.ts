import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * GET /api/hr/attendance/monthly-summary
 * 월간 일별 출퇴근 집계 (관리자용)
 */
export const GET: RequestHandler = async (event) => {
  try {
    await requireAuth(event)

    const { searchParams } = event.url
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
    const departmentId = searchParams.get('department_id')

    // 해당 월의 첫날과 마지막 날
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0)
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

    // 활성 직원 수 조회 (한 번만)
    const totalEmployeesQuery = departmentId
      ? `SELECT COUNT(*) as total FROM employees WHERE status = 'active' AND department = $1`
      : `SELECT COUNT(*) as total FROM employees WHERE status = 'active'`

    const totalEmployeesResult = await query(
      totalEmployeesQuery,
      departmentId ? [departmentId] : [],
    )
    const totalEmployees = parseInt(totalEmployeesResult.rows[0].total)

    // 부서 필터 조건
    const departmentFilter = departmentId ? 'AND e.department = $4' : ''

    // 일별 출퇴근 집계
    const result = await query(
      `
      WITH date_series AS (
        SELECT generate_series(
          $1::date,
          $2::date,
          '1 day'::interval
        )::date AS date
      )
      SELECT
        TO_CHAR(ds.date, 'YYYY-MM-DD') as date,
        $3::integer as total_employees,
        COALESCE(COUNT(DISTINCT CASE
          WHEN a.check_in_time IS NOT NULL THEN a.employee_id
        END), 0)::integer as present,
        COALESCE(COUNT(DISTINCT CASE
          WHEN a.status = 'late' THEN a.employee_id
        END), 0)::integer as late,
        COALESCE(COUNT(DISTINCT CASE
          WHEN a.status = 'early_leave' THEN a.employee_id
        END), 0)::integer as early_leave,
        COALESCE(COUNT(DISTINCT CASE
          WHEN a.check_in_time IS NULL AND lr.id IS NULL THEN a.employee_id
        END), 0)::integer as absent,
        COALESCE(COUNT(DISTINCT lr.employee_id), 0)::integer as on_leave
      FROM date_series ds
      LEFT JOIN attendance a ON DATE(a.check_in_time) = ds.date
      LEFT JOIN employees e ON a.employee_id = e.id AND e.status = 'active' ${departmentFilter}
      LEFT JOIN leave_requests lr ON lr.employee_id = e.id
        AND lr.status = 'approved'
        AND ds.date BETWEEN DATE(lr.start_date) AND DATE(lr.end_date)
      GROUP BY ds.date
      ORDER BY ds.date
      `,
      departmentId
        ? [startDate, endDateStr, totalEmployees, departmentId]
        : [startDate, endDateStr, totalEmployees],
    )

    return json({
      year,
      month,
      daily_summary: result.rows,
    })
  } catch (error) {
    console.error('출퇴근 집계 API 에러:', error)
    return json({ error: '출퇴근 집계 조회에 실패했습니다.' }, { status: 500 })
  }
}
