import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { requireAuth } from '$lib/auth/middleware'

/**
 * GET /api/hr/leave/monthly-calendar
 * 월간 연차 캘린더 (관리자용)
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

    // 부서 필터 조건 (사용안함 - department는 varchar라서 직접 필터링 불가)
    const departmentFilter = ''
    const params = [startDate, endDateStr]

    // 월간 연차 데이터 조회
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
        lr.id,
        e.id as employee_id,
        e.first_name,
        e.last_name,
        e.department,
        lt.name as leave_type_name,
        TO_CHAR(lr.start_date AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') as start_date,
        TO_CHAR(lr.end_date AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') as end_date,
        lr.total_days,
        lr.reason
      FROM date_series ds
      LEFT JOIN leave_requests lr ON ds.date BETWEEN DATE(lr.start_date AT TIME ZONE 'Asia/Seoul') AND DATE(lr.end_date AT TIME ZONE 'Asia/Seoul')
        AND lr.status = 'approved'
      LEFT JOIN employees e ON lr.employee_id = e.id
        AND e.status = 'active'
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE 1=1
      ORDER BY ds.date, e.department, e.last_name, e.first_name
      `,
      params,
    )

    // 날짜별로 그룹화
    const dailyLeavesMap = new Map<string, any[]>()

    result.rows.forEach((row: any) => {
      if (!row.id) return // 연차가 없는 날짜는 skip

      const dateStr = row.date // 이미 'YYYY-MM-DD' 형식
      if (!dailyLeavesMap.has(dateStr)) {
        dailyLeavesMap.set(dateStr, [])
      }

      dailyLeavesMap.get(dateStr)!.push({
        id: row.id,
        employee_id: row.employee_id,
        employee_name: `${row.last_name}${row.first_name}`,
        department: row.department,
        type: row.leave_type_name,
        start_date: row.start_date,
        end_date: row.end_date,
        total_days: parseFloat(row.total_days),
        reason: row.reason,
      })
    })

    // 배열로 변환
    const daily_leaves = Array.from(dailyLeavesMap.entries()).map(([date, leaves]) => ({
      date,
      total: leaves.length,
      leaves,
    }))

    // 부서별 통계 계산
    const deptStatsResult = await query(
      `
      SELECT
        e.department as department_name,
        COUNT(DISTINCT e.id) as total_employees,
        COALESCE(SUM(lr.total_days), 0) as total_used_days,
        COALESCE(AVG(lb.total_days), 0) as avg_total_days,
        COALESCE(AVG(lb.total_days - (
          SELECT COALESCE(SUM(lr2.total_days), 0)
          FROM leave_requests lr2
          WHERE lr2.employee_id = e.id
            AND lr2.status = 'approved'
            AND EXTRACT(YEAR FROM lr2.start_date) = $1
            AND lr2.leave_type_id IN (
              SELECT id FROM leave_types WHERE name IN ('연차', '반차', '반반차')
            )
        )), 0) as avg_remaining_days
      FROM employees e
      LEFT JOIN leave_balances lb ON lb.employee_id = e.id AND lb.year = $1
      LEFT JOIN leave_requests lr ON lr.employee_id = e.id
        AND lr.status = 'approved'
        AND EXTRACT(YEAR FROM lr.start_date) = $1
        AND EXTRACT(MONTH FROM lr.start_date) = $2
        AND lr.leave_type_id IN (
          SELECT id FROM leave_types WHERE name IN ('연차', '반차', '반차')
        )
      WHERE e.status = 'active'
      GROUP BY e.department
      ORDER BY e.department
      `,
      [year, month],
    )

    // 연차 촉진 대상자 (9월 1일 이후, 입사 1년 이상, 소진율 50% 이하)
    const today = new Date()
    const currentMonth = today.getMonth() + 1 // 1-12

    let promotionResult = { rows: [] }

    // 9월 1일 이후에만 조회
    if (currentMonth >= 9) {
      promotionResult = await query(
        `
        WITH employee_leave_usage AS (
          SELECT
            e.id,
            e.first_name,
            e.last_name,
            e.department,
            e.hire_date,
            lb.total_days,
            COALESCE((
              SELECT SUM(lr.total_days)
              FROM leave_requests lr
              WHERE lr.employee_id = e.id
                AND lr.status = 'approved'
                AND EXTRACT(YEAR FROM lr.start_date) = $1
                AND lr.leave_type_id IN (
                  SELECT id FROM leave_types WHERE name IN ('연차', '반차', '반반차')
                )
            ), 0) as used_days
          FROM employees e
          JOIN leave_balances lb ON lb.employee_id = e.id AND lb.year = $1
          WHERE e.status = 'active'
            AND e.hire_date <= CURRENT_DATE - INTERVAL '1 year'
        )
        SELECT *
        FROM employee_leave_usage
        WHERE used_days / NULLIF(total_days, 0) <= 0.5
        ORDER BY (total_days - used_days) DESC
        LIMIT 10
        `,
        [year],
      )
    }

    const promotion_targets = promotionResult.rows.map((row: any) => ({
      employee_id: row.id,
      employee_name: `${row.last_name}${row.first_name}`,
      department: row.department,
      total_days: parseFloat(row.total_days),
      used_days: parseFloat(row.used_days),
      remaining_days: parseFloat(row.total_days) - parseFloat(row.used_days),
      usage_rate: (parseFloat(row.used_days) / parseFloat(row.total_days)) * 100,
    }))

    return json({
      year,
      month,
      daily_leaves,
      department_stats: deptStatsResult.rows,
      promotion_targets,
      summary: {
        total_days_used: daily_leaves.reduce(
          (sum, day) => sum + day.leaves.reduce((daySum, leave) => daySum + leave.total_days, 0),
          0,
        ),
        today_on_leave: dailyLeavesMap.get(new Date().toISOString().split('T')[0])?.length || 0,
      },
    })
  } catch (error) {
    console.error('연차 캘린더 API 에러:', error)
    return json({ error: '연차 캘린더 조회에 실패했습니다.' }, { status: 500 })
  }
}
