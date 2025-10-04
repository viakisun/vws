import { query } from '$lib/database/connection'
import { alertGenerator } from '$lib/finance/services/alerts/alert-generator'
import type { CreateTransactionRequest, Transaction } from '$lib/finance/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 거래 내역 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    // 쿼리 파라미터 파싱
    const accountId = url.searchParams.get('accountId')
    const categoryId = url.searchParams.get('categoryId')
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const amountMin = url.searchParams.get('amountMin')
    const amountMax = url.searchParams.get('amountMax')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // 동적 쿼리 구성 (새로운 컬럼들 포함)
    let queryText = `
      SELECT
        t.*,
        t.transaction_date,
        t.counterparty,
        t.deposits,
        t.withdrawals,
        t.balance,
        a.name as account_name,
        a.account_number,
        a.bank_id,
        b.name as bank_name,
        c.name as category_name,
        c.type as category_type,
        c.color as category_color
      FROM finance_transactions t
      LEFT JOIN finance_accounts a ON t.account_id = a.id
      LEFT JOIN finance_banks b ON a.bank_id = b.id
      LEFT JOIN finance_categories c ON t.category_id = c.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (accountId) {
      queryText += ` AND t.account_id = $${paramIndex++}`
      params.push(accountId)
    }

    if (categoryId) {
      queryText += ` AND t.category_id = $${paramIndex++}`
      params.push(categoryId)
    }

    if (type) {
      queryText += ` AND t.type = $${paramIndex++}`
      params.push(type)
    }

    if (status) {
      queryText += ` AND t.status = $${paramIndex++}`
      params.push(status)
    }

    if (dateFrom) {
      queryText += ` AND t.transaction_date >= $${paramIndex++}`
      params.push(dateFrom)
    }

    if (dateTo) {
      queryText += ` AND t.transaction_date <= $${paramIndex++}`
      params.push(dateTo)
    }

    if (amountMin) {
      queryText += ` AND t.amount >= $${paramIndex++}`
      params.push(parseFloat(amountMin))
    }

    if (amountMax) {
      queryText += ` AND t.amount <= $${paramIndex++}`
      params.push(parseFloat(amountMax))
    }

    if (search) {
      queryText += ` AND (t.description ILIKE $${paramIndex++} OR t.reference_number ILIKE $${paramIndex++})`
      params.push(`%${search}%`, `%${search}%`)
    }

    // 총 개수 조회
    const countQuery = queryText.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM')
    const countResult = await query(countQuery, params)
    const total = countResult.rows && countResult.rows[0] ? parseInt(countResult.rows[0].count) : 0

    // 페이징 적용
    queryText += ` ORDER BY t.transaction_date DESC, t.created_at DESC`
    queryText += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    params.push(limit, offset)

    const result = await query(queryText, params)

    const transactions: Transaction[] = result.rows.map((row) => ({
      id: row.id,
      accountId: row.account_id,
      account: {
        id: row.account_id,
        name: row.account_name,
        accountNumber: row.account_number,
        bankId: row.bank_id || '',
        bank: row.bank_name
          ? {
              id: row.bank_id || '',
              name: row.bank_name,
              code: '',
              color: '#3B82F6',
              isActive: true,
              createdAt: '',
              updatedAt: '',
            }
          : undefined,
        accountType: 'checking',
        balance: 0,
        status: 'active',
        isPrimary: false,
        createdAt: '',
        updatedAt: '',
      },
      categoryId: row.category_id,
      category: {
        id: row.category_id,
        name: row.category_name,
        type: row.category_type,
        color: row.category_color,
        isActive: true,
        isSystem: true,
        createdAt: '',
        updatedAt: '',
      },
      amount: parseFloat(row.amount),
      type: row.type,
      status: row.status,
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

    return json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      message: `${transactions.length}개의 거래를 조회했습니다.`,
    })
  } catch (error) {
    console.error('거래 내역 조회 실패:', error)
    return json(
      {
        success: false,
        data: [],
        error: '거래 내역을 조회할 수 없습니다.',
      },
      { status: 500 },
    )
  }
}

// 새 거래 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: CreateTransactionRequest = await request.json()

    // 필수 필드 검증
    if (
      !body.accountId ||
      !body.categoryId ||
      !body.amount ||
      !body.description ||
      !body.transactionDate
    ) {
      return json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 거래 생성 (새로운 스키마: deposits/withdrawals/balance 지원)
    const queryText = `
      INSERT INTO finance_transactions (
        account_id, category_id, amount, type, description,
        transaction_date, counterparty, deposits, withdrawals, balance,
        reference_number, notes, tags, is_recurring, recurring_pattern
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `

    const params = [
      body.accountId,
      body.categoryId,
      body.amount,
      body.type,
      body.description,
      body.transactionDate,
      body.counterparty || null,
      body.deposits || null,
      body.withdrawals || null,
      body.balance || null,
      body.referenceNumber || null,
      body.notes || null,
      body.tags || [],
      body.isRecurring || false,
      body.recurringPattern ? JSON.stringify(body.recurringPattern) : null,
    ]

    const result = await query(queryText, params)
    const transaction = result.rows[0]

    // 알림 생성 (비동기로 실행)
    alertGenerator
      .checkAlertsAfterTransaction(transaction.id, body.accountId, body.amount, body.categoryId)
      .catch((error) => {
        console.error('알림 생성 실패:', error)
      })

    return json({
      success: true,
      data: {
        id: transaction.id,
        accountId: transaction.account_id,
        categoryId: transaction.category_id,
        amount: parseFloat(transaction.amount),
        type: transaction.type,
        status: transaction.status,
        description: transaction.description,
        transactionDate: transaction.transaction_date,
        counterparty: transaction.counterparty,
        deposits: transaction.deposits ? parseFloat(transaction.deposits) : undefined,
        withdrawals: transaction.withdrawals ? parseFloat(transaction.withdrawals) : undefined,
        balance: transaction.balance ? parseFloat(transaction.balance) : undefined,
        referenceNumber: transaction.reference_number,
        notes: transaction.notes,
        tags: transaction.tags || [],
        isRecurring: transaction.is_recurring,
        recurringPattern: transaction.recurring_pattern,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      },
      message: '거래가 성공적으로 생성되었습니다.',
    })
  } catch (error) {
    console.error('거래 생성 실패:', error)
    return json(
      {
        success: false,
        error: '거래 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
