import { query } from '$lib/database/connection'
import type { CRMStats } from '$lib/types/crm'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  try {
    // 1. 고객 통계
    const customerStatsResult = await query<{
      total_customers: string
      active_customers: string
      inactive_customers: string
      prospect_customers: string
    }>(
      `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_customers,
        COUNT(CASE WHEN status = 'prospect' THEN 1 END) as prospect_customers
      FROM crm_customers
    `,
    )

    // 2. 이번 달 신규 고객
    const newCustomersResult = await query<{
      this_month: string
      last_month: string
    }>(
      `
      SELECT 
        COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as this_month,
        COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' 
                   AND created_at < date_trunc('month', CURRENT_DATE) THEN 1 END) as last_month
      FROM crm_customers
    `,
    )

    // 3. 영업 기회 통계
    const opportunityStatsResult = await query<{
      open_opportunities: string
      total_amount: string
    }>(
      `
      SELECT 
        COUNT(*) as open_opportunities,
        COALESCE(SUM(amount), 0) as total_amount
      FROM crm_opportunities
      WHERE status = 'open'
    `,
    )

    // 4. 계약 통계
    const contractStatsResult = await query<{
      active_contracts: string
      revenue_total: string
      expense_total: string
    }>(
      `
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contracts,
        COALESCE(SUM(CASE WHEN contract_type = 'revenue' THEN total_amount ELSE 0 END), 0) as revenue_total,
        COALESCE(SUM(CASE WHEN contract_type = 'expense' THEN total_amount ELSE 0 END), 0) as expense_total
      FROM crm_contracts
      WHERE status = 'active'
    `,
    )

    // 5. 갱신 예정 계약 (30일 이내 종료)
    const renewalResult = await query<{
      renewal_count: string
    }>(
      `
      SELECT COUNT(*) as renewal_count
      FROM crm_contracts
      WHERE status = 'active' 
        AND end_date IS NOT NULL
        AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    `,
    )

    const customerStats = customerStatsResult.rows[0]
    const newCustomers = newCustomersResult.rows[0]
    const opportunityStats = opportunityStatsResult.rows[0]
    const contractStats = contractStatsResult.rows[0]
    const renewal = renewalResult.rows[0]

    const newThisMonth = parseInt(newCustomers.this_month)
    const newLastMonth = parseInt(newCustomers.last_month)
    const growth = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : 0

    const stats: CRMStats = {
      totalCustomers: parseInt(customerStats.total_customers),
      activeCustomers: parseInt(customerStats.active_customers),
      inactiveCustomers: parseInt(customerStats.inactive_customers),
      prospectCustomers: parseInt(customerStats.prospect_customers),
      newCustomersThisMonth: newThisMonth,
      newCustomersLastMonth: newLastMonth,
      newCustomersGrowth: growth,
      openOpportunities: parseInt(opportunityStats.open_opportunities),
      totalOpportunityAmount: parseFloat(opportunityStats.total_amount),
      expectedRevenueThisMonth: 0, // TODO: Calculate based on probability and expected close date
      activeContracts: parseInt(contractStats.active_contracts),
      totalRevenueContracts: parseFloat(contractStats.revenue_total),
      totalExpenseContracts: parseFloat(contractStats.expense_total),
      netContractValue:
        parseFloat(contractStats.revenue_total) - parseFloat(contractStats.expense_total),
      contractsToRenew: parseInt(renewal.renewal_count),
    }

    return json({ success: true, data: stats })
  } catch (error: unknown) {
    logger.error('Failed to fetch CRM stats:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'CRM 통계 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
