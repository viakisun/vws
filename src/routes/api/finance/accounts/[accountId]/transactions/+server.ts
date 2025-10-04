import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// DELETE: 특정 계좌의 모든 거래내역 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { accountId } = params

    if (!accountId) {
      return json({ success: false, message: '계좌 ID가 필요합니다.' }, { status: 400 })
    }

    // 계좌 존재 확인
    const accountResult = await query(
      'SELECT account_number, name FROM finance_accounts WHERE id = $1',
      [accountId],
    )
    if (accountResult.rows.length === 0) {
      return json({ success: false, message: '계좌를 찾을 수 없습니다.' }, { status: 404 })
    }

    const account = accountResult.rows[0]

    // 거래내역 개수 확인
    const countResult = await query(
      'SELECT COUNT(*) as count FROM finance_transactions WHERE account_id = $1',
      [accountId],
    )
    const transactionCount = parseInt(countResult.rows[0].count)

    // 거래내역 삭제
    await query('DELETE FROM finance_transactions WHERE account_id = $1', [accountId])
    logger.info(
      `계좌 ${account.account_number}의 모든 거래내역이 삭제되었습니다. (${transactionCount}건)`,
    )

    // 계좌 잔액을 0으로 초기화
    await query('UPDATE finance_accounts SET balance = 0 WHERE id = $1', [accountId])
    logger.info(`계좌 ${account.account_number}의 잔액이 0으로 초기화되었습니다.`)

    return json({
      success: true,
      message: `계좌 ${account.name} (${account.account_number})의 모든 거래내역이 삭제되고 잔액이 초기화되었습니다.`,
      deletedCount: transactionCount,
      accountName: account.name,
      accountNumber: account.account_number,
    })
  } catch (error: any) {
    logger.error('계좌 거래내역 삭제 및 초기화 오류:', error)
    return json(
      { success: false, message: '서버 오류 발생', error: error.message },
      { status: 500 },
    )
  }
}

// GET: 특정 계좌의 거래내역 통계
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { accountId } = params

    if (!accountId) {
      return json({ success: false, message: '계좌 ID가 필요합니다.' }, { status: 400 })
    }

    // 계좌 정보 조회
    const accountResult = await query(
      'SELECT id, name, account_number, balance FROM finance_accounts WHERE id = $1',
      [accountId],
    )

    if (accountResult.rows.length === 0) {
      return json({ success: false, message: '계좌를 찾을 수 없습니다.' }, { status: 404 })
    }

    const account = accountResult.rows[0]

    // 거래내역 통계 조회
    const statsResult = await query(
      `
      SELECT 
        COUNT(*) as transaction_count,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_withdrawals,
        MIN(transaction_date) as earliest_transaction,
        MAX(transaction_date) as latest_transaction
      FROM finance_transactions 
      WHERE account_id = $1
      `,
      [accountId],
    )

    const stats = statsResult.rows[0]

    return json({
      success: true,
      account: {
        id: account.id,
        name: account.name,
        accountNumber: account.account_number,
        balance: parseFloat(account.balance),
      },
      stats: {
        transactionCount: parseInt(stats.transaction_count),
        totalDeposits: parseFloat(stats.total_deposits || 0),
        totalWithdrawals: parseFloat(stats.total_withdrawals || 0),
        earliestTransaction: stats.earliest_transaction,
        latestTransaction: stats.latest_transaction,
      },
    })
  } catch (error: any) {
    logger.error('계좌 거래내역 통계 조회 오류:', error)
    return json(
      { success: false, message: '서버 오류 발생', error: error.message },
      { status: 500 },
    )
  }
}
