import { json } from '@sveltejs/kit'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import type { RequestHandler } from './$types'
import fs from 'fs'
import path from 'path'

export const POST: RequestHandler = async ({ request }) => {
  try {
    logger.info('새로운 거래내역표 스키마 생성 시작')

    // 스키마 SQL 파일 읽기
    const schemaPath = path.join(process.cwd(), 'migration-create-new-transaction-schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8')

    // SQL 문을 세미콜론으로 분리하여 실행
    const statements = schemaSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'))

    const results: Array<{ statement: string; success: boolean; result?: any; error?: string }> = []

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

    // 스키마 생성 결과 확인
    const checkResult = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'finance_transactions' 
      ORDER BY ordinal_position
    `)

    logger.info('새로운 거래내역표 스키마 생성 완료')

    return json({
      success: true,
      message: '새로운 거래내역표 스키마 생성 완료',
      schemaResults: results,
      tableColumns: checkResult.rows,
    })
  } catch (error: any) {
    logger.error('스키마 생성 오류:', error)
    return json(
      {
        success: false,
        message: '스키마 생성 실패',
        error: error.message,
      },
      { status: 500 },
    )
  }
}
