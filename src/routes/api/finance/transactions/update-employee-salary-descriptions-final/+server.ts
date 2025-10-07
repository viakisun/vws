import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

export const POST: RequestHandler = async () => {
  try {
    // 운영통장 ID
    const operatingAccountId = '968ed1f6-1096-4cf5-9c4e-cbfcf846724e'

    // 먼저 업데이트할 거래들을 확인
    const selectQuery = `
			SELECT id, description, transaction_date, counterparty
			FROM finance_transactions 
			WHERE account_id = $1 
			AND description ~ '^[가-힣]{2,4}$'
			AND description NOT LIKE '%급여%'
			AND description NOT IN ('결산이자', '예금이자', '전기세', '거래내역', '신한카드', '롯데렌탈')
			ORDER BY transaction_date DESC
		`

    logger.info('🔍 업데이트할 거래 조회 중...')
    const selectResult = await query(selectQuery, [operatingAccountId])
    logger.info(`📊 조회된 거래 수: ${selectResult.rows.length}`)

    if (selectResult.rows.length === 0) {
      return json({
        success: true,
        message: '업데이트할 거래가 없습니다.',
        updatedCount: 0,
      })
    }

    // 각 거래의 description을 "몇월급여-직원이름" 형식으로 업데이트
    let updatedCount = 0
    const updateResults: any[] = []

    for (const row of selectResult.rows) {
      const transactionDate = new Date(row.transaction_date)
      const month = transactionDate.getMonth() + 1 // 0-based month
      const employeeName = row.description
      const newDescription = `${month}월급여-${employeeName}`

      const updateQuery = `
				UPDATE finance_transactions 
				SET description = $1
				WHERE id = $2
			`

      try {
        await query(updateQuery, [newDescription, row.id])
        updatedCount++
        updateResults.push({
          id: row.id,
          oldDescription: row.description,
          newDescription: newDescription,
          transactionDate: row.transaction_date,
        })
        logger.info(`✅ 업데이트: ${row.description} → ${newDescription}`)
      } catch (error) {
        logger.error(`❌ 업데이트 실패 (${row.id}):`, error)
      }
    }

    return json({
      success: true,
      message: `${updatedCount}건의 직원 급여 거래 description을 업데이트했습니다.`,
      updatedCount,
      results: updateResults,
    })
  } catch (error) {
    logger.error('❌ 직원 급여 description 업데이트 실패:', error)
    return json(
      {
        success: false,
        message: '직원 급여 description 업데이트에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
