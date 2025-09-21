import { PersonnelCostConsistencyValidator } from '$lib/utils/personnel-cost-consistency-validator'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
	try {
		const projectId = url.searchParams.get('projectId')
		const periodNumber = url.searchParams.get('periodNumber')
		const autoFix = url.searchParams.get('autoFix') === 'true'

		if (!projectId) {
			return json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 })
		}

		console.log(
			`🔍 [인건비 일관성 검증] 프로젝트: ${projectId}, 연차: ${periodNumber || '전체'}, 자동수정: ${autoFix}`
		)

		if (autoFix) {
			// 자동 수정 실행
			const result = await PersonnelCostConsistencyValidator.autoFixPersonnelCostConsistency(
				projectId,
				periodNumber ? parseInt(periodNumber) : undefined
			)

			return json({
				success: result.success,
				message: result.message,
				fixedIssues: result.fixedIssues,
				generatedAt: new Date().toISOString()
			})
		} else {
			// 검증만 실행
			const validation = await PersonnelCostConsistencyValidator.validatePersonnelCostConsistency(
				projectId,
				periodNumber ? parseInt(periodNumber) : undefined
			)

			return json({
				success: true,
				isValid: validation.isValid,
				issues: validation.issues,
				warnings: validation.warnings,
				details: validation.details,
				generatedAt: new Date().toISOString()
			})
		}
	} catch (error) {
		console.error('❌ [인건비 일관성 검증] 오류:', error)
		return json(
			{
				success: false,
				error: '인건비 일관성 검증 중 오류가 발생했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}




