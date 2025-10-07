/**
 * Finance Migration API - Remove balance column
 * balance 컬럼 제거 마이그레이션
 */

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

export const POST: RequestHandler = async () => {
  try {
    logger.info('balance 컬럼 제거 마이그레이션 시작')

    // balance 컬럼 제거
    await query(`
			ALTER TABLE finance_accounts
			DROP COLUMN IF EXISTS balance;
		`)

    logger.info('balance 컬럼 제거 완료')

    return json({
      success: true,
      message: 'balance 컬럼이 성공적으로 제거되었습니다.',
    })
  } catch (error) {
    logger.error('마이그레이션 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    )
  }
}
