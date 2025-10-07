import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 계좌 테이블에서 balance 필드 제거
export const POST: RequestHandler = async () => {
  try {
    logger.info('🔥 계좌 테이블에서 balance 필드 제거 시작...')

    // finance_accounts 테이블에서 balance 컬럼 제거
    await query('ALTER TABLE finance_accounts DROP COLUMN IF EXISTS balance')

    logger.info('🔥 balance 컬럼 제거 완료')

    return json({
      success: true,
      message:
        '계좌 테이블에서 balance 필드가 제거되었습니다. 이제 거래 내역의 최신 balance를 사용합니다.',
    })
  } catch (error) {
    logger.error('balance 필드 제거 실패:', error)
    return json(
      {
        success: false,
        error: 'balance 필드 제거에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
