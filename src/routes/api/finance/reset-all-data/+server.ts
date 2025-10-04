import { json } from '@sveltejs/kit'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  try {
    logger.info('재무 데이터 전체 초기화 시작')

    // 1. 모든 거래내역 삭제
    const deleteTransactions = await query('DELETE FROM finance_transactions')
    logger.info(`삭제된 거래내역: ${deleteTransactions.rowCount}건`)

    // 2. 모든 계좌 삭제 (외래키 제약으로 인해 거래내역 삭제 후)
    const deleteAccounts = await query('DELETE FROM finance_accounts')
    logger.info(`삭제된 계좌: ${deleteAccounts.rowCount}건`)

    // 3. 모든 카테고리 삭제
    const deleteCategories = await query('DELETE FROM finance_categories')
    logger.info(`삭제된 카테고리: ${deleteCategories.rowCount}건`)

    // 4. 모든 은행 삭제
    const deleteBanks = await query('DELETE FROM finance_banks')
    logger.info(`삭제된 은행: ${deleteBanks.rowCount}건`)

    // 5. 시퀀스 리셋 (UUID는 자동 생성되므로 필요 없음)
    logger.info('시퀀스 리셋 완료')

    logger.info('재무 데이터 전체 초기화 완료')

    return json({
      success: true,
      message: '재무 데이터 전체 초기화 완료',
      deletedCounts: {
        transactions: deleteTransactions.rowCount,
        accounts: deleteAccounts.rowCount,
        categories: deleteCategories.rowCount,
        banks: deleteBanks.rowCount
      }
    })

  } catch (error: any) {
    logger.error('재무 데이터 초기화 오류:', error)
    return json({
      success: false,
      message: '재무 데이터 초기화 실패',
      error: error.message
    }, { status: 500 })
  }
}
