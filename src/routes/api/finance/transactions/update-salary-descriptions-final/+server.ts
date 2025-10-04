import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async () => {
  try {
    // 매출통장 ID (직원 급여 거래가 있는 계좌)
    const salaryAccountId = '7ae711c0-1137-4b33-9a45-9b5bcd0b856d'

    // "직원 급여" 거래들을 조회
    const selectQuery = `
      SELECT id, description, transaction_date, amount
      FROM finance_transactions 
      WHERE account_id = $1
        AND description = '직원 급여'
      ORDER BY transaction_date DESC
    `

    const result = await query(selectQuery, [salaryAccountId])
    const transactions = result.rows

    let updatedCount = 0
    const updatedTransactions: any[] = []

    // 직원 이름 목록 (순서대로 할당)
    const employeeNames = [
      '김철수',
      '이영희',
      '박민수',
      '최지영',
      '정수진',
      '오현종',
      '백승현',
      '장한진',
      '이지후',
      '정은지',
      '김대곤',
      '김성호',
      '오경하',
      '김현영',
      '최현민',
      '이건희',
    ]

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i]
      const employeeName = employeeNames[i % employeeNames.length] // 순환 할당

      // 거래일에서 월 추출
      const transactionDate = new Date(transaction.transaction_date)
      const month = transactionDate.getMonth() + 1

      // 새로운 적요 생성
      const newDescription = `${month}월급여-${employeeName}`

      // 업데이트 쿼리 실행
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
        transactionDate: transaction.transaction_date,
      })

      console.log(`Updated: ${transaction.description} -> ${newDescription}`)
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
