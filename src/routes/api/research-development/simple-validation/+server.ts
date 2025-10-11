import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface ValidationResult {
  validationType: string
  hasIssues: boolean
  issues: unknown[]
  message: string
}

interface ValidationResponse {
  success: boolean
  results: ValidationResult[]
  errors: string[]
  fixedIssues: number
}

interface PersonnelCostIssue {
  periodNumber: number
  budgetPersonnelCost: number
  actualPersonnelCost: number
  difference: number
  periodId: string
}

interface BudgetConsistencyIssue {
  projectTotal: number
  budgetSum: number
  difference: number
}

interface ProjectBudget {
  id: string
  project_id: string
  period_number: number
  start_date: string
  end_date: string
  personnel_cost: string
  total_budget: string
  [key: string]: unknown
}

interface ProjectMember {
  id: string
  project_id: string
  employee_id: string
  start_date: string
  end_date: string
  monthly_amount: string
  participation_rate: string
  first_name: string
  last_name: string
  [key: string]: unknown
}

interface Project {
  id: string
  budget_total: string
  [key: string]: unknown
}

// 간단한 프로젝트 검증 함수
async function validateProject(projectId: string): Promise<ValidationResponse> {
  const results: ValidationResult[] = []
  const errors: string[] = []
  let fixedIssues = 0

  try {
    logger.log(`🔍 [간단 검증] 프로젝트 검증 시작: ${projectId}`)

    await query('BEGIN')

    // 1. 인건비 검증 및 수정
    logger.log('🔍 [인건비 검증] 시작')
    const personnelResult = await validatePersonnelCost(projectId)
    results.push(personnelResult)

    if (personnelResult.hasIssues) {
      logger.log('🔧 [인건비 수정] 자동 수정 시작')
      const fixResult = await fixPersonnelCost(projectId, personnelResult.issues)
      if (fixResult.success) {
        fixedIssues += fixResult.fixedCount
        logger.log(`✅ [인건비 수정] 완료: ${fixResult.fixedCount}개 연차 수정`)
      } else {
        errors.push(`인건비 수정 실패: ${fixResult.error}`)
      }
    }

    // 2. 예산 일관성 검증 및 수정
    logger.log('🔍 [예산 일관성 검증] 시작')
    const budgetResult = await validateBudgetConsistency(projectId)
    results.push(budgetResult)

    if (budgetResult.hasIssues) {
      logger.log('🔧 [예산 일관성 수정] 자동 수정 시작')
      const fixResult = await fixBudgetConsistency(projectId, budgetResult.issues)
      if (fixResult.success) {
        fixedIssues += fixResult.fixedCount
        logger.log(`✅ [예산 일관성 수정] 완료: ${fixResult.fixedCount}개 이슈 수정`)
      } else {
        errors.push(`예산 일관성 수정 실패: ${fixResult.error}`)
      }
    }

    await query('COMMIT')
    logger.log(`✅ [간단 검증] 완료 - ${fixedIssues}개 이슈 수정됨`)

    return {
      success: errors.length === 0,
      results: results,
      errors: errors,
      fixedIssues: fixedIssues,
    }
  } catch (error: unknown) {
    await query('ROLLBACK')
    const errorMsg = `프로젝트 검증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    logger.error(`💥 ${errorMsg}`)
    errors.push(errorMsg)

    return {
      success: false,
      results: results,
      errors: errors,
      fixedIssues: fixedIssues,
    }
  }
}

// 인건비 검증
async function validatePersonnelCost(projectId: string): Promise<ValidationResult> {
  const budgetResult = await query<ProjectBudget>(
    `
		SELECT * FROM project_budgets 
		WHERE project_id = $1 
		ORDER BY period_number
	`,
    [projectId],
  )

  const memberResult = await query<ProjectMember>(
    `
		SELECT pm.*, e.first_name, e.last_name
		FROM project_members pm
		LEFT JOIN employees e ON pm.employee_id = e.id
		WHERE pm.project_id = $1
		ORDER BY pm.start_date
	`,
    [projectId],
  )

  const issues: PersonnelCostIssue[] = []

  for (const budget of budgetResult.rows) {
    const budgetStartDate = new Date(budget.start_date)
    const budgetEndDate = new Date(budget.end_date)

    // 해당 연차에 참여하는 연구원들 필터링
    const periodMembers = memberResult.rows.filter((member) => {
      const memberStartDate = new Date(member.start_date)
      const memberEndDate = new Date(member.end_date)
      return memberStartDate <= budgetEndDate && memberEndDate >= budgetStartDate
    })

    // 실제 인건비 계산
    let actualPersonnelCost = 0
    for (const member of periodMembers) {
      const memberStartDate = new Date(member.start_date)
      const memberEndDate = new Date(member.end_date)

      const actualStartDate = memberStartDate > budgetStartDate ? memberStartDate : budgetStartDate
      const actualEndDate = memberEndDate < budgetEndDate ? memberEndDate : budgetEndDate

      const monthsDiff =
        (actualEndDate.getFullYear() - actualStartDate.getFullYear()) * 12 +
        (actualEndDate.getMonth() - actualStartDate.getMonth()) +
        1

      const monthlyAmount = parseFloat(member.monthly_amount) || 0
      const participationRate = parseFloat(member.participation_rate) || 0

      actualPersonnelCost += monthlyAmount * monthsDiff * (participationRate / 100)
    }

    const budgetPersonnelCost = parseFloat(budget.personnel_cost) || 0
    const difference = Math.abs(actualPersonnelCost - budgetPersonnelCost)

    if (difference > 1000) {
      // 1000원 허용 오차
      issues.push({
        periodNumber: budget.period_number,
        budgetPersonnelCost: budgetPersonnelCost,
        actualPersonnelCost: actualPersonnelCost,
        difference: difference,
        periodId: budget.id,
      })
    }
  }

  return {
    validationType: 'personnel_cost',
    hasIssues: issues.length > 0,
    issues: issues,
    message:
      issues.length > 0 ? `${issues.length}개 연차에서 인건비 불일치 발견` : '인건비 검증 통과',
  }
}

// 예산 일관성 검증
async function validateBudgetConsistency(projectId: string): Promise<ValidationResult> {
  const projectResult = await query<Project>(
    'SELECT budget_total FROM rd_rd_projects WHERE id = $1',
    [projectId],
  )
  const budgetResult = await query<{ total_budget_sum: string }>(
    `
		SELECT SUM(total_budget) as total_budget_sum
		FROM project_budgets 
		WHERE project_id = $1
	`,
    [projectId],
  )

  const projectTotal = parseFloat(projectResult.rows[0]?.budget_total || '0')
  const budgetSum = parseFloat(budgetResult.rows[0]?.total_budget_sum || '0')
  const difference = Math.abs(projectTotal - budgetSum)

  const hasIssues = difference > 1000 // 1000원 허용 오차

  return {
    validationType: 'budget_consistency',
    hasIssues: hasIssues,
    issues: hasIssues
      ? [
          {
            projectTotal: projectTotal,
            budgetSum: budgetSum,
            difference: difference,
          } as BudgetConsistencyIssue,
        ]
      : [],
    message: hasIssues
      ? `예산 불일치: 프로젝트 총 예산 ${projectTotal.toLocaleString()}원 vs 연차별 예산 합계 ${budgetSum.toLocaleString()}원`
      : '예산 일관성 검증 통과',
  }
}

// 인건비 자동 수정
async function fixPersonnelCost(
  projectId: string,
  issues: unknown[],
): Promise<{ success: boolean; fixedCount: number; error: string | null }> {
  try {
    let fixedCount = 0

    for (const issue of issues) {
      // 타입 가드: issue가 필요한 속성을 가지고 있는지 확인
      if (
        typeof issue === 'object' &&
        issue !== null &&
        'actualPersonnelCost' in issue &&
        'periodId' in issue
      ) {
        const typedIssue = issue as PersonnelCostIssue

        await query(
          `
				UPDATE project_budgets 
				SET personnel_cost = $1, updated_at = CURRENT_TIMESTAMP
				WHERE id = $2
			`,
          [typedIssue.actualPersonnelCost, typedIssue.periodId],
        )
        fixedCount++
      }
    }

    return {
      success: true,
      fixedCount: fixedCount,
      error: null,
    }
  } catch (error: unknown) {
    return {
      success: false,
      fixedCount: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
  }
}

// 예산 일관성 자동 수정
async function fixBudgetConsistency(
  projectId: string,
  issues: unknown[],
): Promise<{ success: boolean; fixedCount: number; error: string | null }> {
  try {
    let fixedCount = 0

    for (const issue of issues) {
      // 타입 가드: issue가 필요한 속성을 가지고 있는지 확인
      if (typeof issue === 'object' && issue !== null && 'budgetSum' in issue) {
        const typedIssue = issue as BudgetConsistencyIssue

        await query(
          `
				UPDATE projects 
				SET budget_total = $1, updated_at = CURRENT_TIMESTAMP
				WHERE id = $2
			`,
          [typedIssue.budgetSum, projectId],
        )
        fixedCount++
      }
    }

    return {
      success: true,
      fixedCount: fixedCount,
      error: null,
    }
  } catch (error: unknown) {
    return {
      success: false,
      fixedCount: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
  }
}

// API 엔드포인트들
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId')

    if (!projectId) {
      const response: ApiResponse<null> = { success: false, error: '프로젝트 ID가 필요합니다.' }
      return json(response, { status: 400 })
    }

    const result = await validateProject(projectId)
    const response: ApiResponse<ValidationResponse> = { success: true, data: result }
    return json(response)
  } catch (error: unknown) {
    logger.error('💥 [간단 검증] GET 오류:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
    return json(response, { status: 500 })
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { projectId } = (await request.json()) as { projectId: string }

    if (!projectId) {
      const response: ApiResponse<null> = { success: false, error: '프로젝트 ID가 필요합니다.' }
      return json(response, { status: 400 })
    }

    const result = await validateProject(projectId)
    const response: ApiResponse<ValidationResponse> = { success: true, data: result }
    return json(response)
  } catch (error: unknown) {
    logger.error('💥 [간단 검증] POST 오류:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
    return json(response, { status: 500 })
  }
}
