import { PersonnelCostValidator, ValidationUtils } from '$lib/utils/validation'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
	try {
		const projectId = url.searchParams.get('projectId')

		if (!projectId) {
			return json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 })
		}

		console.log(`🔍 [인건비 검증] 프로젝트 ${projectId} 검증 시작`)

		// 프로젝트 기본 정보 조회
		const project = await ValidationUtils.getProjectInfo(projectId)
		console.log(`📋 프로젝트: ${project.title}`)

		// 프로젝트 예산 및 참여연구원 조회
		const [budgets, members] = await Promise.all([
			ValidationUtils.getProjectBudgets(projectId),
			ValidationUtils.getProjectMembers(projectId)
		])

		const validationResults = []

		// 각 연차별 인건비 검증
		for (const budget of budgets) {
			// 실제 인건비 계산
			const actualPersonnelCost = PersonnelCostValidator.calculateActualPersonnelCost(
				members,
				budget
			)

			// 인건비 검증
			const validation = PersonnelCostValidator.validatePersonnelCost(budget, actualPersonnelCost)

			// 해당 연차에 참여하는 연구원 필터링 (UTC 기준)
			const budgetStartUtc = new Date(budget.start_date + 'T00:00:00.000Z')
			const budgetEndUtc = new Date(budget.end_date + 'T23:59:59.999Z')
			const relevantMembers = members.filter(member => {
				const memberStartUtc = new Date(member.start_date + 'T00:00:00.000Z')
				const memberEndUtc = new Date(member.end_date + 'T23:59:59.999Z')
				return ValidationUtils.isDateRangeOverlap(
					memberStartUtc,
					memberEndUtc,
					budgetStartUtc,
					budgetEndUtc
				)
			})

			validationResults.push({
				periodNumber: budget.period_number,
				fiscalYear: budget.fiscal_year,
				period: `${budget.start_date} ~ ${budget.end_date}`,
				budgetedPersonnelCost: parseFloat(budget.personnel_cost) || 0,
				actualPersonnelCost,
				difference: Math.abs((parseFloat(budget.personnel_cost) || 0) - actualPersonnelCost),
				validation,
				members: relevantMembers.map(member => ({
					id: member.id,
					name: `${member.first_name} ${member.last_name}`,
					role: member.role,
					participationRate: member.participation_rate,
					monthlyAmount: member.monthly_amount,
					participationPeriod: `${member.start_date} ~ ${member.end_date}`
				}))
			})

			console.log(
				`  ${budget.period_number}차년도: ${validation.isValid ? '✅' : '❌'} 예산 ${(parseFloat(budget.personnel_cost) || 0).toLocaleString()}원 vs 실제 ${actualPersonnelCost.toLocaleString()}원`
			)
		}

		// 전체 검증 결과 생성
		const overallValidation = ValidationUtils.createOverallValidation(validationResults)

		console.log(
			`✅ [인건비 검증] 완료 - ${overallValidation.validItems}/${overallValidation.totalItems}개 연차 검증 통과`
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
		console.error('Personnel cost validation error:', error)
		return json(ValidationUtils.createErrorResponse(error, '인건비 검증 중 오류가 발생했습니다.'), {
			status: 500
		})
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { projectId, autoFix = false } = await request.json()

		if (!projectId) {
			return json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 })
		}

		console.log(`🔧 [인건비 검증] 프로젝트 ${projectId} ${autoFix ? '자동 수정' : '검증'} 시작`)

		// 프로젝트 기본 정보 조회
		const project = await ValidationUtils.getProjectInfo(projectId)
		console.log(`📋 프로젝트: ${project.title}`)

		// 프로젝트 예산 및 참여연구원 조회
		const [budgets, members] = await Promise.all([
			ValidationUtils.getProjectBudgets(projectId),
			ValidationUtils.getProjectMembers(projectId)
		])

		const validationResults = []
		const fixes = []

		// 각 연차별 인건비 검증 및 수정
		for (const budget of budgets) {
			// 실제 인건비 계산
			const actualPersonnelCost = PersonnelCostValidator.calculateActualPersonnelCost(
				members,
				budget
			)

			// 인건비 검증
			const validation = PersonnelCostValidator.validatePersonnelCost(budget, actualPersonnelCost)

			// 자동 수정이 활성화되고 불일치가 있는 경우
			if (autoFix && !validation.isValid) {
				const tolerance = 1000
				if (Math.abs((parseFloat(budget.personnel_cost) || 0) - actualPersonnelCost) > tolerance) {
					// 예산 인건비를 실제 계산된 인건비로 업데이트
					await ValidationUtils.pool.query(
						'UPDATE project_budgets SET personnel_cost = $1 WHERE id = $2',
						[actualPersonnelCost, budget.id]
					)

					fixes.push({
						periodNumber: budget.period_number,
						oldValue: parseFloat(budget.personnel_cost) || 0,
						newValue: actualPersonnelCost,
						action: 'personnel_cost_updated'
					})

					console.log(
						`  🔧 ${budget.period_number}차년도 인건비 수정: ${(parseFloat(budget.personnel_cost) || 0).toLocaleString()}원 → ${actualPersonnelCost.toLocaleString()}원`
					)
				}
			}

			validationResults.push({
				periodNumber: budget.period_number,
				fiscalYear: budget.fiscal_year,
				period: `${budget.start_date} ~ ${budget.end_date}`,
				budgetedPersonnelCost: parseFloat(budget.personnel_cost) || 0,
				actualPersonnelCost,
				difference: Math.abs((parseFloat(budget.personnel_cost) || 0) - actualPersonnelCost),
				validation,
				fixed: autoFix && !validation.isValid
			})
		}

		// 전체 검증 결과 생성
		const overallValidation = ValidationUtils.createOverallValidation(validationResults)

		console.log(
			`✅ [인건비 검증] 완료 - ${overallValidation.validItems}/${overallValidation.totalItems}개 연차 검증 통과${fixes.length > 0 ? `, ${fixes.length}개 수정` : ''}`
		)

		return json({
			...ValidationUtils.createValidationResponse(
				projectId,
				project.title,
				validationResults,
				overallValidation
			),
			fixes: fixes.length > 0 ? fixes : undefined
		})
	} catch (error) {
		console.error('Personnel cost validation error:', error)
		return json(ValidationUtils.createErrorResponse(error, '인건비 검증 중 오류가 발생했습니다.'), {
			status: 500
		})
	}
}
