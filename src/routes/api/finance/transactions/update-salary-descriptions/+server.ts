import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

export const POST: RequestHandler = async () => {
  try {
    // 운영통장 ID (하드코딩된 ID)
    const operatingAccountId = '968ed1f6-1096-4cf5-9c5e-cbfcf846724e'

    // 먼저 조건에 맞는 데이터 확인
    const checkQuery = `
      SELECT id, description, counterparty, transaction_date, amount
      FROM finance_transactions 
      WHERE account_id = $1
        AND counterparty IS NOT NULL 
        AND counterparty ~ '^[가-힣]{2,4}$'
        AND description NOT LIKE '%급여%'
      LIMIT 10
    `

    const checkResult = await query(checkQuery, [operatingAccountId])
    logger.info(`Found ${checkResult.rows.length} potential salary transactions:`)
    checkResult.rows.forEach((row) => {
      logger.info(`- ${row.counterparty}: ${row.description} (${row.amount})`)
    })

    // 직접 SQL로 업데이트 (조건 완화)
    const updateQuery = `
      UPDATE finance_transactions 
      SET description = EXTRACT(MONTH FROM transaction_date) || '월급여-' || counterparty
      WHERE account_id = $1
        AND counterparty IS NOT NULL 
        AND counterparty ~ '^[가-힣]{2,4}$'
        AND description NOT LIKE '%급여%'
      RETURNING id, description, counterparty
    `

    const result = await query(updateQuery, [operatingAccountId])
    const updatedCount = result.rows.length

    logger.info(`Updated ${updatedCount} salary transactions:`)
    result.rows.forEach((row) => {
      logger.info(`- ${row.counterparty}: ${row.description}`)
    })

    return json({
      success: true,
      message: `${updatedCount}개의 급여 거래 적요를 업데이트했습니다.`,
      updatedCount,
      updatedTransactions: result.rows,
    })
  } catch (error) {
    logger.error('급여 거래 적요 업데이트 실패:', error)
    return json(
      {
        success: false,
        error: '급여 거래 적요 업데이트에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
