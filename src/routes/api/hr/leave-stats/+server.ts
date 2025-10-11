import { requireRole } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// ============================================================================
// Type Definitions
// ============================================================================

interface DepartmentStats {
  department: string
  total_employees: number
  total_requests: number
  approved_requests: number
  used_annual_days: number
  used_sick_days: number
  avg_annual_days_per_request: number
}

interface MonthlyStats {
  month: number
  total_requests: number
  approved_requests: number
  annual_days: number
  sick_days: number
}

interface TypeStats {
  leave_type: string
  total_requests: number
  approved_requests: number
  total_days: number
  avg_days: number
}

interface ApprovalRate {
  total_requests: number
  approved_requests: number
  rejected_requests: number
  pending_requests: number
  approval_rate: number | null
}

interface BalanceStats {
  department: string
  total_employees: number
  total_annual_leave: number
  used_annual_leave: number
  remaining_annual_leave: number
  total_sick_leave: number
  used_sick_leave: number
  remaining_sick_leave: number
}

interface RecentRequest {
  id: number
  employee_id: number
  employee_name: string
  department: string
  leave_type: string
  start_date: string
  end_date: string
  days: number
  status: string
  reason: string
  approved_by: number | null
  approver_name: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Constants
// ============================================================================

const RECENT_DAYS_LIMIT = 30
const RECENT_REQUESTS_LIMIT = 20

// ============================================================================
// Query Functions
// ============================================================================

/**
 * 부서별 연차 사용 현황 조회
 */
async function fetchDepartmentStats(year: number, department?: string): Promise<DepartmentStats[]> {
  const departmentFilter = department ? 'AND e.department = $2' : ''
  const params: (number | string)[] = department ? [year, department] : [year]

  const result = await query(
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

  return result.rows as DepartmentStats[]
}

/**
 * 월별 연차 사용 현황 조회
 */
async function fetchMonthlyStats(year: number, department?: string): Promise<MonthlyStats[]> {
  const departmentFilter = department ? 'AND e.department = $2' : ''
  const params: (number | string)[] = department ? [year, department] : [year]

  const result = await query(
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

  return result.rows as MonthlyStats[]
}

/**
 * 연차 타입별 사용 현황 조회
 */
async function fetchTypeStats(year: number, department?: string): Promise<TypeStats[]> {
  const departmentFilter = department ? 'AND e.department = $2' : ''
  const params: (number | string)[] = department ? [year, department] : [year]

  const result = await query(
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

  return result.rows as TypeStats[]
}

/**
 * 승인률 통계 조회
 */
async function fetchApprovalRate(year: number, department?: string): Promise<ApprovalRate> {
  const departmentFilter = department ? 'AND e.department = $2' : ''
  const params: (number | string)[] = department ? [year, department] : [year]

  const result = await query(
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

  return result.rows[0] as ApprovalRate
}

/**
 * 연차 잔여일수 현황 조회
 */
async function fetchBalanceStats(year: number, department?: string): Promise<BalanceStats[]> {
  const departmentFilter = department ? 'AND e.department = $2' : ''
  const params: (number | string)[] = department ? [year, department] : [year]

  const result = await query(
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

  return result.rows as BalanceStats[]
}

/**
 * 최근 연차 신청 현황 조회
 */
async function fetchRecentRequests(department?: string): Promise<RecentRequest[]> {
  const departmentFilter = department ? 'AND e.department = $1' : ''
  const params: string[] = department ? [department] : []

  const result = await query(
    `
      SELECT 
        lr.*,
        CASE
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$' THEN
						e.last_name || e.first_name
					ELSE
						e.first_name || ' ' || e.last_name
				END as employee_name,
        e.department,
        CASE
					WHEN approver.first_name ~ '^[가-힣]+$' AND approver.last_name ~ '^[가-힣]+$' THEN
						approver.last_name || approver.first_name
					ELSE
						approver.first_name || ' ' || approver.last_name
				END as approver_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN employees approver ON lr.approved_by = approver.id
      WHERE lr.created_at >= CURRENT_DATE - INTERVAL '${RECENT_DAYS_LIMIT} days' ${departmentFilter}
      ORDER BY lr.created_at DESC
      LIMIT ${RECENT_REQUESTS_LIMIT}
    `,
    params,
  )

  return result.rows as RecentRequest[]
}

// ============================================================================
// Request Handler
// ============================================================================

/**
 * 연차 통계 조회 (관리자용)
 */
export const GET: RequestHandler = async (event) => {
  try {
    // 권한 확인
    await requireRole(event, ['ADMIN', 'MANAGER'])

    // 쿼리 파라미터 추출 및 검증
    const { url } = event
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())
    const department = url.searchParams.get('department') || undefined

    // 년도 유효성 검증
    if (isNaN(year) || year < 2000 || year > 2100) {
      return json({ success: false, message: '유효하지 않은 연도입니다.' }, { status: 400 })
    }

    // 모든 통계 데이터를 병렬로 조회
    const [departmentStats, monthlyStats, typeStats, approvalRate, balanceStats, recentRequests] =
      await Promise.all([
        fetchDepartmentStats(year, department),
        fetchMonthlyStats(year, department),
        fetchTypeStats(year, department),
        fetchApprovalRate(year, department),
        fetchBalanceStats(year, department),
        fetchRecentRequests(department),
      ])

    return json({
      success: true,
      data: {
        departmentStats,
        monthlyStats,
        typeStats,
        approvalRate,
        balanceStats,
        recentRequests,
      },
    })
  } catch (error) {
    logger.error('Error fetching leave statistics:', error)

    // 권한 오류인 경우
    if (error instanceof Error && error.message.includes('권한')) {
      return json({ success: false, message: error.message }, { status: 403 })
    }

    return json({ success: false, message: '연차 통계 조회에 실패했습니다.' }, { status: 500 })
  }
}
