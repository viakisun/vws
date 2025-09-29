import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async () => {
  try {
    // 트랜잭션 시작
    await query('BEGIN')

    try {
      // 모든 계좌 조회
      const accountsResult = await query('SELECT id, name FROM finance_accounts')
      const accounts = accountsResult.rows

      const results: Array<{
        accountId: string
        accountName: string
        oldBalance: number
        newBalance: number
        transactionCount: number
      }> = []

      for (const account of accounts) {
        // 각 계좌의 모든 거래 조회
        const transactionsResult = await query(
          `
          SELECT amount, type 
          FROM finance_transactions 
          WHERE account_id = $1 AND status = 'completed'
          ORDER BY created_at
        `,
          [account.id],
        )

        const transactions = transactionsResult.rows

        // 거래 기반으로 잔액 계산
        let calculatedBalance = 0
        for (const transaction of transactions) {
          switch (transaction.type) {
            case 'income':
              calculatedBalance += parseFloat(transaction.amount)
              break
            case 'expense':
              calculatedBalance -= parseFloat(transaction.amount)
              break
            case 'transfer':
            case 'adjustment':
              // 이체와 조정은 잔액 변화 없음
              break
          }
        }

        // 계좌 잔액 업데이트
        await query('UPDATE finance_accounts SET balance = $1, updated_at = NOW() WHERE id = $2', [
          calculatedBalance,
          account.id,
        ])

        results.push({
          accountId: account.id,
          accountName: account.name,
          oldBalance: account.balance,
          newBalance: calculatedBalance,
          transactionCount: transactions.length,
        })
      }

      // 트랜잭션 커밋
      await query('COMMIT')

      return json({
        success: true,
        message: '모든 계좌 잔액이 거래 내역을 기반으로 재계산되었습니다.',
        results,
      })
    } catch (error) {
      // 트랜잭션 롤백
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('잔액 재계산 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '잔액 재계산에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
