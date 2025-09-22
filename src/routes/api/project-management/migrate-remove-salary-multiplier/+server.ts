import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'

export async function POST() {
	try {
		console.log('🔄 급여 배수 제거 마이그레이션 시작...')

		// global_factors 테이블에서 salary_multiplier 제거
		const deleteResult = await query(`
			DELETE FROM global_factors 
			WHERE factor_name = 'salary_multiplier'
		`)

		console.log('✅ 급여 배수 제거 완료')

		// 제거 확인
		const checkResult = await query(`
			SELECT factor_name, factor_value, description 
			FROM global_factors 
			WHERE factor_name = 'salary_multiplier'
		`)

		console.log('📋 제거 확인 결과:', checkResult.rows)

		return json({
			success: true,
			message: '급여 배수가 성공적으로 제거되었습니다.',
			deletedRows: deleteResult.rowCount,
			remainingSalaryMultiplier: checkResult.rows.length
		})
	} catch (error) {
		console.error('❌ 급여 배수 제거 실패:', error)

		return json(
			{
				success: false,
				message: '급여 배수 제거 중 오류가 발생했습니다.',
				error: error instanceof Error ? error.message : '알 수 없는 오류'
			},
			{ status: 500 }
		)
	}
}
