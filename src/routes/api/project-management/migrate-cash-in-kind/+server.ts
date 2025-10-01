import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async () => {
  try {
    logger.log('Starting project_members table migration...')

    // 1. 현금/현물 금액 필드 추가
    await query(`
      ALTER TABLE project_members 
      ADD COLUMN IF NOT EXISTS cash_amount numeric(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS in_kind_amount numeric(12,2) DEFAULT 0
    `)

    logger.log('Added cash_amount and in_kind_amount columns')

    // 2. 기존 contribution_type 데이터를 새로운 필드로 마이그레이션
    await query(`
      UPDATE project_members 
      SET cash_amount = monthly_amount 
      WHERE contribution_type = 'cash' AND monthly_amount > 0
    `)

    await query(`
      UPDATE project_members 
      SET in_kind_amount = monthly_amount 
      WHERE contribution_type = 'in_kind' AND monthly_amount > 0
    `)

    logger.log('Migrated existing contribution_type data to new columns')

    // 3. contribution_type 필드 제거
    await query(`
      ALTER TABLE project_members DROP COLUMN IF EXISTS contribution_type
    `)

    logger.log('Removed contribution_type column')

    // 4. 인덱스 추가 (성능 향상)
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
      message: 'project_members 테이블 마이그레이션이 성공적으로 완료되었습니다.',
    })
  } catch (error) {
    logger.error('Migration failed:', error)
    return json(
      {
        success: false,
        message: '마이그레이션 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
