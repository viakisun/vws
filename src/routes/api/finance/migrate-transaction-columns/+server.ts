import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// finance_transactions 테이블에 누락된 컬럼들 추가
export const POST: RequestHandler = async () => {
  try {
    // 누락된 컬럼들 추가
    await query(`
      ALTER TABLE finance_transactions 
      ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100)
    `)

    await query(`
      ALTER TABLE finance_transactions 
      ADD COLUMN IF NOT EXISTS notes TEXT
    `)

    await query(`
      ALTER TABLE finance_transactions 
      ADD COLUMN IF NOT EXISTS tags TEXT[]
    `)

    await query(`
      ALTER TABLE finance_transactions 
      ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false
    `)

    await query(`
      ALTER TABLE finance_transactions 
      ADD COLUMN IF NOT EXISTS recurring_pattern TEXT
    `)

    return json({
      success: true,
      message: '거래 테이블 컬럼이 성공적으로 추가되었습니다.',
    })
  } catch (error) {
    logger.error('거래 테이블 컬럼 추가 실패:', error)
    return json(
      {
        success: false,
        error: `거래 테이블 컬럼 추가에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}
