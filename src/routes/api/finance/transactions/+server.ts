import { query } from '$lib/database/connection'
import { alertGenerator } from '$lib/finance/services/alerts/alert-generator'
import type { CreateTransactionRequest, Transaction } from '$lib/finance/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 거래 타입별 계좌 잔액 업데이트 함수
async function updateAccountBalance(
  accountId: string,
  amount: number,
  type: string,
): Promise<void> {
  try {
    let balanceChange = 0

    switch (type) {
      case 'income':
        // 수입: 잔액 증가 (+)
        balanceChange = amount
        break
      case 'expense':
        // 지출: 잔액 감소 (-)
        balanceChange = -amount
        break
      case 'transfer':
        // 이체: 별도 처리 필요 (출금 계좌와 입금 계좌 모두 필요)
        // 이 함수에서는 단일 계좌만 처리하므로 잔액 변화 없음
        balanceChange = 0
        break
      case 'adjustment':
        // 조정: 잔액 변화 없음 (0)
        balanceChange = 0
        break
      default:
        console.warn(`알 수 없는 거래 타입: ${type}`)
        balanceChange = 0
    }

    // 잔액 업데이트 (transfer와 adjustment는 잔액 변화 없음)
    if (balanceChange !== 0) {
      // 잔액이 음수가 되는지 확인
      const currentBalanceResult = await query(
        'SELECT balance FROM finance_accounts WHERE id = $1',
        [accountId],
      )

      if (currentBalanceResult.rows.length === 0) {
        throw new Error('계좌를 찾을 수 없습니다.')
      }

      const currentBalance = parseFloat(currentBalanceResult.rows[0].balance)
      const newBalance = currentBalance + balanceChange

      if (newBalance < 0) {
        throw new Error('계좌 잔액이 부족합니다. 잔액은 0원보다 작을 수 없습니다.')
      }

      await query(
        'UPDATE finance_accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
        [balanceChange, accountId],
      )
    }
  } catch (error) {
    console.error('계좌 잔액 업데이트 실패:', error)
    throw error
  }
}

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

    // 동적 쿼리 구성
    let queryText = `
      SELECT
        t.*,
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
    const total = parseInt(countResult.rows[0].count)

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

    // 거래 생성
    const queryText = `
      INSERT INTO finance_transactions (
        account_id, category_id, amount, type, description,
        transaction_date, reference_number, notes, tags,
        is_recurring, recurring_pattern
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `

    const params = [
      body.accountId,
      body.categoryId,
      body.amount,
      body.type,
      body.description,
      body.transactionDate,
      body.referenceNumber || null,
      body.notes || null,
      body.tags || [],
      body.isRecurring || false,
      body.recurringPattern ? JSON.stringify(body.recurringPattern) : null,
    ]

    const result = await query(queryText, params)
    const transaction = result.rows[0]

    // 거래 타입별 계좌 잔액 업데이트
    await updateAccountBalance(body.accountId, body.amount, body.type)

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
