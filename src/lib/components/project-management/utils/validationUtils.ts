/**
 * Validation Utility Functions
 *
 * 검증 관련 유틸리티 함수들
 * ProjectDetailView.svelte에서 추출된 검증 로직 함수들
 */

// ============================================================================
// Types
// ============================================================================

export interface ValidationIssue {
  memberId?: number
  severity: 'error' | 'warning' | 'info'
  message: string
  field?: string
  priority?: 'high' | 'medium' | 'low'
}

export interface MemberValidationStatus {
  status: 'valid' | 'error' | 'warning'
  message: string
  issues: ValidationIssue[]
}

export interface BudgetMismatch {
  hasMismatch: boolean
  annualBudgetTotal?: number
  researchCostTotal?: number
  difference?: number
  annualBudgetCash?: number
  researchCostCash?: number
  annualBudgetInKind?: number
  researchCostInKind?: number
}

// ============================================================================
// Member Validation
// ============================================================================

/**
 * Update member validation statuses based on validation issues
 */
export function updateMemberValidationStatuses(
  issues: ValidationIssue[],
  projectMembers: Record<string, any>[],
): Record<number, MemberValidationStatus> {
  const memberValidationStatuses: Record<number, MemberValidationStatus> = {}

  // 각 멤버별로 검증 상태 설정
  projectMembers.forEach((member) => {
    const memberIssues = issues.filter((issue) => issue.memberId === member.id)

    if (memberIssues.length === 0) {
      memberValidationStatuses[member.id as number] = {
        status: 'valid',
        message: '검증 완료',
        issues: [],
      }
    } else {
      const hasErrors = memberIssues.some((issue) => issue.severity === 'error')
      const hasWarnings = memberIssues.some((issue) => issue.severity === 'warning')
      const errorCount = memberIssues.filter((i) => i.severity === 'error').length
      const warningCount = memberIssues.filter((i) => i.severity === 'warning').length

      // 더 자세한 메시지 생성
      let detailedMessage = ''
      if (hasErrors && hasWarnings) {
        detailedMessage = `${errorCount}개 오류, ${warningCount}개 경고`
      } else if (hasErrors) {
        detailedMessage = `${errorCount}개 오류`
      } else {
        detailedMessage = `${warningCount}개 경고`
      }

      memberValidationStatuses[member.id as number] = {
        status: hasErrors ? 'error' : 'warning',
        message: detailedMessage,
        issues: memberIssues.map((issue) => ({
          ...issue,
          // API에서 제공하는 실제 메시지 사용
          priority: issue.severity === 'error' ? 'high' : 'medium',
        })),
      }
    }
  })

  return memberValidationStatuses
}

/**
 * Count validation issues by severity
 */
export function countIssuesBySeverity(issues: ValidationIssue[]): {
  errors: number
  warnings: number
  info: number
  total: number
} {
  const errors = issues.filter((i) => i.severity === 'error').length
  const warnings = issues.filter((i) => i.severity === 'warning').length
  const info = issues.filter((i) => i.severity === 'info').length

  return {
    errors,
    warnings,
    info,
    total: issues.length,
  }
}

/**
 * Get validation summary message
 */
export function getValidationSummary(issues: ValidationIssue[]): string {
  const counts = countIssuesBySeverity(issues)

  if (counts.total === 0) {
    return '검증 완료: 문제 없음'
  }

  const parts: string[] = []
  if (counts.errors > 0) {
    parts.push(`${counts.errors}개 오류`)
  }
  if (counts.warnings > 0) {
    parts.push(`${counts.warnings}개 경고`)
  }
  if (counts.info > 0) {
    parts.push(`${counts.info}개 정보`)
  }

  return parts.join(', ')
}

/**
 * Filter issues by severity
 */
export function filterIssuesBySeverity(
  issues: ValidationIssue[],
  severity: 'error' | 'warning' | 'info',
): ValidationIssue[] {
  return issues.filter((issue) => issue.severity === severity)
}

