import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async () => {
  try {
    logger.log('Checking project_members table structure...')

    // 테이블 구조 확인
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'project_members' 
      ORDER BY ordinal_position
    `)

    logger.log('Current table structure:', tableInfo.rows)

    // cash_amount, in_kind_amount 컬럼이 있는지 확인
    const hasCashAmount = tableInfo.rows.some((row: any) => row.column_name === 'cash_amount')
    const hasInKindAmount = tableInfo.rows.some((row: any) => row.column_name === 'in_kind_amount')
    const hasContributionType = tableInfo.rows.some(
      (row: any) => row.column_name === 'contribution_type',
    )

    logger.log('Column check:', { hasCashAmount, hasInKindAmount, hasContributionType })

    if (!hasCashAmount || !hasInKindAmount) {
      // 현금/현물 금액 필드 추가
      await query(`
        ALTER TABLE project_members 
        ADD COLUMN IF NOT EXISTS cash_amount numeric(12,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS in_kind_amount numeric(12,2) DEFAULT 0
      `)
      logger.log('Added cash_amount and in_kind_amount columns')
    }

    if (hasContributionType) {
      // contribution_type 필드 제거
      await query(`
        ALTER TABLE project_members DROP COLUMN IF EXISTS contribution_type
      `)
      logger.log('Removed contribution_type column')
    }

    // 인덱스 추가 (성능 향상)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_project_members_cash_amount 
      ON project_members(cash_amount)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_project_members_in_kind_amount 
      ON project_members(in_kind_amount)
    `)

    logger.log('Added indexes for performance optimization')

    return json({
      success: true,
      message: 'project_members 테이블 구조 확인 및 업데이트가 완료되었습니다.',
      tableStructure: tableInfo.rows,
    })
  } catch (error) {
    logger.error('Migration check failed:', error)
    return json(
      {
        success: false,
        message: '테이블 구조 확인 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
