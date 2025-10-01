import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// POST /api/project-management/setup-restore-history - 복구 이력 테이블 생성
export const POST: RequestHandler = async () => {
  try {
    logger.log('🔄 연구개발비 복구 이력 테이블 생성 시작...')

    // 복구 이력 테이블 생성
    await query(`
			CREATE TABLE IF NOT EXISTS budget_restore_history (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				budget_id UUID REFERENCES project_budgets(id) ON DELETE CASCADE,
				restore_reason TEXT NOT NULL,
				restored_by VARCHAR(255) NOT NULL,
				restored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				personnel_cost DECIMAL(15,2) DEFAULT 0,
				research_material_cost DECIMAL(15,2) DEFAULT 0,
				research_activity_cost DECIMAL(15,2) DEFAULT 0,
				research_stipend DECIMAL(15,2) DEFAULT 0,
				indirect_cost DECIMAL(15,2) DEFAULT 0,
				total_budget DECIMAL(15,2) DEFAULT 0,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)

    logger.log('✅ 복구 이력 테이블 생성 완료')

    // 테이블 구조 확인
    const columns = await query(`
			SELECT column_name, data_type, column_default
			FROM information_schema.columns
			WHERE table_name = 'budget_restore_history'
			ORDER BY ordinal_position
		`)

    const columnData = columns.rows as Array<{ column_name: string; data_type: string; column_default: string | null }>

    return json({
      success: true,
      message: '연구개발비 복구 이력 테이블이 성공적으로 생성되었습니다.',
      tableStructure: columnData.map((row) => ({
        name: row.column_name,
        type: row.data_type,
        default: row.column_default,
      })),
    })
  } catch (error) {
    logger.error('❌ 복구 이력 테이블 생성 실패:', error)

    return json(
      {
        success: false,
        message: '복구 이력 테이블 생성 중 오류가 발생했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
