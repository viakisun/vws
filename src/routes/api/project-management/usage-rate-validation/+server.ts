import { UsageRateValidator, ValidationUtils } from '$lib/utils/validation'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
	try {
		const projectId = url.searchParams.get('projectId')

		if (!projectId) {
			return json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 })
		}

		console.log(`🔍 [사용률 검증] 프로젝트 ${projectId} 검증 시작`)

		// 프로젝트 기본 정보, 예산, 증빙 항목 조회
		const [project, budgets, evidenceItems] = await Promise.all([
			ValidationUtils.getProjectInfo(projectId),
			ValidationUtils.getProjectBudgets(projectId),
			ValidationUtils.getEvidenceItems(projectId)
		])

		console.log(`📋 프로젝트: ${project.title}`)

		const validationResults = []

		// 각 연차별 사용률 검증
		for (const budget of budgets) {
			const validation = UsageRateValidator.validateUsageRate(budget, evidenceItems)

			validationResults.push({
				periodNumber: budget.period_number,
				fiscalYear: budget.fiscal_year,
				period: `${budget.start_date} ~ ${budget.end_date}`,
				validation,
				details: {
					totalBudget: parseFloat(budget.total_budget) || 0,
					spentAmount: parseFloat(budget.spent_amount) || 0,
					overallUsageRate:
						(parseFloat(budget.total_budget) || 0) > 0
							? ((parseFloat(budget.spent_amount) || 0) / (parseFloat(budget.total_budget) || 0)) *
								100
							: 0,
					categoryBreakdown: {
						personnel: {
							budget: parseFloat(budget.personnel_cost) || 0,
							spent: evidenceItems
								.filter(
									item =>
										item.period_number === budget.period_number && item.category_name === '인건비'
								)
								.reduce((sum, item) => sum + (parseFloat(item.spent_amount) || 0), 0)
						},
						material: {
							budget: parseFloat(budget.research_material_cost) || 0,
							spent: evidenceItems
								.filter(
									item =>
										item.period_number === budget.period_number && item.category_name === '재료비'
								)
								.reduce((sum, item) => sum + (parseFloat(item.spent_amount) || 0), 0)
						},
						activity: {
							budget: parseFloat(budget.research_activity_cost) || 0,
							spent: evidenceItems
								.filter(
									item =>
										item.period_number === budget.period_number &&
										item.category_name === '연구활동비'
								)
								.reduce((sum, item) => sum + (parseFloat(item.spent_amount) || 0), 0)
						},
						indirect: {
							budget: parseFloat(budget.indirect_cost) || 0,
							spent: evidenceItems
								.filter(
									item =>
										item.period_number === budget.period_number && item.category_name === '간접비'
								)
								.reduce((sum, item) => sum + (parseFloat(item.spent_amount) || 0), 0)
						}
					}
				}
			})

			console.log(
				`  ${budget.period_number}차년도: ${validation.isValid ? '✅' : '❌'} ${validation.message}`
			)
		}

		// 전체 검증 결과 생성
		const overallValidation = ValidationUtils.createOverallValidation(validationResults)

		console.log(
			`✅ [사용률 검증] 완료 - ${overallValidation.validItems}/${overallValidation.totalItems}개 연차 검증 통과`
		)

		return json(
			ValidationUtils.createValidationResponse(
				projectId,
				project.title,
				validationResults,
				overallValidation
			)
		)
	} catch (error) {
		console.error('Usage rate validation error:', error)
		return json(ValidationUtils.createErrorResponse(error, '사용률 검증 중 오류가 발생했습니다.'), {
			status: 500
		})
	}
}
