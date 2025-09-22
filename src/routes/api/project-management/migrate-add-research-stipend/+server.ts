import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'

export async function POST() {
	try {
		console.log('🔄 연구수당 컬럼 추가 마이그레이션 시작...')

		// 1. project_budgets 테이블에 연구수당 컬럼 추가
		await query(`
			ALTER TABLE project_budgets 
			ADD COLUMN IF NOT EXISTS research_stipend DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS research_stipend_cash DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS research_stipend_in_kind DECIMAL(15,2) DEFAULT 0
		`)

		console.log('✅ 연구수당 컬럼 추가 완료')

		// 2. 기존 데이터의 연구수당 컬럼을 0으로 초기화
		await query(`
			UPDATE project_budgets 
			SET research_stipend = 0, 
			    research_stipend_cash = 0, 
			    research_stipend_in_kind = 0 
			WHERE research_stipend IS NULL 
			   OR research_stipend_cash IS NULL 
			   OR research_stipend_in_kind IS NULL
		`)

		console.log('✅ 기존 데이터 초기화 완료')

		// 3. 컬럼 추가 확인
		const columns = await query(`
			SELECT column_name, data_type, column_default 
			FROM information_schema.columns 
			WHERE table_name = 'project_budgets' 
			AND column_name LIKE '%research_stipend%'
			ORDER BY column_name
		`)

		console.log('📋 추가된 컬럼들:', columns.rows)

		return json({
			success: true,
			message: '연구수당 컬럼이 성공적으로 추가되었습니다.',
			addedColumns: columns.rows.map(row => ({
				name: row.column_name,
				type: row.data_type,
				default: row.column_default
			}))
		})
	} catch (error) {
		console.error('❌ 연구수당 컬럼 추가 실패:', error)

		return json(
			{
				success: false,
				message: '연구수당 컬럼 추가 중 오류가 발생했습니다.',
				error: error instanceof Error ? error.message : '알 수 없는 오류'
			},
			{ status: 500 }
		)
	}
}
