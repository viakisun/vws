import { requireRole } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 연차 통계 조회 (관리자용)
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireRole(event, ['ADMIN', 'MANAGER'])
    const { url } = event

    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())
    const department = url.searchParams.get('department')

    // 부서별 연차 사용 현황
    let departmentFilter = ''
    let params: (number | string)[] = [year]

    if (department) {
      departmentFilter = 'AND e.department = $2'
      params.push(department)
    }

    const departmentStatsResult = await query(
      `
      SELECT 
        e.department,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(lr.id) as total_requests,
        COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved_requests,
        COALESCE(SUM(CASE WHEN lr.status = 'approved' AND lr.leave_type = 'annual' THEN lr.days ELSE 0 END), 0) as used_annual_days,
        COALESCE(SUM(CASE WHEN lr.status = 'approved' AND lr.leave_type = 'sick' THEN lr.days ELSE 0 END), 0) as used_sick_days,
        COALESCE(AVG(CASE WHEN lr.status = 'approved' AND lr.leave_type = 'annual' THEN lr.days END), 0) as avg_annual_days_per_request
      FROM employees e
      LEFT JOIN leave_requests lr ON e.id = lr.employee_id 
        AND EXTRACT(YEAR FROM lr.start_date) = $1
      WHERE e.is_active = true ${departmentFilter}
      GROUP BY e.department
      ORDER BY e.department
    `,
      params,
    )

    // 월별 연차 사용 현황
    const monthlyStatsResult = await query(
      `
      SELECT 
        EXTRACT(MONTH FROM lr.start_date) as month,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved_requests,
        COALESCE(SUM(CASE WHEN lr.status = 'approved' AND lr.leave_type = 'annual' THEN lr.days ELSE 0 END), 0) as annual_days,
        COALESCE(SUM(CASE WHEN lr.status = 'approved' AND lr.leave_type = 'sick' THEN lr.days ELSE 0 END), 0) as sick_days
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      WHERE EXTRACT(YEAR FROM lr.start_date) = $1 ${departmentFilter}
      GROUP BY EXTRACT(MONTH FROM lr.start_date)
      ORDER BY month
    `,
      params,
    )

    // 연차 타입별 사용 현황
    const typeStatsResult = await query(
      `
      SELECT 
        lr.leave_type,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved_requests,
        COALESCE(SUM(CASE WHEN lr.status = 'approved' THEN lr.days ELSE 0 END), 0) as total_days,
        COALESCE(AVG(CASE WHEN lr.status = 'approved' THEN lr.days END), 0) as avg_days
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      WHERE EXTRACT(YEAR FROM lr.start_date) = $1 ${departmentFilter}
      GROUP BY lr.leave_type
      ORDER BY lr.leave_type
    `,
      params,
    )

    // 승인률 통계
    const approvalRateResult = await query(
      `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        ROUND(
          COUNT(CASE WHEN status = 'approved' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(CASE WHEN status IN ('approved', 'rejected') THEN 1 END), 0), 
          2
        ) as approval_rate
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      WHERE EXTRACT(YEAR FROM lr.start_date) = $1 ${departmentFilter}
    `,
      params,
    )

    // 연차 잔여일수 현황
    const balanceStatsResult = await query(
      `
      SELECT 
        e.department,
        COUNT(*) as total_employees,
        COALESCE(SUM(lb.total_annual_leave), 0) as total_annual_leave,
        COALESCE(SUM(lb.used_annual_leave), 0) as used_annual_leave,
        COALESCE(SUM(lb.remaining_annual_leave), 0) as remaining_annual_leave,
        COALESCE(SUM(lb.total_sick_leave), 0) as total_sick_leave,
        COALESCE(SUM(lb.used_sick_leave), 0) as used_sick_leave,
        COALESCE(SUM(lb.remaining_sick_leave), 0) as remaining_sick_leave
      FROM employees e
      LEFT JOIN leave_balances lb ON e.id = lb.employee_id AND lb.year = $1
      WHERE e.is_active = true ${departmentFilter}
      GROUP BY e.department
      ORDER BY e.department
    `,
      params,
    )

    // 최근 연차 신청 현황 (최근 30일)
    const recentRequestsResult = await query(
      `
      SELECT 
        lr.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.department,
        approver.first_name || ' ' || approver.last_name as approver_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN employees approver ON lr.approved_by = approver.id
      WHERE lr.created_at >= CURRENT_DATE - INTERVAL '30 days' ${departmentFilter}
      ORDER BY lr.created_at DESC
      LIMIT 20
    `,
      params,
    )

    return json({
      success: true,
      data: {
        departmentStats: departmentStatsResult.rows,
        monthlyStats: monthlyStatsResult.rows,
        typeStats: typeStatsResult.rows,
        approvalRate: approvalRateResult.rows[0],
        balanceStats: balanceStatsResult.rows,
        recentRequests: recentRequestsResult.rows,
      },
    })
  } catch (error) {
    logger.error('Error fetching leave statistics:', error)
    return json({ success: false, message: '연차 통계 조회에 실패했습니다.' }, { status: 500 })
  }
}