/**
 * Check if validation has errors
 */
export function hasValidationErrors(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error')
}

/**
 * Check if validation has warnings
 */
export function hasValidationWarnings(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'warning')
}

/**
 * Get highest severity level from issues
 */
export function getHighestSeverity(
  issues: ValidationIssue[],
): 'error' | 'warning' | 'info' | 'valid' {
  if (issues.length === 0) return 'valid'
  if (hasValidationErrors(issues)) return 'error'
  if (hasValidationWarnings(issues)) return 'warning'
  return 'info'
}

// ============================================================================
// Budget Validation
// ============================================================================

/**
 * Check budget mismatch between annual budget and research costs
 * 연차별 예산과 연구개발비 불일치 확인
 */
export function checkBudgetMismatch(budget: Record<string, any>): BudgetMismatch {
  if (!budget) {
    return { hasMismatch: false }
  }

  // 연차별 예산 총액 계산
  const annualBudgetTotal =
    (parseFloat(budget.government_funding_amount as string) || 0) +
    (parseFloat(budget.company_cash_amount as string) || 0) +
    (parseFloat(budget.company_in_kind_amount as string) || 0)

  // 연차별 예산의 현금/현물 구성
  const annualBudgetCash =
    (parseFloat(budget.government_funding_amount as string) || 0) +
    (parseFloat(budget.company_cash_amount as string) || 0)
  const annualBudgetInKind = parseFloat(budget.company_in_kind_amount as string) || 0

  // 연구개발비의 현금/현물 각각 계산
  const researchCostCash =
    (parseFloat(budget.personnel_cost_cash as string) || 0) +
    (parseFloat(budget.research_material_cost_cash as string) || 0) +
    (parseFloat(budget.research_activity_cost_cash as string) || 0) +
    (parseFloat(budget.research_stipend_cash as string) || 0) +
    (parseFloat(budget.indirect_cost_cash as string) || 0)

  const researchCostInKind =
    (parseFloat(budget.personnel_cost_in_kind as string) || 0) +
    (parseFloat(budget.research_material_cost_in_kind as string) || 0) +
    (parseFloat(budget.research_activity_cost_in_kind as string) || 0) +
    (parseFloat(budget.research_stipend_in_kind as string) || 0) +
    (parseFloat(budget.indirect_cost_in_kind as string) || 0)

  const researchCostTotal = researchCostCash + researchCostInKind

  // 1천원 이상 차이 시 불일치로 판단 (현금+현물 = 연차 예산 총액)
  if (researchCostTotal > 0 && Math.abs(annualBudgetTotal - researchCostTotal) > 1000) {
    return {
      hasMismatch: true,
      annualBudgetTotal,
      researchCostTotal,
      difference: Math.abs(annualBudgetTotal - researchCostTotal),
      annualBudgetCash,
      researchCostCash,
      annualBudgetInKind,
      researchCostInKind,
    }
  }

  return { hasMismatch: false }
}

/**
 * Validate budget amounts are positive
 */
