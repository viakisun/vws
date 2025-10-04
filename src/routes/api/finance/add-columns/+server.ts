import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  try {
    logger.info('거래내역표 컬럼 추가 시작')

    const results: Array<{ column: string; success: boolean; error?: string }> = []

    // 1. 의뢰인/수취인 컬럼 추가
    try {
      await query(
        'ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS counterparty VARCHAR(255)',
      )
      results.push({ column: 'counterparty', success: true })
    } catch (error: any) {
      results.push({ column: 'counterparty', success: false, error: error.message })
    }

    // 2. 입금 컬럼 추가
    try {
      await query(
        'ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS deposits DECIMAL(15,2) DEFAULT 0',
      )
      results.push({ column: 'deposits', success: true })
    } catch (error: any) {
      results.push({ column: 'deposits', success: false, error: error.message })
    }

    // 3. 출금 컬럼 추가
    try {
      await query(
        'ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS withdrawals DECIMAL(15,2) DEFAULT 0',
      )
      results.push({ column: 'withdrawals', success: true })
    } catch (error: any) {
      results.push({ column: 'withdrawals', success: false, error: error.message })
    }

    // 4. 거래후잔액 컬럼 추가
    try {
      await query(
        'ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0',
      )
      results.push({ column: 'balance', success: true })
    } catch (error: any) {
      results.push({ column: 'balance', success: false, error: error.message })
    }

    // 컬럼 확인
    const checkResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'finance_transactions' 
      AND column_name IN ('counterparty', 'deposits', 'withdrawals', 'balance')
      ORDER BY column_name
    `)

    logger.info('거래내역표 컬럼 추가 완료')

    return json({
      success: true,
      message: '거래내역표 컬럼 추가 완료',
      results,
      newColumns: checkResult.rows,
    })
  } catch (error: any) {
    logger.error('컬럼 추가 오류:', error)
    return json(
      {
        success: false,
        message: '컬럼 추가 실패',
        error: error.message,
      },
      { status: 500 },
    )
  }
}
