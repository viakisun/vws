import { query } from '$lib/database/connection'
import type { SalesApiResponse, Transaction } from '$lib/sales/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 거래 내역 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const type = url.searchParams.get('type') || 'all'
    const payment_status = url.searchParams.get('payment_status') || 'all'
    const customer_id = url.searchParams.get('customer_id') || ''
    const contract_id = url.searchParams.get('contract_id') || ''
    const date_from = url.searchParams.get('date_from') || ''
    const date_to = url.searchParams.get('date_to') || ''
    const search = url.searchParams.get('search') || ''

    const whereConditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (type !== 'all') {
      whereConditions.push(`type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    if (payment_status !== 'all') {
      whereConditions.push(`payment_status = $${paramIndex}`)
      params.push(payment_status)
      paramIndex++
    }

    if (customer_id) {
      whereConditions.push(`customer_id = $${paramIndex}`)
      params.push(customer_id)
      paramIndex++
    }

    if (contract_id) {
      whereConditions.push(`contract_id = $${paramIndex}`)
      params.push(contract_id)
      paramIndex++
    }

    if (date_from) {
      whereConditions.push(`transaction_date >= $${paramIndex}`)
      params.push(date_from)
      paramIndex++
    }

    if (date_to) {
      whereConditions.push(`transaction_date <= $${paramIndex}`)
      params.push(date_to)
      paramIndex++
    }

    if (search) {
      whereConditions.push(
        `(transaction_number ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`,
      )
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const result = await query(
      `
      SELECT 
        t.*,
        c.name as customer_name,
        c.type as customer_type,
        contract.title as contract_title,
        contract.contract_number
      FROM sales_transactions t
      LEFT JOIN sales_customers c ON t.customer_id = c.id
      LEFT JOIN sales_contracts contract ON t.contract_id = contract.id
      ${whereClause}
      ORDER BY t.transaction_date DESC, t.created_at DESC
      `,
      params,
    )

    const response: SalesApiResponse<Transaction[]> = {
      success: true,
      data: result.rows as Transaction[],
    }

    return json(response)
  } catch (error) {
    logger.error('거래 내역 목록 조회 실패:', error)
    const response: SalesApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '거래 내역 목록을 조회할 수 없습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 새 거래 내역 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json()

    // 필수 필드 검증
    if (!data.customer_id || !data.type || !data.amount || !data.transaction_date) {
      const response: SalesApiResponse<null> = {
        success: false,
        error: '거래처, 타입, 금액, 거래일은 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    // 거래처 존재 확인
    const customerCheck = await query('SELECT id FROM sales_customers WHERE id = $1', [
      data.customer_id,
    ])

    if (customerCheck.rows.length === 0) {
      const response: SalesApiResponse<null> = {
        success: false,
        error: '존재하지 않는 거래처입니다.',
      }
      return json(response, { status: 400 })
    }

    // 계약 존재 확인 (선택적)
    if (data.contract_id) {
      const contractCheck = await query('SELECT id FROM sales_contracts WHERE id = $1', [
        data.contract_id,
      ])

      if (contractCheck.rows.length === 0) {
        const response: SalesApiResponse<null> = {
          success: false,
          error: '존재하지 않는 계약입니다.',
        }
        return json(response, { status: 400 })
      }
    }

    // 거래번호 생성 (자동)
    const transactionNumber = `TXN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const result = await query(
      `
      INSERT INTO sales_transactions (
        transaction_number, contract_id, customer_id, type, amount, 
        transaction_date, due_date, payment_date, payment_status, 
        description, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, transaction_number, contract_id, customer_id, type, amount,
                transaction_date, due_date, payment_date, payment_status,
                description, notes, created_by, created_at::text, updated_at::text
      `,
      [
        transactionNumber,
        data.contract_id || null,
        data.customer_id,
        data.type,
        data.amount,
        data.transaction_date,
        data.due_date || null,
        data.payment_date || null,
        data.payment_status || 'pending',
        data.description || null,
        data.notes || null,
        data.created_by || null,
      ],
    )

    const response: SalesApiResponse<Transaction> = {
      success: true,
      data: result.rows[0] as Transaction,
      message: '거래 내역이 성공적으로 생성되었습니다.',
    }

    return json(response)
  } catch (error) {
    logger.error('거래 내역 생성 실패:', error)
    const response: SalesApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '거래 내역 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
