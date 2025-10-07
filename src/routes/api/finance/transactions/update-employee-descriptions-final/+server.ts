import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

export const POST: RequestHandler = async () => {
  try {
    // 운영통장 ID
    const operatingAccountId = '968ed1f6-1096-4cf5-9c5e-cbfcf846724e'

    // 이미지에서 본 직원 이름들
    const employeeNames = ['최제윤', '오현아', '김성호', '장영아', '최현미']

    let updatedCount = 0
    const updatedTransactions: any[] = []

    for (const employeeName of employeeNames) {
      // 해당 직원의 거래 찾기
      const selectQuery = `
        SELECT id, description, counterparty, transaction_date
        FROM finance_transactions 
        WHERE account_id = $1
          AND description = $2
        LIMIT 1
      `

      const selectResult = await query(selectQuery, [operatingAccountId, employeeName])

      if (selectResult.rows.length > 0) {
        const transaction = selectResult.rows[0]
        const transactionDate = new Date(transaction.transaction_date)
        const month = transactionDate.getMonth() + 1
        const newDescription = `${month}월급여-${employeeName}`

        // 업데이트
        const updateQuery = `
          UPDATE finance_transactions 
          SET description = $1 
          WHERE id = $2
        `

        await query(updateQuery, [newDescription, transaction.id])
        updatedCount++
        updatedTransactions.push({
          id: transaction.id,
          oldDescription: transaction.description,
          newDescription: newDescription,
          counterparty: transaction.counterparty,
          transactionDate: transaction.transaction_date,
        })

        logger.info(`Updated: ${transaction.description} -> ${newDescription}`)
      } else {
        logger.info(`No transaction found for employee: ${employeeName}`)
      }
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
