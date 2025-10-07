import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// finance_transactions 테이블에 status 컬럼 추가
export const POST: RequestHandler = async () => {
  try {
    // status 컬럼 추가
    await query(`
      ALTER TABLE finance_transactions 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed'
    `)

    // 기존 데이터의 status를 'completed'로 업데이트
    await query(`
      UPDATE finance_transactions 
      SET status = 'completed' 
      WHERE status IS NULL
    `)

    return json({
      success: true,
      message: 'Status 컬럼이 성공적으로 추가되었습니다.',
    })
  } catch (error) {
    logger.error('Status 컬럼 추가 실패:', error)
    return json(
      {
        success: false,
        error: `Status 컬럼 추가에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}
