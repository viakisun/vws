import {
  BudgetConsistencyValidator,
  EmploymentPeriodValidator,
  ParticipationRateValidator,
  PersonnelCostValidator,
  UsageRateValidator,
  ValidationUtils
} from '$lib/utils/validation'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 검증 룰 정의
const DEFAULT_VALIDATION_RULES = [
  {
    name: 'personnel_cost',
    description: '인건비 검증',
    priority: 1,
    enabled: true,
    validationType: 'personnel_cost',
    autoFix: true,
    tolerance: 1000
  },
  {
    name: 'budget_consistency',
    description: '예산 일관성 검증',
    priority: 2,
    enabled: true,
    validationType: 'budget_consistency',
    autoFix: true,
    tolerance: 1000
  },
  {
    name: 'employment_period',
    description: '재직 기간 검증',
    priority: 3,
    enabled: true,
    validationType: 'employment_period',
    autoFix: false,
    tolerance: 0
  },
  {
    name: 'participation_rate',
    description: '참여율 검증',
    priority: 4,
    enabled: true,
    validationType: 'participation_rate',
    autoFix: true,
    tolerance: 0
  },
  {
    name: 'usage_rate',
    description: '사용률 검증',
    priority: 5,
    enabled: true,
    validationType: 'usage_rate',
    autoFix: false,
    tolerance: 5
  }
]

export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId')

    if (projectId) {
      // 특정 프로젝트 검증
      return await validateAndFixProject(projectId, false)
    } else {
      // 검증 룰 목록 반환
      return json({
        success: true,
        rules: DEFAULT_VALIDATION_RULES,
        generatedAt: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Project validation rules error:', error)
    return json(
      ValidationUtils.createErrorResponse(error, '검증 룰 처리 중 오류가 발생했습니다.'),
      { status: 500 }
    )
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { projectId, autoFix = false } = await request.json()

    if (!projectId) {
      return json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 })
    }

    return await validateAndFixProject(projectId, autoFix)
  } catch (error) {
    console.error('Project validation rules error:', error)
    return json(
      ValidationUtils.createErrorResponse(error, '검증 룰 처리 중 오류가 발생했습니다.'),
      { status: 500 }
    )
  }
}

async function validateAndFixProject(projectId: string, autoFix: boolean) {
  console.log(`🔍 [통합 검증] 프로젝트 ${projectId} ${autoFix ? '자동 수정' : '검증'} 시작`)

  // 프로젝트 기본 정보 조회
  const project = await ValidationUtils.getProjectInfo(projectId)
  console.log(`📋 프로젝트: ${project.title}`)

  // 모든 데이터 조회
  const [budgets, members, evidenceItems] = await Promise.all([
    ValidationUtils.getProjectBudgets(projectId),
    ValidationUtils.getProjectMembers(projectId),
    ValidationUtils.getEvidenceItems(projectId)
  ])

  const validationResults = []
  const fixes = []

  // 활성화된 검증 룰을 우선순위 순으로 실행
  const activeRules = DEFAULT_VALIDATION_RULES.filter(rule => rule.enabled).sort(
    (a, b) => a.priority - b.priority
  )

  for (const rule of activeRules) {
    console.log(`🔍 [${rule.description}] 검증 시작`)

    try {
      let result: any = null

      switch (rule.validationType) {
        case 'personnel_cost':
          result = await validatePersonnelCost(budgets, members, rule, autoFix)
          break
        case 'budget_consistency':
          result = await validateBudgetConsistency(project, budgets, rule, autoFix)
          break
        case 'employment_period':
          result = await validateEmploymentPeriod(project, members, evidenceItems, rule)
          break
        case 'participation_rate':
          result = await validateParticipationRate(members, rule, autoFix)
          break
        case 'usage_rate':
          result = await validateUsageRate(budgets, evidenceItems, rule)
          break
      }

      if (result) {
        validationResults.push(result)
        if (result.fixes) {
          fixes.push(...result.fixes)
        }
      }
    } catch (error) {
      console.error(`❌ [${rule.description}] 검증 실패:`, error)
      validationResults.push({
        ruleName: rule.name,
        ruleDescription: rule.description,
        validation: ValidationUtils.createValidationResult(
          false,
          'VALIDATION_ERROR',
          `${rule.description} 검증 중 오류가 발생했습니다.`,
          [error instanceof Error ? error.message : 'Unknown error']
        )
      })
    }
  }

  // 전체 검증 결과 생성
  const overallValidation = ValidationUtils.createOverallValidation(validationResults)

  console.log(
    `✅ [통합 검증] 완료 - ${overallValidation.validItems}/${overallValidation.totalItems}개 검증 통과${fixes.length > 0 ? `, ${fixes.length}개 수정` : ''}`
  )

  return json({
    ...ValidationUtils.createValidationResponse(
      projectId,
      project.title,
      validationResults,
      overallValidation
    ),
    fixes: fixes.length > 0 ? fixes : undefined,
    rules: activeRules
  })
}

