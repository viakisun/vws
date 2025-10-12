import { verifyToken } from '$lib/auth/middleware'
import type { CRMApiResponse, CRMCustomerStats, CRMStats } from '$lib/crm/types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// CRM 대시보드 통계
export const GET: RequestHandler = async ({ url, cookies }) => {
  // 인증 확인
  const token = cookies.get('token')
  if (!token) {
    return json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const user = await verifyToken(token)
  if (!user) {
    return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
  }

  try {
    const period = url.searchParams.get('period') || 'month' // month, quarter, year
    const type = url.searchParams.get('type') || 'overview' // overview, customers

    if (type === 'customers') {
      // 고객별 통계
      const result = await query(
        `
        SELECT 
          c.id as customer_id,
          c.name as customer_name,
          COALESCE(SUM(CASE WHEN t.type = 'sales' THEN t.amount ELSE 0 END), 0) as total_sales,
          COALESCE(SUM(CASE WHEN t.type = 'purchase' THEN t.amount ELSE 0 END), 0) as total_purchases,
          COALESCE(SUM(CASE WHEN t.type = 'sales' AND t.payment_status = 'pending' THEN t.amount ELSE 0 END), 0) as pending_amount,
          COALESCE(SUM(CASE WHEN t.type = 'sales' AND t.payment_status = 'overdue' THEN t.amount ELSE 0 END), 0) as overdue_amount,
          COUNT(t.id) as transaction_count
        FROM crm_customers c
        LEFT JOIN crm_transactions t ON c.id = t.customer_id
        GROUP BY c.id, c.name
        ORDER BY total_sales DESC
        `,
      )

      const response: CRMApiResponse<CRMCustomerStats[]> = {
        success: true,
        data: result.rows as CRMCustomerStats[],
      }

      return json(response)
    }

    // 전체 통계
    const currentDate = new Date()
    let dateFilter = ''
    let dateParams: any[] = []

    switch (period) {
      case 'month': {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        dateFilter = 'AND transaction_date >= $1'
        dateParams = [firstDayOfMonth.toISOString().split('T')[0]]
        break
      }
      case 'quarter': {
        const quarterStart = new Date(
          currentDate.getFullYear(),
          Math.floor(currentDate.getMonth() / 3) * 3,
          1,
        )
        dateFilter = 'AND transaction_date >= $1'
        dateParams = [quarterStart.toISOString().split('T')[0]]
        break
      }
      case 'year': {
        const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1)
        dateFilter = 'AND transaction_date >= $1'
        dateParams = [firstDayOfYear.toISOString().split('T')[0]]
        break
      }
    }

    // 기본 통계 조회
    const statsResult = await query(
      `
      SELECT 
        (SELECT COUNT(*) FROM crm_customers WHERE status = 'active') as total_customers,
        (SELECT COUNT(*) FROM crm_opportunities WHERE status = 'active') as active_opportunities,
        (SELECT COALESCE(SUM(value), 0) FROM crm_opportunities WHERE status = 'active') as total_sales_value,
        (SELECT COALESCE(SUM(amount), 0) FROM crm_transactions WHERE type = 'sales' AND payment_status = 'paid' ${dateFilter}) as monthly_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM crm_transactions WHERE type = 'sales' AND payment_status = 'overdue') as payment_overdue,
        (SELECT 
          CASE 
            WHEN COUNT(*) > 0 THEN 
              ROUND((COUNT(CASE WHEN stage = 'closed-won' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0 
          END
         FROM crm_opportunities) as conversion_rate
      `,
      dateParams,
    )

    const stats = statsResult.rows[0]

    const crmStats: CRMStats = {
      totalCustomers: parseInt(stats.total_customers),
      activeOpportunities: parseInt(stats.active_opportunities),
      totalSalesValue: parseFloat(stats.total_sales_value),
      monthlyRevenue: parseFloat(stats.monthly_revenue),
      paymentOverdue: parseFloat(stats.payment_overdue),
      conversionRate: parseFloat(stats.conversion_rate),
    }

    const response: CRMApiResponse<CRMStats> = {
      success: true,
      data: crmStats,
    }

    return json(response)
  } catch (error) {
    logger.error('CRM 통계 조회 실패:', error)
    const response: CRMApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'CRM 통계를 조회할 수 없습니다.',
    }
    return json(response, { status: 500 })
  }
}
