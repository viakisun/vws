import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 대출 계획 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    // 쿼리 파라미터 파싱
    const type = url.searchParams.get('type') // 'execution' | 'repayment'
    const status = url.searchParams.get('status')
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')

    // 동적 쿼리 구성
    let queryText = `
      SELECT
        l.*,
        a.name as account_name,
        b.name as bank_name
      FROM finance_loans l
      LEFT JOIN finance_accounts a ON l.account_id = a.id
      LEFT JOIN finance_banks b ON a.bank_id = b.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (type) {
      queryText += ` AND l.type = $${paramIndex++}`
      params.push(type)
    }

    if (status) {
      queryText += ` AND l.status = $${paramIndex++}`
      params.push(status)
    }

    if (year) {
      queryText += ` AND EXTRACT(YEAR FROM l.planned_date) = $${paramIndex++}`
      params.push(parseInt(year))
    }

    if (month) {
      queryText += ` AND EXTRACT(MONTH FROM l.planned_date) = $${paramIndex++}`
      params.push(parseInt(month))
    }

    queryText += ` ORDER BY l.planned_date ASC`

    const result = await query(queryText, params)

    const loans = result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: parseFloat(row.amount),
      interestRate: parseFloat(row.interest_rate),
      term: row.term,
      plannedDate: row.planned_date,
      actualDate: row.actual_date,
      status: row.status,
      description: row.description,
      accountId: row.account_id,
      account: row.account_id
        ? {
            id: row.account_id,
            name: row.account_name,
            accountNumber: '',
            bankId: '',
            accountType: 'loan' as const,
            balance: 0,
            status: 'active' as const,
            isPrimary: false,
            createdAt: '',
            updatedAt: '',
          }
        : undefined,
      bank: row.bank_id
        ? {
            id: row.bank_id,
            name: row.bank_name,
            logoUrl: '',
            isActive: true,
            createdAt: '',
            updatedAt: '',
          }
        : undefined,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return json({
      success: true,
      data: loans,
      message: `${loans.length}개의 대출 계획을 조회했습니다.`,
    })
  } catch (error) {
    logger.error('대출 계획 조회 실패:', error)
    return json(
      {
        success: false,
        data: [],
        error: '대출 계획을 조회할 수 없습니다.',
      },
      { status: 500 },
    )
  }
}

// 새 대출 계획 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()

    // 필수 필드 검증
    if (!body.type || !body.amount || !body.plannedDate || !body.description) {
      return json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 대출 계획 생성
    const queryText = `
      INSERT INTO finance_loans (
        type, amount, interest_rate, term, planned_date,
        description, account_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `

    const params = [
      body.type,
      body.amount,
      body.interestRate || 0,
      body.term || 0,
      body.plannedDate,
      body.description,
      body.accountId || null,
      body.notes || null,
    ]

    const result = await query(queryText, params)
    const loan = result.rows[0]

    return json({
      success: true,
      data: {
        id: loan.id,
        type: loan.type,
        amount: parseFloat(loan.amount),
        interestRate: parseFloat(loan.interest_rate),
        term: loan.term,
        plannedDate: loan.planned_date,
        actualDate: loan.actual_date,
        status: loan.status,
        description: loan.description,
        accountId: loan.account_id,
        notes: loan.notes,
        createdAt: loan.created_at,
        updatedAt: loan.updated_at,
      },
      message: '대출 계획이 성공적으로 생성되었습니다.',
    })
  } catch (error) {
    logger.error('대출 계획 생성 실패:', error)
    return json(
      {
        success: false,
        error: '대출 계획 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
