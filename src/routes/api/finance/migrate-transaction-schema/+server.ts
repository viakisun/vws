import { json } from '@sveltejs/kit'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import type { RequestHandler } from './$types'
import fs from 'fs'
import path from 'path'

export const POST: RequestHandler = async ({ request }) => {
  try {
    logger.info('거래내역표 스키마 마이그레이션 시작')

    // 마이그레이션 SQL 파일 읽기
    const migrationPath = path.join(process.cwd(), 'migration-update-transaction-schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // SQL 문을 세미콜론으로 분리하여 실행
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'))

    const results = []

    for (const statement of statements) {
      try {
        logger.info(`실행 중: ${statement.substring(0, 100)}...`)
        const result = await query(statement)
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: true,
          result: result.rows || result.rowCount || 'OK',
        })
      } catch (error: any) {
        logger.error(`SQL 실행 오류: ${error.message}`)
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: false,
          error: error.message,
        })
      }
    }

    // 마이그레이션 결과 확인
    const checkResult = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'finance_transactions' 
      AND column_name IN ('counterparty', 'deposits', 'withdrawals', 'balance')
      ORDER BY column_name
    `)

    logger.info('거래내역표 스키마 마이그레이션 완료')

    return json({
      success: true,
      message: '거래내역표 스키마 마이그레이션 완료',
      migrationResults: results,
      newColumns: checkResult.rows,
    })
  } catch (error: any) {
    logger.error('마이그레이션 오류:', error)
    return json(
      {
        success: false,
        message: '마이그레이션 실패',
        error: error.message,
      },
      { status: 500 },
    )
  }
}
