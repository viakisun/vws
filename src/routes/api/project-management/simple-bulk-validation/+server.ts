import {
	BudgetConsistencyValidator,
	PersonnelCostValidator,
	ValidationUtils
} from '$lib/utils/validation'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
	try {
		const autoFix = url.searchParams.get('autoFix') === 'true'

		console.log(`🔍 [일괄 검증] 모든 프로젝트 ${autoFix ? '자동 수정' : '검증'} 시작`)

		// 모든 활성 프로젝트 조회
		const projectsResult = await ValidationUtils.pool.query(
			'SELECT id, title FROM projects WHERE status = $1 ORDER BY created_at',
			['active']
		)

		const projects = projectsResult.rows
		console.log(`📋 총 ${projects.length}개 프로젝트 검증 시작`)

		const results = []
		let totalFixed = 0
		let totalIssues = 0
		let totalFixedIssues = 0

		// 각 프로젝트별 검증
		for (const project of projects) {
			console.log(`🔍 [${project.title}] 검증 시작`)

			try {
				const [budgets, members] = await Promise.all([
					ValidationUtils.getProjectBudgets(project.id),
					ValidationUtils.getProjectMembers(project.id)
				])

				const projectResult = {
					projectId: project.id,
					projectTitle: project.title,
					issues: [],
					fixes: []
				}

				// 1. 인건비 검증
				for (const budget of budgets) {
					const actualPersonnelCost = PersonnelCostValidator.calculateActualPersonnelCost(
						members,
						budget
					)
					const validation = PersonnelCostValidator.validatePersonnelCost(
						budget,
						actualPersonnelCost
					)

					if (!validation.isValid) {
						projectResult.issues.push({
							type: 'personnel_cost',
							period: budget.period_number,
							message: validation.message,
							details: validation.details
						})
						totalIssues++

						// 자동 수정
						if (autoFix) {
							const tolerance = 1000
							if (
								Math.abs((parseFloat(budget.personnel_cost) || 0) - actualPersonnelCost) > tolerance
							) {
								await ValidationUtils.pool.query(
									'UPDATE project_budgets SET personnel_cost = $1 WHERE id = $2',
									[actualPersonnelCost, budget.id]
								)

								projectResult.fixes.push({
									type: 'personnel_cost',
									period: budget.period_number,
									action: 'personnel_cost_updated',
									oldValue: parseFloat(budget.personnel_cost) || 0,
									newValue: actualPersonnelCost
								})
								totalFixedIssues++
							}
						}
					}
				}

				// 2. 예산 일관성 검증
				const projectInfo = await ValidationUtils.getProjectInfo(project.id)
				const budgetValidation = BudgetConsistencyValidator.validateBudgetConsistency(
					projectInfo,
					budgets
				)

				if (!budgetValidation.isValid) {
					projectResult.issues.push({
						type: 'budget_consistency',
						message: budgetValidation.message,
						details: budgetValidation.details
					})
					totalIssues++

					// 자동 수정
					if (autoFix) {
						const totalBudgetFromBudgets = budgets.reduce(
							(sum, budget) => sum + (parseFloat(budget.total_budget) || 0),
							0
						)

						await ValidationUtils.pool.query(
							'UPDATE projects SET budget_total = $1 WHERE id = $2',
							[totalBudgetFromBudgets, project.id]
						)

						projectResult.fixes.push({
							type: 'budget_consistency',
							action: 'project_budget_total_updated',
							oldValue: parseFloat(projectInfo.budget_total) || 0,
							newValue: totalBudgetFromBudgets
						})
						totalFixedIssues++
					}
				}

				// 수정이 있었으면 카운트
				if (projectResult.fixes.length > 0) {
					totalFixed++
				}

				results.push(projectResult)

				console.log(
					`  ✅ [${project.title}] 완료 - ${projectResult.issues.length}개 문제, ${projectResult.fixes.length}개 수정`
				)
			} catch (error) {
				console.error(`❌ [${project.title}] 검증 실패:`, error)
				results.push({
					projectId: project.id,
					projectTitle: project.title,
					error: error instanceof Error ? error.message : 'Unknown error',
					issues: [],
					fixes: []
				})
			}
		}

		console.log(
			`✅ [일괄 검증] 완료 - ${projects.length}개 프로젝트, ${totalIssues}개 문제, ${totalFixedIssues}개 수정`
		)

		return json({
			success: true,
			summary: {
				totalProjects: projects.length,
				fixedProjects: totalFixed,
				totalIssues: totalIssues,
				fixedIssues: totalFixedIssues
			},
			results,
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		console.error('Bulk validation error:', error)
		return json(ValidationUtils.createErrorResponse(error, '일괄 검증 중 오류가 발생했습니다.'), {
			status: 500
		})
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { autoFix = false } = await request.json()

		// GET 요청과 동일한 로직 실행
		const url = new URL('http://localhost/simple-bulk-validation')
		if (autoFix) {
			url.searchParams.set('autoFix', 'true')
		}

		return await GET({ url } as any)
	} catch (error) {
		console.error('Bulk validation error:', error)
		return json(ValidationUtils.createErrorResponse(error, '일괄 검증 중 오류가 발생했습니다.'), {
			status: 500
		})
	}
}
