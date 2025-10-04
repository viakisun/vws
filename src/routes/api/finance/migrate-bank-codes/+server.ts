import { json } from '@sveltejs/kit'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  try {
    logger.info('은행 코드 enum 마이그레이션 시작')

    // SQL 파일 읽기
    const fs = await import('fs/promises')
    const path = await import('path')
    const sqlPath = path.join(process.cwd(), 'migration-add-bank-codes.sql')
    const sqlContent = await fs.readFile(sqlPath, 'utf-8')

    // SQL 실행
    await query(sqlContent)

    // 결과 확인
    const banksResult = await query('SELECT id, name, bank_code FROM finance_banks ORDER BY bank_code')
    const accountsResult = await query('SELECT id, account_number, bank_code FROM finance_accounts WHERE bank_code IS NOT NULL')

    logger.info('은행 코드 enum 마이그레이션 완료')

    return json({
      success: true,
      message: '은행 코드 enum 마이그레이션 완료',
      banks: banksResult.rows,
      accounts: accountsResult.rows,
    })
  } catch (error: any) {
    logger.error('은행 코드 enum 마이그레이션 중 오류 발생:', error)
    return json({ 
      success: false, 
      message: '은행 코드 enum 마이그레이션 실패', 
      error: error.message 
    }, { status: 500 })
  }
}
