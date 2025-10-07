import { query } from '$lib/database/connection'
import type { AccountBalance, FinanceDashboard, UpcomingPayment } from '$lib/finance/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 자금일보 대시보드 데이터 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]

    // 현재 잔액 조회 (거래 내역의 최신 balance 사용)
    // RND 태그가 있는 계좌는 회사 자금에서 제외
    const balanceQuery = `
      SELECT
        a.id,
        a.name,
        a.account_number,
        a.is_primary,
        b.name as bank_name,
        b.color as bank_color,
        COALESCE(latest_tx.balance, 0) as current_balance,
        EXISTS(
          SELECT 1 FROM finance_account_tag_relations r
          INNER JOIN finance_account_tags t ON r.tag_id = t.id
          WHERE r.account_id = a.id AND t.tag_type = 'dashboard'
        ) as has_dashboard_tag,
        EXISTS(
          SELECT 1 FROM finance_account_tag_relations r
          INNER JOIN finance_account_tags t ON r.tag_id = t.id
          WHERE r.account_id = a.id AND t.tag_type = 'rnd'
        ) as has_rnd_tag
      FROM finance_accounts a
      LEFT JOIN finance_banks b ON a.bank_id = b.id
      LEFT JOIN LATERAL (
        SELECT balance
        FROM finance_transactions
        WHERE account_id = a.id
        ORDER BY transaction_date DESC, created_at DESC
        LIMIT 1
      ) latest_tx ON true
      WHERE a.status = 'active'
      ORDER BY has_dashboard_tag DESC, a.is_primary DESC, current_balance DESC
    `

    const balanceResult = await query(balanceQuery)

    // RND 태그가 없는 계좌만 회사 자금에 포함
    const currentBalance = balanceResult.rows
      .filter((row) => !row.has_rnd_tag)
      .reduce((sum, row) => sum + parseFloat(row.current_balance), 0)

    // 이번달 거래 내역 조회 (RND 계좌 제외)
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextMonthStr = nextMonth.toISOString().substring(0, 7) // YYYY-MM

    const monthlyQuery = `
      SELECT
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense,
        COUNT(*) as transaction_count
      FROM finance_transactions t
      WHERE t.transaction_date >= $1
        AND t.transaction_date < $2
        AND t.status = 'completed'
        AND NOT EXISTS (
          SELECT 1 FROM finance_account_tag_relations r
          INNER JOIN finance_account_tags tag ON r.tag_id = tag.id
          WHERE r.account_id = t.account_id AND tag.tag_type = 'rnd'
        )
    `

    const monthlyResult = await query(monthlyQuery, [
      `${currentMonth}-01`,
      `${nextMonthStr}-01`, // 다음 달 1일
    ])
    const monthlyIncome = parseFloat(monthlyResult.rows[0].total_income || 0)
    const monthlyExpense = parseFloat(monthlyResult.rows[0].total_expense || 0)
    const monthlyTransactionCount = parseInt(monthlyResult.rows[0].transaction_count || 0)

    // 이번달 카테고리별 지출 조회
    const categoryQuery = `
      SELECT
        c.name as category_name,
        SUM(t.amount) as total_amount
      FROM finance_transactions t
      LEFT JOIN finance_categories c ON t.category_id = c.id
      WHERE t.transaction_date >= $1 AND t.transaction_date < $2
        AND t.type = 'expense' AND t.status = 'completed'
      GROUP BY c.name
      ORDER BY total_amount DESC
    `

    const categoryResult = await query(categoryQuery, [
      `${currentMonth}-01`,
      `${nextMonthStr}-01`, // 다음 달 1일
    ])

    // 계좌별 잔액 현황
    const accountBalances: AccountBalance[] = balanceResult.rows.map((row) => ({
      account: {
        id: row.id,
        name: row.name,
        accountNumber: row.account_number,
        bankId: '',
        accountType: 'checking',
        balance: parseFloat(row.current_balance), // 거래 내역의 최신 balance 사용
        status: 'active',
        isPrimary: row.is_primary,
        createdAt: '',
        updatedAt: '',
      },
      currentBalance: parseFloat(row.current_balance),
      changeToday: 0, // 향후 구현
      changePercentage: 0, // 향후 구현
      isLowBalance: parseFloat(row.current_balance) < 1000000, // 100만원 미만
    }))

    // 최근 거래 내역 (최근 10건) - 새로운 스키마 지원
    const recentTransactionsQuery = `
      SELECT
        t.*,
        a.name as account_name,
        a.account_number,
        b.name as bank_name,
        c.name as category_name,
        c.color as category_color
      FROM finance_transactions t
      LEFT JOIN finance_accounts a ON t.account_id = a.id
      LEFT JOIN finance_banks b ON a.bank_id = b.id
      LEFT JOIN finance_categories c ON t.category_id = c.id
      WHERE t.status = 'completed'
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT 10
    `

    const recentTransactionsResult = await query(recentTransactionsQuery)
    const recentTransactions = recentTransactionsResult.rows.map((row) => ({
      id: row.id,
      accountId: row.account_id,
      account: {
        id: row.account_id,
        name: row.account_name,
        accountNumber: row.account_number,
        bankId: '',
        accountType: 'checking' as const,
        balance: 0,
        status: 'active' as const,
        isPrimary: false,
        createdAt: '',
        updatedAt: '',
      },
      categoryId: row.category_id,
      category: {
        id: row.category_id,
        name: row.category_name,
        type: row.type as 'income' | 'expense' | 'transfer' | 'adjustment',
        color: row.category_color,
        isActive: true,
        isSystem: true,
        createdAt: '',
        updatedAt: '',
      },
      amount: parseFloat(row.amount),
      type: row.type as 'income' | 'expense' | 'transfer' | 'adjustment',
      status: row.status as 'pending' | 'completed' | 'cancelled' | 'failed',
      description: row.description,
      transactionDate: row.transaction_date,
      counterparty: row.counterparty,
      deposits: row.deposits ? parseFloat(row.deposits) : undefined,
      withdrawals: row.withdrawals ? parseFloat(row.withdrawals) : undefined,
      balance: row.balance ? parseFloat(row.balance) : undefined,
      referenceNumber: row.reference_number,
      notes: row.notes,
      tags: row.tags || [],
      isRecurring: row.is_recurring,
      recurringPattern: row.recurring_pattern,
      attachments: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    // 최근 6개월 월별 통계 조회
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().substring(0, 7) // YYYY-MM

    const monthlyStatsQuery = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(*) as transaction_count
      FROM finance_transactions
      WHERE transaction_date >= $1
        AND transaction_date < $2
        AND status = 'completed'
      GROUP BY DATE_TRUNC('month', transaction_date)
      ORDER BY month
    `

    const monthlyStatsResult = await query(monthlyStatsQuery, [
      `${sixMonthsAgoStr}-01`,
      `${nextMonthStr}-01`,
    ])

    // 6개월 데이터 생성 (빈 월도 포함)
    const monthlyStats: Array<{
      month: string
      monthDisplay: string
      totalIncome: number
      totalExpense: number
      netFlow: number
      transactionCount: number
    }> = []
    for (let i = 0; i < 6; i++) {
      const month = new Date()
      month.setMonth(month.getMonth() - (5 - i))
      const monthStr = month.toISOString().substring(0, 7)
      const monthDisplay = `${month.getFullYear()}년 ${month.getMonth() + 1}월`

      const monthData = monthlyStatsResult.rows.find((row) => row.month === monthStr)

      monthlyStats.push({
        month: monthStr,
        monthDisplay,
        totalIncome: monthData ? parseFloat(monthData.total_income) : 0,
        totalExpense: monthData ? parseFloat(monthData.total_expense) : 0,
        netFlow: monthData
          ? parseFloat(monthData.total_income) - parseFloat(monthData.total_expense)
          : 0,
        transactionCount: monthData ? parseInt(monthData.transaction_count) : 0,
      })
    }

    // 카테고리별 지출 통계 (최근 6개월)
    const categoryStatsQuery = `
      SELECT
        c.name as category_name,
        c.color as category_color,
        SUM(t.amount) as total_amount,
        COUNT(*) as transaction_count
      FROM finance_transactions t
      JOIN finance_categories c ON t.category_id = c.id
      WHERE t.transaction_date >= $1
        AND t.transaction_date < $2
        AND t.type = 'expense'
        AND t.status = 'completed'
      GROUP BY c.id, c.name, c.color
      ORDER BY total_amount DESC
      LIMIT 10
    `

    const categoryStatsResult = await query(categoryStatsQuery, [
      `${sixMonthsAgoStr}-01`,
      `${nextMonthStr}-01`,
    ])
    const categoryStats = categoryStatsResult.rows.map((row) => ({
      name: row.category_name,
      color: row.category_color,
      amount: parseFloat(row.total_amount),
      transactionCount: parseInt(row.transaction_count),
      percentage: 0, // 계산 후 업데이트
    }))

    // 카테고리별 지출 비율 계산
    const totalExpense = categoryStats.reduce((sum, cat) => sum + cat.amount, 0)
    categoryStats.forEach((cat) => {
      cat.percentage = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0
    })

    // 예정된 지급 (향후 구현)
    const upcomingPayments: UpcomingPayment[] = []

    // 알림 (향후 구현)
    const alerts: any[] = []

    // 트렌드 (향후 구현)
    const trends: any[] = []

    // 예측 (향후 구현)
    const predictions: any[] = []

    const dashboard: FinanceDashboard = {
      currentBalance,
      monthlyIncome: monthlyIncome,
      monthlyExpense: monthlyExpense,
      netCashFlow: monthlyIncome - monthlyExpense,
      accountBalances,
      recentTransactions,
      upcomingPayments,
      budgetStatus: {
        totalBudget: 0,
        totalSpent: monthlyExpense,
        remainingBudget: 0,
        utilizationRate: 0,
        overBudgetCount: 0,
        nearLimitCount: 0,
      },
      alerts,
      trends,
      predictions,
      lastUpdated: new Date().toISOString(),
    }

    return json({
      success: true,
      data: {
        ...dashboard,
        monthlyStats,
        categoryStats,
      },
      message: '자금일보 대시보드 데이터를 조회했습니다.',
    })
  } catch (error) {
    console.error('대시보드 데이터 조회 실패:', error)
    return json(
      {
        success: false,
        data: null,
        error: `대시보드 데이터를 조회할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}
