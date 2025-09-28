import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getDatabasePool } from '$lib/finance/services/database/connection'
import type { FinanceDashboard, AccountBalance, UpcomingPayment } from '$lib/finance/types'

// 자금일보 대시보드 데이터 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const pool = getDatabasePool()

    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]

    // 현재 잔액 조회
    const balanceQuery = `
      SELECT
        a.id,
        a.name,
        a.account_number,
        a.balance,
        b.name as bank_name,
        b.color as bank_color
      FROM finance_accounts a
      LEFT JOIN finance_banks b ON a.bank_id = b.id
      WHERE a.status = 'active'
      ORDER BY a.is_primary DESC, a.balance DESC
    `

    const balanceResult = await pool.query(balanceQuery)
    const currentBalance = balanceResult.rows.reduce((sum, row) => sum + parseFloat(row.balance), 0)

    // 오늘 거래 내역 조회
    const todayQuery = `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(*) as transaction_count
      FROM finance_transactions
      WHERE DATE(transaction_date) = $1 AND status = 'completed'
    `

    const todayResult = await pool.query(todayQuery, [date])
    const todayIncome = parseFloat(todayResult.rows[0].total_income || 0)
    const todayExpense = parseFloat(todayResult.rows[0].total_expense || 0)
    const todayTransactionCount = parseInt(todayResult.rows[0].transaction_count || 0)

    // 이번달 예상 지출 조회
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextMonthStr = nextMonth.toISOString().substring(0, 7) // YYYY-MM

    const monthlyQuery = `
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

    const monthlyResult = await pool.query(monthlyQuery, [
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
        balance: parseFloat(row.balance),
        status: 'active',
        isPrimary: false,
        createdAt: '',
        updatedAt: '',
      },
      currentBalance: parseFloat(row.balance),
      changeToday: 0, // 향후 구현
      changePercentage: 0, // 향후 구현
      isLowBalance: parseFloat(row.balance) < 1000000, // 100만원 미만
    }))

    // 최근 거래 내역 (최근 10건)
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

    const recentTransactionsResult = await pool.query(recentTransactionsQuery)
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
      referenceNumber: row.reference_number,
      notes: row.notes,
      tags: row.tags || [],
      isRecurring: row.is_recurring,
      recurringPattern: row.recurring_pattern,
      attachments: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

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
      monthlyIncome: todayIncome,
      monthlyExpense: todayExpense,
      netCashFlow: todayIncome - todayExpense,
      accountBalances,
      recentTransactions,
      upcomingPayments,
      budgetStatus: {
        totalBudget: 0,
        totalSpent: todayExpense,
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
      data: dashboard,
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
