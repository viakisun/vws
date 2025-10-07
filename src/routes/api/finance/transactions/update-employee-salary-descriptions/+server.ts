import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

export const POST: RequestHandler = async () => {
  try {
    // 운영통장 ID
    const operatingAccountId = '968ed1f6-1096-4cf5-9c5e-cbfcf846724e'

    // 직원 이름으로 된 거래들 조회 (한글 이름 패턴) - 조건 완화
    const selectQuery = `
      SELECT id, description, counterparty, transaction_date, amount
      FROM finance_transactions 
      WHERE account_id = $1
        AND description ~ '^[가-힣]{2,4}$'
        AND description NOT LIKE '%급여%'
      ORDER BY transaction_date DESC
    `

    const result = await query(selectQuery, [operatingAccountId])
    const transactions = result.rows

    logger.info(`Found ${transactions.length} potential employee transactions`)
    transactions.forEach((tx) => {
      logger.info(`- ${tx.description} (${tx.counterparty}) - ${tx.transaction_date}`)
    })

    let updatedCount = 0
    const updatedTransactions: any[] = []

    for (const transaction of transactions) {
      const { id, description, counterparty, transaction_date } = transaction

      // 거래일에서 월 추출
      const transactionDate = new Date(transaction_date)
      const month = transactionDate.getMonth() + 1

      // 새로운 적요 생성: "몇월급여-직원이름"
      const newDescription = `${month}월급여-${description}`

      // 업데이트 쿼리 실행
      const updateQuery = `
        UPDATE finance_transactions 
        SET description = $1 
        WHERE id = $2
      `

      await query(updateQuery, [newDescription, id])
      updatedCount++
      updatedTransactions.push({
        id: id,
        oldDescription: description,
        newDescription: newDescription,
        counterparty: counterparty,
        transactionDate: transaction_date,
      })

      logger.info(`Updated: ${description} -> ${newDescription}`)
    }

    return json({
      success: true,
      message: `${updatedCount}개의 직원 급여 거래 적요를 업데이트했습니다.`,
      updatedCount,
      updatedTransactions,
    })
  } catch (error) {
    logger.error('직원 급여 거래 적요 업데이트 실패:', error)
    return json(
      {
        success: false,
        error: '직원 급여 거래 적요 업데이트에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
