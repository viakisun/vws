import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

export const POST: RequestHandler = async () => {
  try {
    logger.info('📊 전문회계코드 필드 추가 시작...')

    // code 필드 추가 (전문회계코드)
    try {
      await query(`
        ALTER TABLE finance_categories 
        ADD COLUMN IF NOT EXISTS code VARCHAR(10)
      `)
      logger.info('✅ code 필드 추가 완료')
    } catch (error) {
      logger.info('ℹ️ code 필드가 이미 존재합니다.')
    }

    // account_code 필드 추가 (계정과목코드)
    try {
      await query(`
        ALTER TABLE finance_categories 
        ADD COLUMN IF NOT EXISTS account_code VARCHAR(20)
      `)
      logger.info('✅ account_code 필드 추가 완료')
    } catch (error) {
      logger.info('ℹ️ account_code 필드가 이미 존재합니다.')
    }

    // 인덱스 추가 (성능 최적화)
    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_finance_categories_code 
        ON finance_categories(code)
      `)
      logger.info('✅ code 인덱스 추가 완료')
    } catch (error) {
      logger.info('ℹ️ code 인덱스가 이미 존재합니다.')
    }

    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_finance_categories_account_code 
        ON finance_categories(account_code)
      `)
      logger.info('✅ account_code 인덱스 추가 완료')
    } catch (error) {
      logger.info('ℹ️ account_code 인덱스가 이미 존재합니다.')
    }

    return json({
      success: true,
      message: '전문회계코드 필드가 성공적으로 추가되었습니다.',
      addedFields: ['code', 'account_code'],
    })
  } catch (error) {
    logger.error('❌ 전문회계코드 필드 추가 실패:', error)
    return json(
      {
        success: false,
        message: '전문회계코드 필드 추가에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