export function validateBudgetAmounts(budget: Record<string, any>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  const fields = [
    { key: 'government_funding_amount', label: '정부지원금' },
    { key: 'company_cash_amount', label: '기업부담금(현금)' },
    { key: 'company_in_kind_amount', label: '기업부담금(현물)' },
  ]

  fields.forEach(({ key, label }) => {
    const value = parseFloat(budget[key] as string)
    if (value < 0) {
      errors.push(`${label}은 0 이상이어야 합니다.`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate budget dates
 */
export function validateBudgetDates(budget: Record<string, any>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  const startDate = (budget.start_date || budget.startDate) as string
  const endDate = (budget.end_date || budget.endDate) as string

  if (!startDate) {
    errors.push('시작일을 입력해주세요.')
  }

  if (!endDate) {
    errors.push('종료일을 입력해주세요.')
  }

  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      errors.push('시작일은 종료일보다 빨라야 합니다.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check if budget period overlaps with existing budgets
 */
export function checkBudgetPeriodOverlap(
  newBudget: Record<string, any>,
  existingBudgets: Record<string, any>[],
  excludeBudgetId?: number,
): { hasOverlap: boolean; overlappingBudget?: Record<string, any> } {
  const newStart = new Date((newBudget.start_date || newBudget.startDate) as string)
  const newEnd = new Date((newBudget.end_date || newBudget.endDate) as string)

  for (const budget of existingBudgets) {
    // 수정 시 자기 자신은 제외
    if (excludeBudgetId && budget.id === excludeBudgetId) {
      continue
    }

    const existingStart = new Date((budget.start_date || budget.startDate) as string)
    const existingEnd = new Date((budget.end_date || budget.endDate) as string)

    // 기간 겹침 체크
    if (newStart <= existingEnd && newEnd >= existingStart) {
      return {
        hasOverlap: true,
        overlappingBudget: budget,
      }
    }
  }

  return { hasOverlap: false }
}

// ============================================================================
// Member Validation
// ============================================================================

/**
 * Validate member participation rate
 */
export function validateParticipationRate(rate: number): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (rate < 0) {
    errors.push('참여율은 0 이상이어야 합니다.')
  }

  if (rate > 100) {
    errors.push('참여율은 100 이하여야 합니다.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate member dates
 */
export function validateMemberDates(member: Record<string, any>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  const startDate = (member.start_date || member.startDate) as string
  const endDate = (member.end_date || member.endDate) as string

  if (!startDate) {
    errors.push('시작일을 입력해주세요.')
  }

  if (!endDate) {
    errors.push('종료일을 입력해주세요.')
  }

  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      errors.push('시작일은 종료일보다 빨라야 합니다.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check if member period is within project budget period
 */
export function checkMemberPeriodWithinBudget(
  member: Record<string, any>,
  budget: Record<string, any>,
): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  const memberStart = new Date((member.start_date || member.startDate) as string)
  const memberEnd = new Date((member.end_date || member.endDate) as string)
  const budgetStart = new Date((budget.start_date || budget.startDate) as string)
  const budgetEnd = new Date((budget.end_date || budget.endDate) as string)

  if (memberStart < budgetStart) {
    errors.push('참여연구원 시작일이 프로젝트 기간보다 빠릅니다.')
  }

  if (memberEnd > budgetEnd) {
    errors.push('참여연구원 종료일이 프로젝트 기간을 초과합니다.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate member required fields
 */
export function validateMemberRequiredFields(member: Record<string, any>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!member.employee_id && !member.employeeId) {
    errors.push('연구원을 선택해주세요.')
  }

  if (!member.role) {
    errors.push('역할을 입력해주세요.')
  }

  if (!member.participation_rate && !member.participationRate) {
    errors.push('참여율을 입력해주세요.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Form Validation Helpers
// ============================================================================

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: { key: string; label: string }[],
): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  requiredFields.forEach(({ key, label }) => {
    if (!data[key] || (typeof data[key] === 'string' && !data[key].trim())) {
      errors.push(`${label}을(를) 입력해주세요.`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min?: number,
  max?: number,
  fieldLabel = '값',
): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (min !== undefined && value < min) {
    errors.push(`${fieldLabel}은(는) ${min} 이상이어야 합니다.`)
  }

  if (max !== undefined && value > max) {
    errors.push(`${fieldLabel}은(는) ${max} 이하여야 합니다.`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: string | Date,
  endDate: string | Date,
  startLabel = '시작일',
  endLabel = '종료일',
): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start >= end) {
    errors.push(`${startLabel}은 ${endLabel}보다 빨라야 합니다.`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(
  ...results: Array<{ isValid: boolean; errors: string[] }>
): {
  isValid: boolean
  errors: string[]
} {
  const allErrors = results.flatMap((result) => result.errors)

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  }
}
