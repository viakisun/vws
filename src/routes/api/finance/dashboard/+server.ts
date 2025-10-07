import { query } from '$lib/database/connection'
import type {
  AccountBalance,
  FinanceAlert,
  FinanceDashboard,
  FinancePrediction,
  FinanceTrend,
  UpcomingPayment,
} from '$lib/finance/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// ============================================================================
// Type Definitions
// ============================================================================

interface BalanceRow {
  id: string
  name: string
  account_number: string
  is_primary: boolean
  bank_name: string
  bank_color: string
  current_balance: string | number
  has_dashboard_tag: boolean
  has_rnd_tag: boolean
}

interface MonthlyTransactionRow {
  total_income: string | number
  total_expense: string | number
  transaction_count: string | number
}

interface RecentTransactionRow {
  id: string
  account_id: string
  category_id: string
  amount: string | number
  type: string
  status: string
  description: string | null
  transaction_date: string
  counterparty: string | null
  deposits: string | number | null
  withdrawals: string | number | null
  balance: string | number | null
  reference_number: string | null
  notes: string | null
  tags: string[] | null
  is_recurring: boolean | null
  recurring_pattern: string | null
  created_at: string
  updated_at: string
  account_name: string
  account_number: string
  bank_name: string
  category_name: string
  category_color: string | null
}

interface MonthlyStatsRow {
  month: string
  total_income: string | number
  total_expense: string | number
  transaction_count: string | number
}

interface CategoryStatsRow {
  category_name: string
  category_color: string | null
  total_amount: string | number
  transaction_count: string | number
}

interface MonthlyStat {
  month: string
  monthDisplay: string
  totalIncome: number
  totalExpense: number
  netFlow: number
  transactionCount: number
}

interface CategoryStat {
  name: string
  color: string | null
  amount: number
  transactionCount: number
  percentage: number
}

// ============================================================================
// Helper Functions
// ============================================================================

function safeParseFloat(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? value : parseFloat(value) || 0
}

function safeParseInt(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? Math.floor(value) : parseInt(String(value)) || 0
}

function getMonthString(date: Date): string {
  return date.toISOString().substring(0, 7) // YYYY-MM
}

