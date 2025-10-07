import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 거래 통계 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const accountId = url.searchParams.get('accountId')
    const categoryId = url.searchParams.get('categoryId')
    const type = url.searchParams.get('type')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    let whereConditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (accountId) {
      whereConditions.push(`account_id = $${paramIndex++}`)
      params.push(accountId)
    }

    if (categoryId) {
      whereConditions.push(`category_id = $${paramIndex++}`)
      params.push(categoryId)
    }

    if (type) {
      whereConditions.push(`type = $${paramIndex++}`)
      params.push(type)
    }

    if (dateFrom) {
      whereConditions.push(`transaction_date >= $${paramIndex++}`)
      params.push(dateFrom)
    }

    if (dateTo) {
      whereConditions.push(`transaction_date <= $${paramIndex++}`)
      params.push(dateTo)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const queryText = `
      SELECT
        COUNT(*) as total_count,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(amount), 0) as net_amount,
        COALESCE(AVG(CASE WHEN type = 'income' THEN amount END), 0) as avg_income,
        COALESCE(AVG(CASE WHEN type = 'expense' THEN ABS(amount) END), 0) as avg_expense
      FROM finance_transactions
      ${whereClause}
    `

    const result = await query(queryText, params)
    const row = result.rows[0]

    const stats = {
      totalCount: parseInt(row.total_count),
      incomeCount: parseInt(row.income_count),
      expenseCount: parseInt(row.expense_count),
      totalIncome: parseFloat(row.total_income),
      totalExpense: parseFloat(row.total_expense),
      netAmount: parseFloat(row.net_amount),
      averageIncome: parseFloat(row.avg_income),
      averageExpense: parseFloat(row.avg_expense),
    }

    return json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('거래 통계 조회 실패:', error)
    return json(
      {
        success: false,
        error: `거래 통계를 조회할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}
