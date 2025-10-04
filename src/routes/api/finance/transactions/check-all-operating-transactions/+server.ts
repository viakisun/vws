import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  try {
    // 운영통장 ID
    const operatingAccountId = '968ed1f6-1096-4cf5-9c5e-cbfcf846724e'

    // 운영통장의 모든 거래 조회
    const selectQuery = `
      SELECT id, description, counterparty, transaction_date, amount, withdrawals
      FROM finance_transactions 
      WHERE account_id = $1
      ORDER BY transaction_date DESC
      LIMIT 50
    `

    const result = await query(selectQuery, [operatingAccountId])

    return json({
      success: true,
      message: `운영통장 거래 ${result.rows.length}개를 조회했습니다.`,
      transactions: result.rows.map((row) => ({
        id: row.id,
        description: row.description,
        counterparty: row.counterparty,
        transactionDate: row.transaction_date,
        amount: row.amount,
        withdrawals: row.withdrawals,
      })),
    })
  } catch (error) {
    console.error('운영통장 거래 조회 실패:', error)
    return json(
      {
        success: false,
        error: '운영통장 거래 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
