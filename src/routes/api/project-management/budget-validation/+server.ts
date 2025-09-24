import { BudgetConsistencyValidator, ValidationUtils } from '$lib/utils/validation'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId')

    if (!projectId) {
      return json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 })
    }

    logger.log(`🔍 [예산 일관성 검증] 프로젝트 ${projectId} 검증 시작`)

    // 프로젝트 기본 정보 및 예산 조회
    const [project, budgets] = await Promise.all([
      ValidationUtils.getProjectInfo(projectId),
      ValidationUtils.getProjectBudgets(projectId),
    ])

    logger.log(`📋 프로젝트: ${project.title}`)

    // 예산 일관성 검증
    const validation = BudgetConsistencyValidator.validateBudgetConsistency(project, budgets)

    const validationResults = [
      {
        validationType: 'budget_consistency',
        validation,
        details: {
          projectTotalBudget: parseFloat(project.budget_total) || 0,
          totalBudgetFromBudgets: budgets.reduce(
            (sum, budget) => sum + (parseFloat(budget.total_budget) || 0),
            0,
          ),
          budgetBreakdown: budgets.map((budget) => ({
            periodNumber: budget.period_number,
            fiscalYear: budget.period_number,
            totalBudget: parseFloat(budget.total_budget) || 0,
            personnelCost: parseFloat(budget.personnel_cost) || 0,
            researchMaterialCost: parseFloat(budget.research_material_cost) || 0,
            researchActivityCost: parseFloat(budget.research_activity_cost) || 0,
            indirectCost: parseFloat(budget.indirect_cost) || 0,
          })),
        },
      },
    ]

    // 전체 검증 결과 생성
    const overallValidation = ValidationUtils.createOverallValidation(validationResults)

    logger.log(`✅ [예산 일관성 검증] 완료 - ${validation.isValid ? '✅ 통과' : '❌ 실패'}`)

    return json(
      ValidationUtils.createValidationResponse(
        projectId,
        project.title,
        validationResults,
        overallValidation,
      ),
    )
  } catch (error) {
    logger.error('Budget validation error:', error)
    return json(
      ValidationUtils.createErrorResponse(error, '예산 일관성 검증 중 오류가 발생했습니다.'),
      { status: 500 },
    )
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { projectId, autoFix = false } = await request.json()

    if (!projectId) {
      return json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 })
    }

    logger.log(`🔧 [예산 일관성 검증] 프로젝트 ${projectId} ${autoFix ? '자동 수정' : '검증'} 시작`)

    // 프로젝트 기본 정보 및 예산 조회
    const [project, budgets] = await Promise.all([
      ValidationUtils.getProjectInfo(projectId),
      ValidationUtils.getProjectBudgets(projectId),
    ])

    logger.log(`📋 프로젝트: ${project.title}`)

    // 예산 일관성 검증
    const validation = BudgetConsistencyValidator.validateBudgetConsistency(project, budgets)

    const fixes = []

    // 자동 수정이 활성화되고 불일치가 있는 경우
    if (autoFix && !validation.isValid) {
      const totalBudgetFromBudgets = budgets.reduce(
        (sum, budget) => sum + (parseFloat(budget.total_budget) || 0),
        0,
      )

      // 프로젝트 총 예산을 연차별 예산 합계로 업데이트
      await ValidationUtils.pool.query('UPDATE projects SET budget_total = $1 WHERE id = $2', [
        totalBudgetFromBudgets,
        projectId,
      ])

      fixes.push({
        action: 'project_budget_total_updated',
        oldValue: parseFloat(project.budget_total) || 0,
        newValue: totalBudgetFromBudgets,
      })

      logger.log(
        `🔧 프로젝트 총 예산 수정: ${(parseFloat(project.budget_total) || 0).toLocaleString()}원 → ${totalBudgetFromBudgets.toLocaleString()}원`,
      )
    }

    const validationResults = [
      {
        validationType: 'budget_consistency',
        validation,
        details: {
          projectTotalBudget: parseFloat(project.budget_total) || 0,
          totalBudgetFromBudgets: budgets.reduce(
            (sum, budget) => sum + (parseFloat(budget.total_budget) || 0),
            0,
          ),
          budgetBreakdown: budgets.map((budget) => ({
            periodNumber: budget.period_number,
            fiscalYear: budget.period_number,
            totalBudget: parseFloat(budget.total_budget) || 0,
            personnelCost: parseFloat(budget.personnel_cost) || 0,
            researchMaterialCost: parseFloat(budget.research_material_cost) || 0,
            researchActivityCost: parseFloat(budget.research_activity_cost) || 0,
            indirectCost: parseFloat(budget.indirect_cost) || 0,
          })),
        },
        fixed: autoFix && !validation.isValid,
      },
    ]

    // 전체 검증 결과 생성
    const overallValidation = ValidationUtils.createOverallValidation(validationResults)

    logger.log(
      `✅ [예산 일관성 검증] 완료 - ${validation.isValid ? '✅ 통과' : '❌ 실패'}${fixes.length > 0 ? `, ${fixes.length}개 수정` : ''}`,
    )

    return json({
      ...ValidationUtils.createValidationResponse(
        projectId,
        project.title,
        validationResults,
        overallValidation,
      ),
      fixes: fixes.length > 0 ? fixes : undefined,
    })
  } catch (error) {
    logger.error('Budget validation error:', error)
    return json(
      ValidationUtils.createErrorResponse(error, '예산 일관성 검증 중 오류가 발생했습니다.'),
      { status: 500 },
    )
  }
}