function getMonthDisplay(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

// ============================================================================
// Main Handler
// ============================================================================

export const GET: RequestHandler = async () => {
  try {
    const currentDate = new Date()
    const currentMonth = getMonthString(currentDate)

    const nextMonth = new Date(currentDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextMonthStr = getMonthString(nextMonth)

    const sixMonthsAgo = new Date(currentDate)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const sixMonthsAgoStr = getMonthString(sixMonthsAgo)

    // ========================================================================
    // Query 1: Account Balances (with tags)
    // ========================================================================

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

    const balanceResult = await query<BalanceRow>(balanceQuery)

    // Calculate total balance (excluding RND accounts)
    const currentBalance = balanceResult.rows
      .filter((row) => !row.has_rnd_tag)
      .reduce((sum, row) => sum + safeParseFloat(row.current_balance), 0)

    // ========================================================================
    // Query 2: Monthly Transaction Summary (excluding RND accounts)
    // ========================================================================

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

    const monthlyResult = await query<MonthlyTransactionRow>(monthlyQuery, [
      `${currentMonth}-01`,
      `${nextMonthStr}-01`,
    ])

    const monthlyRow = monthlyResult.rows[0]
    const monthlyIncome = safeParseFloat(monthlyRow?.total_income)
    const monthlyExpense = safeParseFloat(monthlyRow?.total_expense)

    // ========================================================================
    // Query 3: Recent Transactions (last 10)
    // ========================================================================

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

    const recentTransactionsResult = await query<RecentTransactionRow>(recentTransactionsQuery)
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
        color: row.category_color ?? undefined,
        isActive: true,
        isSystem: true,
        createdAt: '',
        updatedAt: '',
      },
      amount: safeParseFloat(row.amount),
      type: row.type as 'income' | 'expense' | 'transfer' | 'adjustment',
      status: row.status as 'pending' | 'completed' | 'cancelled' | 'failed',
      description: row.description ?? '',
      transactionDate: row.transaction_date,
      counterparty: row.counterparty ?? undefined,
      deposits: row.deposits ? safeParseFloat(row.deposits) : undefined,
      withdrawals: row.withdrawals ? safeParseFloat(row.withdrawals) : undefined,
      balance: row.balance ? safeParseFloat(row.balance) : undefined,
      referenceNumber: row.reference_number ?? undefined,
      notes: row.notes ?? undefined,
      tags: row.tags ?? [],
      isRecurring: row.is_recurring ?? false,
      recurringPattern: row.recurring_pattern ?? undefined,
      attachments: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    // ========================================================================
    // Query 4: Monthly Stats (last 6 months)
    // ========================================================================

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

    const monthlyStatsResult = await query<MonthlyStatsRow>(monthlyStatsQuery, [
      `${sixMonthsAgoStr}-01`,
      `${nextMonthStr}-01`,
    ])

    // Generate 6 months data (including empty months)
    const monthlyStats: MonthlyStat[] = []
    for (let i = 0; i < 6; i++) {
      const month = new Date(currentDate)
      month.setMonth(month.getMonth() - (5 - i))
      const monthStr = getMonthString(month)
      const monthDisplay = getMonthDisplay(month)

      const monthData = monthlyStatsResult.rows.find((row) => row.month === monthStr)

      monthlyStats.push({
        month: monthStr,
        monthDisplay,
        totalIncome: monthData ? safeParseFloat(monthData.total_income) : 0,
        totalExpense: monthData ? safeParseFloat(monthData.total_expense) : 0,
        netFlow: monthData
          ? safeParseFloat(monthData.total_income) - safeParseFloat(monthData.total_expense)
          : 0,
        transactionCount: monthData ? safeParseInt(monthData.transaction_count) : 0,
      })
    }

    // ========================================================================
    // Query 5: Category Stats (last 6 months, top 10)
    // ========================================================================

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

    const categoryStatsResult = await query<CategoryStatsRow>(categoryStatsQuery, [
      `${sixMonthsAgoStr}-01`,
      `${nextMonthStr}-01`,
    ])

    const categoryStats: CategoryStat[] = categoryStatsResult.rows.map((row) => ({
      name: row.category_name,
      color: row.category_color,
      amount: safeParseFloat(row.total_amount),
      transactionCount: safeParseInt(row.transaction_count),
      percentage: 0, // Calculate below
    }))

    // Calculate category percentages
    const totalCategoryExpense = categoryStats.reduce((sum, cat) => sum + cat.amount, 0)
    categoryStats.forEach((cat) => {
      cat.percentage = totalCategoryExpense > 0 ? (cat.amount / totalCategoryExpense) * 100 : 0
    })

    // ========================================================================
    // Transform Account Balances
    // ========================================================================

    const accountBalances: AccountBalance[] = balanceResult.rows.map((row) => ({
      account: {
        id: row.id,
        name: row.name,
        accountNumber: row.account_number,
        bankId: '',
        accountType: 'checking',
        balance: safeParseFloat(row.current_balance),
        status: 'active',
        isPrimary: row.is_primary,
        createdAt: '',
        updatedAt: '',
      },
      currentBalance: safeParseFloat(row.current_balance),
      changeToday: 0,
      changePercentage: 0,
      isLowBalance: safeParseFloat(row.current_balance) < 1000000, // Less than 1M KRW
    }))

    // ========================================================================
    // Build Dashboard Response
    // ========================================================================

    const upcomingPayments: UpcomingPayment[] = []
    const alerts: FinanceAlert[] = []
    const trends: FinanceTrend[] = []
    const predictions: FinancePrediction[] = []

    const dashboard: FinanceDashboard = {
      currentBalance,
      monthlyIncome,
      monthlyExpense,
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
    logger.error('대시보드 데이터 조회 실패:', error)
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
