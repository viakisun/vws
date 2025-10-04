import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async () => {
  try {
    // 운영통장 ID
    const operatingAccountId = '968ed1f6-1096-4cf5-9c5e-cbfcf846724e'

    // 특정 직원들의 거래를 직접 업데이트
    const employees = [
      '장한진',
      '이지후',
      '오현종',
      '정은지',
      '김대곤',
      '백승현',
      '김성호',
      '오경하',
      '김현영',
      '최현민',
      '이건희',
    ]

    let updatedCount = 0
    const updatedTransactions: any[] = []

    for (const employee of employees) {
      // 해당 직원의 거래 찾기
      const selectQuery = `
        SELECT id, description, counterparty, transaction_date
        FROM finance_transactions 
        WHERE account_id = $1
          AND counterparty = $2
          AND description NOT LIKE '%급여%'
        LIMIT 1
      `

      const selectResult = await query(selectQuery, [operatingAccountId, employee])

      if (selectResult.rows.length > 0) {
        const transaction = selectResult.rows[0]
        const transactionDate = new Date(transaction.transaction_date)
        const month = transactionDate.getMonth() + 1
        const newDescription = `${month}월급여-${employee}`

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
          counterparty: employee,
        })

        console.log(`Updated: ${transaction.description} -> ${newDescription}`)
      }
    }

    return json({
      success: true,
      message: `${updatedCount}개의 급여 거래 적요를 업데이트했습니다.`,
      updatedCount,
      updatedTransactions,
    })
  } catch (error) {
    console.error('급여 거래 적요 업데이트 실패:', error)
    return json(
      {
        success: false,
        error: '급여 거래 적요 업데이트에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
