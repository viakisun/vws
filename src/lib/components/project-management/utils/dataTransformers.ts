/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Data Transformation Utilities
 *
 * API 응답 데이터와 UI 폼 데이터 간의 변환을 처리하는 유틸리티 함수들
 * - Field name normalization (snake_case ↔ camelCase)
 * - Type conversion with safe defaults
 * - Budget category mapping
 */

/**
 * Member data transformer
 * API 응답의 member 데이터를 폼 데이터로 변환
 */
export interface MemberFormData {
  employeeId: string
  position: string
  participationRate: number
  monthlyAmount: string
  contractMonthlySalary: string
  participationMonths: number
  cashAmount: string
  inKindAmount: string
}

/**
 * Member 객체에서 현금 금액을 안전하게 추출
 * snake_case와 camelCase 모두 지원
 */
export function extractCashAmount(member: any): string {
  const value = member.cash_amount || member.cashAmount || 0
  return String(value)
}

/**
 * Member 객체에서 현물 금액을 안전하게 추출
 * snake_case와 camelCase 모두 지원
 */
export function extractInKindAmount(member: any): string {
  const value = member.in_kind_amount || member.inKindAmount || 0
  return String(value)
}

/**
 * 숫자 값을 문자열로 안전하게 변환
 * undefined, null, NaN 등을 기본값으로 처리
 */
export function safeNumberToString(
  value: number | string | undefined | null,
  defaultValue = '0',
): string {
  if (value === undefined || value === null) return defaultValue
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(numValue) ? defaultValue : String(numValue)
}

/**
 * 문자열을 숫자로 안전하게 변환
 * 파싱 실패 시 기본값 반환
 */
export function safeStringToNumber(
  value: string | number | undefined | null,
  defaultValue = 0,
): number {
  if (value === undefined || value === null) return defaultValue
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(numValue) ? defaultValue : numValue
}

/**
 * Budget Category Mapper
 * API의 budget 객체를 UI의 category 배열로 변환
 */
export interface BudgetCategory {
  id: string
  type: string
  name: string
  cash: number
  inKind: number
}

/**
 * Budget 객체를 카테고리 배열로 변환
 */
export function transformBudgetToCategories(budget: any): BudgetCategory[] {
  return [
    {
      id: 'personnel',
      type: 'personnel',
      name: '인건비',
      cash: safeStringToNumber(budget.personnel_cost, 0),
      inKind: safeStringToNumber(budget.personnel_cost_in_kind, 0),
    },
    {
      id: 'material',
      type: 'material',
      name: '연구재료비',
      cash: safeStringToNumber(budget.research_material_cost, 0),
      inKind: safeStringToNumber(budget.research_material_cost_in_kind, 0),
    },
    {
      id: 'activity',
      type: 'activity',
      name: '연구활동비',
      cash: safeStringToNumber(budget.research_activity_cost, 0),
      inKind: safeStringToNumber(budget.research_activity_cost_in_kind, 0),
    },
    {
      id: 'stipend',
      type: 'stipend',
      name: '연구수당',
      cash: safeStringToNumber(budget.research_stipend, 0),
      inKind: safeStringToNumber(budget.research_stipend_in_kind, 0),
    },
    {
      id: 'indirect',
      type: 'indirect',
      name: '간접비',
      cash: safeStringToNumber(budget.indirect_cost, 0),
      inKind: safeStringToNumber(budget.indirect_cost_in_kind, 0),
    },
  ]
}

/**
 * 현금이나 현물이 있는 카테고리만 필터링
 */
export function filterNonZeroCategories(categories: BudgetCategory[]): BudgetCategory[] {
  return categories.filter((category) => category.cash + category.inKind > 0)
}

/**
 * API 응답 데이터 정규화
 * 성공/실패 구조를 표준화하고 데이터 추출을 간소화
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * API 응답에서 데이터를 안전하게 추출
 */
export function extractApiData<T>(response: ApiResponse<T>, defaultValue: T): T {
  if (!response.success || !response.data) {
    return defaultValue
  }
  return response.data
}

/**
 * API 응답에서 배열 데이터를 안전하게 추출
 */
export function extractApiArrayData<T>(response: ApiResponse<T[]>): T[] {
  return extractApiData(response, [])
}

/**
 * 중첩된 데이터 구조에서 값을 안전하게 추출
 * 예: response.data.validation.issues
 */
export function extractNestedData<T>(
  obj: Record<string, unknown>,
  path: string[],
  defaultValue: T,
): T {
  let current: unknown = obj

  for (const key of path) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return defaultValue
    }
  }

  return current as T
}

/**
 * Validation Issue Transformer
 * API의 validation issue를 UI에서 사용하기 쉬운 형태로 변환
 */
export interface ValidationIssue {
  memberId?: string
  field: string
  severity: 'error' | 'warning'
  message: string
  code?: string
}

export interface MemberValidationStatus {
  memberId: string
  name: string
  errorCount: number
  warningCount: number
  status: 'valid' | 'warning' | 'error'
  issues: ValidationIssue[]
}

/**
 * Validation issue를 멤버별로 그룹화
 */
export function groupIssuesByMember(
  issues: ValidationIssue[],
  members: any[],
): MemberValidationStatus[] {
  return members.map((member) => {
    const memberIssues = issues.filter((issue) => issue.memberId === member.id)
    const errorCount = memberIssues.filter((i) => i.severity === 'error').length
    const warningCount = memberIssues.filter((i) => i.severity === 'warning').length

    return {
      memberId: member.id,
      name: member.employee_name || member.name || '',
      errorCount,
      warningCount,
      status: errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'valid',
      issues: memberIssues,
    }
  })
}
