import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import { logger } from '$lib/utils/logger';

export async function POST() {
  try {
    logger.log('🔄 참여율 컬럼을 DECIMAL로 변경하는 마이그레이션 시작...')

    // 1. project_members 테이블의 participation_rate 컬럼 변경
    await query(`
			ALTER TABLE project_members 
			ALTER COLUMN participation_rate TYPE DECIMAL(5,2)
		`)
    logger.log('✅ project_members.participation_rate 변경 완료')

    // 2. 기존 데이터의 participation_rate를 소수점 2자리로 정규화
    await query(`
			UPDATE project_members 
			SET participation_rate = ROUND(participation_rate, 2)
			WHERE participation_rate IS NOT NULL
		`)

    logger.log('✅ 기존 데이터 정규화 완료')

    // 5. 컬럼 변경 확인
    const columns = await query(`
			SELECT 
				table_name,
				column_name,
				data_type,
				numeric_precision,
				numeric_scale
			FROM information_schema.columns 
			WHERE column_name = 'participation_rate'
			ORDER BY table_name
		`)

    logger.log('📋 변경된 컬럼들:', columns.rows)

    return json({
      success: true,
      message: '참여율 컬럼이 성공적으로 DECIMAL(5,2)로 변경되었습니다.',
      updatedColumns: columns.rows.map(row => ({
        table: row.table_name,
        column: row.column_name,
        type: row.data_type,
        precision: row.numeric_precision,
        scale: row.numeric_scale
      }))
    })
  } catch (error) {
    logger.error('❌ 참여율 컬럼 변경 실패:', error)

    return json(
      {
        success: false,
        message: '참여율 컬럼 변경 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}
