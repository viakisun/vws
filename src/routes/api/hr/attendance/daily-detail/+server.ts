import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { requireAuth } from '$lib/auth/middleware'

/**
 * GET /api/hr/attendance/daily-detail
 * 특정일 직원별 출퇴근 상세 (관리자용)
 */
export const GET: RequestHandler = async (event) => {
  try {
    await requireAuth(event)

    const { searchParams } = event.url
    const date = searchParams.get('date')
    const departmentId = searchParams.get('department_id')

    if (!date) {
      return json({ error: '날짜가 필요합니다.' }, { status: 400 })
    }

    // 부서 필터 조건
    const departmentFilter = departmentId ? 'AND e.department = $2' : ''
    const params = departmentId ? [date, departmentId] : [date]

    // 해당일 전체 직원 출퇴근 상세
    const result = await query(
      `
      SELECT
        e.id,
        e.first_name,
        e.last_name,
        e.department as department_name,
        TO_CHAR(a.check_in_time, 'HH24:MI') as check_in_time,
        TO_CHAR(a.check_out_time, 'HH24:MI') as check_out_time,
        a.status,
        a.total_work_hours,
        lr.id as leave_request_id,
        lt.name as leave_type_name,
        lr.reason as leave_reason
      FROM employees e
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $1
      LEFT JOIN leave_requests lr ON lr.employee_id = e.id
        AND lr.status = 'approved'
        AND $1::date BETWEEN DATE(lr.start_date) AND DATE(lr.end_date)
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE e.status = 'active'
        ${departmentFilter}
      ORDER BY a.check_in_time DESC NULLS LAST, e.department, e.last_name, e.first_name
      `,
      params,
    )

    // 상태 결정
    const employees = result.rows.map((row) => {
      let status = 'absent'
      let statusText = '미출근'

      if (row.leave_request_id) {
        status = 'on_leave'
        statusText = row.leave_type_name || '연차'
      } else if (row.check_in_time) {
        if (row.status === 'late') {
          status = 'late'
          statusText = '지각'
        } else if (row.status === 'early_leave') {
          status = 'early_leave'
          statusText = '조퇴'
        } else {
          status = 'present'
          statusText = '정상'
        }
      }

      return {
        id: row.id,
        name: `${row.last_name}${row.first_name}`,
        department: row.department_name,
        check_in: row.check_in_time || null,
        check_out: row.check_out_time || null,
        work_hours: row.total_work_hours || null,
        status,
        status_text: statusText,
        leave_reason: row.leave_reason || null,
      }
    })

    return json({
      date,
      employees,
    })
  } catch (error) {
    return json({ error: '출퇴근 상세 조회에 실패했습니다.' }, { status: 500 })
  }
}
