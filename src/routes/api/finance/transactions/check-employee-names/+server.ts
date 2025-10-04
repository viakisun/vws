import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  try {
    // 운영통장 ID
    const operatingAccountId = '968ed1f6-1096-4cf5-9c5e-cbfcf846724e'

    // 운영통장의 모든 거래 조회
    const selectQuery = `
      SELECT id, description, counterparty, transaction_date, amount
      FROM finance_transactions 
      WHERE account_id = $1
      ORDER BY transaction_date DESC
      LIMIT 20
    `

    const result = await query(selectQuery, [operatingAccountId])

    return json({
      success: true,
      message: `${result.rows.length}개의 직원 이름 거래를 찾았습니다.`,
      transactions: result.rows.map((row) => ({
        description: row.description,
        counterparty: row.counterparty,
        amount: row.amount,
        transactionDate: row.transaction_date,
      })),
    })
  } catch (error) {
    console.error('직원 이름 거래 조회 실패:', error)
    return json(
      {
        success: false,
        error: '직원 이름 거래 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
