import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

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
      LIMIT 20
    `

    const result = await query(selectQuery, [operatingAccountId])

    return json({
      success: true,
      transactions: result.rows,
      totalCount: result.rows.length,
    })
  } catch (error) {
    logger.error('운영통장 거래 조회 실패:', error)
    return json(
      {
        success: false,
        error: '운영통장 거래 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
