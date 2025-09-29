import { query } from '$lib/database/connection'
import type { Budget, CreateBudgetRequest } from '$lib/finance/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 예산 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    // 쿼리 파라미터 파싱
    const type = url.searchParams.get('type')
    const period = url.searchParams.get('period')
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')
    const quarter = url.searchParams.get('quarter')
    const categoryId = url.searchParams.get('categoryId')
    const accountId = url.searchParams.get('accountId')
    const status = url.searchParams.get('status')

    // 동적 쿼리 구성
    let queryText = `
      SELECT
        b.*,
        c.name as category_name,
        c.type as category_type,
        c.color as category_color,
        a.name as account_name
      FROM finance_budgets b
      LEFT JOIN finance_categories c ON b.category_id = c.id
      LEFT JOIN finance_accounts a ON b.account_id = a.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (type) {
      queryText += ` AND b.type = $${paramIndex++}`
      params.push(type)
    }

    if (period) {
      queryText += ` AND b.period = $${paramIndex++}`
      params.push(period)
    }

    if (year) {
      queryText += ` AND b.year = $${paramIndex++}`
      params.push(parseInt(year))
    }

    if (month) {
      queryText += ` AND b.month = $${paramIndex++}`
      params.push(parseInt(month))
    }

    if (quarter) {
      queryText += ` AND b.quarter = $${paramIndex++}`
      params.push(parseInt(quarter))
    }

    if (categoryId) {
      queryText += ` AND b.category_id = $${paramIndex++}`
      params.push(categoryId)
    }

    if (accountId) {
      queryText += ` AND b.account_id = $${paramIndex++}`
      params.push(accountId)
    }

    if (status) {
      queryText += ` AND b.status = $${paramIndex++}`
      params.push(status)
    }

    queryText += ` ORDER BY b.year DESC, b.month DESC, b.created_at DESC`

    const result = await query(queryText, params)

    const budgets: Budget[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      period: row.period,
      year: row.year,
      month: row.month,
      quarter: row.quarter,
      categoryId: row.category_id,
      category: row.category_id
        ? {
            id: row.category_id,
            name: row.category_name,
            type: row.category_type,
            color: row.category_color,
            isActive: true,
            isSystem: true,
            createdAt: '',
            updatedAt: '',
          }
        : undefined,
      accountId: row.account_id,
      account: row.account_id
        ? {
            id: row.account_id,
            name: row.account_name,
            accountNumber: '',
            bankId: '',
            accountType: 'checking' as const,
            balance: 0,
            status: 'active' as const,
            isPrimary: false,
            createdAt: '',
            updatedAt: '',
          }
        : undefined,
      plannedAmount: parseFloat(row.planned_amount),
      actualAmount: parseFloat(row.actual_amount),
      status: row.status,
      description: row.description,
      tags: row.tags || [],
      isRecurring: row.is_recurring,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return json({
      success: true,
      data: budgets,
      message: `${budgets.length}개의 예산을 조회했습니다.`,
    })
  } catch (error) {
    console.error('예산 목록 조회 실패:', error)
    return json(
      {
        success: false,
        data: [],
        error: `예산 목록을 조회할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}

// 새 예산 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: CreateBudgetRequest = await request.json()

    // 필수 필드 검증
    if (!body.name || !body.type || !body.period || !body.plannedAmount) {
      return json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 예산 생성
    const queryText = `
      INSERT INTO finance_budgets (
        name, type, period, year, month, quarter,
        category_id, account_id, planned_amount,
        description, tags, is_recurring
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `

    const params = [
      body.name,
      body.type,
      body.period,
      body.year,
      body.month || null,
      body.quarter || null,
      body.categoryId || null,
      body.accountId || null,
      body.plannedAmount,
      body.description || null,
      body.tags || [],
      body.isRecurring || false,
    ]

    const result = await query(queryText, params)
    const budget = result.rows[0]

    return json({
      success: true,
      data: {
        id: budget.id,
        name: budget.name,
        type: budget.type,
        period: budget.period,
        year: budget.year,
        month: budget.month,
        quarter: budget.quarter,
        categoryId: budget.category_id,
        accountId: budget.account_id,
        plannedAmount: parseFloat(budget.planned_amount),
        actualAmount: parseFloat(budget.actual_amount),
        status: budget.status,
        description: budget.description,
        tags: budget.tags || [],
        isRecurring: budget.is_recurring,
        createdAt: budget.created_at,
        updatedAt: budget.updated_at,
      },
      message: '예산이 성공적으로 생성되었습니다.',
    })
  } catch (error) {
    console.error('예산 생성 실패:', error)
    return json(
      {
        success: false,
        error: '예산 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