async function validatePersonnelCost(budgets: any[], members: any[], rule: any, autoFix: boolean) {
  const results = []
  const fixes = []

  for (const budget of budgets) {
    const actualPersonnelCost = PersonnelCostValidator.calculateActualPersonnelCost(members, budget)
    const validation = PersonnelCostValidator.validatePersonnelCost(budget, actualPersonnelCost)

    if (autoFix && !validation.isValid) {
      const tolerance = rule.tolerance || 1000
      if (Math.abs((parseFloat(budget.personnel_cost) || 0) - actualPersonnelCost) > tolerance) {
        await ValidationUtils.pool.query(
          'UPDATE project_budgets SET personnel_cost = $1 WHERE id = $2',
          [actualPersonnelCost, budget.id]
        )

        fixes.push({
          ruleName: rule.name,
          periodNumber: budget.period_number,
          action: 'personnel_cost_updated',
          oldValue: parseFloat(budget.personnel_cost) || 0,
          newValue: actualPersonnelCost
        })
      }
    }

    results.push({
      periodNumber: budget.period_number,
      validation,
      details: {
        budgetedPersonnelCost: parseFloat(budget.personnel_cost) || 0,
        actualPersonnelCost
      }
    })
  }

  return {
    ruleName: rule.name,
    ruleDescription: rule.description,
    validation: ValidationUtils.createValidationResult(
      results.every(r => r.validation.isValid),
      results.every(r => r.validation.isValid) ? 'VALID' : 'PERSONNEL_COST_MISMATCH',
      results.every(r => r.validation.isValid)
        ? '인건비가 예산과 일치합니다.'
        : '인건비 불일치가 발견되었습니다.'
    ),
    details: results,
    fixes
  }
}

async function validateBudgetConsistency(
  project: any,
  budgets: any[],
  rule: any,
  autoFix: boolean
) {
  const validation = BudgetConsistencyValidator.validateBudgetConsistency(project, budgets)
  const fixes = []

  if (autoFix && !validation.isValid) {
    const totalBudgetFromBudgets = budgets.reduce(
      (sum, budget) => sum + (parseFloat(budget.total_budget) || 0),
      0
    )

    await ValidationUtils.pool.query('UPDATE projects SET budget_total = $1 WHERE id = $2', [
      totalBudgetFromBudgets,
      project.id
    ])

    fixes.push({
      ruleName: rule.name,
      action: 'project_budget_total_updated',
      oldValue: parseFloat(project.budget_total) || 0,
      newValue: totalBudgetFromBudgets
    })
  }

  return {
    ruleName: rule.name,
    ruleDescription: rule.description,
    validation,
    details: {
      projectTotalBudget: parseFloat(project.budget_total) || 0,
      totalBudgetFromBudgets: budgets.reduce(
        (sum, budget) => sum + (parseFloat(budget.total_budget) || 0),
        0
      )
    },
    fixes
  }
}

async function validateEmploymentPeriod(
  project: any,
  members: any[],
  evidenceItems: any[],
  rule: any
) {
  const memberResults = []
  const evidenceResults = []

  // 참여연구원 재직기간 검증
  for (const member of members) {
    const validation = EmploymentPeriodValidator.validateMemberEmploymentPeriod(member, project)
    memberResults.push({
      memberId: member.id,
      memberName: `${member.first_name} ${member.last_name}`,
      validation
    })
  }

  // 증빙 항목 재직기간 검증
  for (const evidence of evidenceItems) {
    const employee = await ValidationUtils.getEmployeeInfo(evidence.assignee_id)
    const validation = EmploymentPeriodValidator.validateEvidenceEmploymentPeriod(
      evidence,
      employee
    )
    evidenceResults.push({
      evidenceId: evidence.id,
      evidenceName: evidence.name,
      validation
    })
  }

  const allValid =
    memberResults.every(r => r.validation.isValid) &&
    evidenceResults.every(r => r.validation.isValid)

  return {
    ruleName: rule.name,
    ruleDescription: rule.description,
    validation: ValidationUtils.createValidationResult(
      allValid,
      allValid ? 'VALID' : 'EMPLOYMENT_PERIOD_INVALID',
      allValid ? '재직 기간이 유효합니다.' : '재직 기간 문제가 발견되었습니다.'
    ),
    details: {
      memberResults,
      evidenceResults
    }
  }
}

async function validateParticipationRate(members: any[], rule: any, autoFix: boolean) {
  const validation = ParticipationRateValidator.validateParticipationRate(members)
  const fixes = []

  if (autoFix && !validation.isValid) {
    for (const member of members) {
      const participationRate = parseFloat(member.participation_rate) || 0

      if (participationRate > 100) {
        await ValidationUtils.pool.query(
          'UPDATE project_members SET participation_rate = $1 WHERE id = $2',
          [100, member.id]
        )

        fixes.push({
          ruleName: rule.name,
          memberId: member.id,
          memberName: `${member.first_name} ${member.last_name}`,
          action: 'participation_rate_adjusted',
          oldValue: participationRate,
          newValue: 100
        })
      }
    }
  }

  return {
    ruleName: rule.name,
    ruleDescription: rule.description,
    validation,
    details: {
      members: members.map(member => ({
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        participationRate: parseFloat(member.participation_rate) || 0
      }))
    },
    fixes
  }
}

async function validateUsageRate(budgets: any[], evidenceItems: any[], rule: any) {
  const results = []

  for (const budget of budgets) {
    const validation = UsageRateValidator.validateUsageRate(budget, evidenceItems)
    results.push({
      periodNumber: budget.period_number,
      validation
    })
  }

  const allValid = results.every(r => r.validation.isValid)

  return {
    ruleName: rule.name,
    ruleDescription: rule.description,
    validation: ValidationUtils.createValidationResult(
      allValid,
      allValid ? 'VALID' : 'USAGE_RATE_INCONSISTENCY',
      allValid ? '사용률이 일관성 있습니다.' : '사용률 불일치가 발견되었습니다.'
    ),
    details: results
  }
}
