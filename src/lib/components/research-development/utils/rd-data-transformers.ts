/**
 * Research Development Data Transformation Utilities
 * 연구개발사업 데이터 변환 유틸리티
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
 *
 * API 응답과 폼 데이터 간 필드명 차이를 처리합니다.
 * - API: snake_case (cash_amount)
 * - UI Form: camelCase (cashAmount)
 *
 * @param member - 멤버 객체 (API 또는 폼 데이터)
 * @returns 현금 금액을 문자열로 반환 (기본값: "0")
 *
 * @example
 * extractCashAmount({ cash_amount: 1000000 }) // "1000000"
 * extractCashAmount({ cashAmount: 500000 }) // "500000"
 * extractCashAmount({}) // "0"
 */
export function extractCashAmount(member: any): string {
  const value = member.cash_amount || member.cashAmount || 0
  return String(value)
}

/**
 * Member 객체에서 현물 금액을 안전하게 추출
 *
 * API 응답과 폼 데이터 간 필드명 차이를 처리합니다.
 * - API: snake_case (in_kind_amount)
 * - UI Form: camelCase (inKindAmount)
 *
 * @param member - 멤버 객체 (API 또는 폼 데이터)
 * @returns 현물 금액을 문자열로 반환 (기본값: "0")
 *
 * @example
 * extractInKindAmount({ in_kind_amount: 500000 }) // "500000"
 * extractInKindAmount({ inKindAmount: 300000 }) // "300000"
 * extractInKindAmount({}) // "0"
 */
export function extractInKindAmount(member: any): string {
  const value = member.in_kind_amount || member.inKindAmount || 0
  return String(value)
}

/**
 * 숫자 값을 문자열로 안전하게 변환
 *
 * undefined, null, NaN 등의 edge case를 안전하게 처리합니다.
 * 폼 필드에 표시할 값을 준비할 때 사용합니다.
 *
 * @param value - 변환할 숫자 또는 문자열 값
 * @param defaultValue - 변환 실패 시 반환할 기본값 (기본값: '0')
 * @returns 변환된 문자열 또는 기본값
 *
 * @example
 * safeNumberToString(1000000) // "1000000"
 * safeNumberToString("500000") // "500000"
 * safeNumberToString(undefined) // "0"
 * safeNumberToString(null, "N/A") // "N/A"
 * safeNumberToString(NaN, "0") // "0"
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
 *
 * 사용자 입력이나 API 응답을 숫자로 변환할 때 사용합니다.
 * 파싱 실패 시 기본값을 반환하여 NaN 에러를 방지합니다.
 *
 * @param value - 변환할 문자열 또는 숫자 값
 * @param defaultValue - 변환 실패 시 반환할 기본값 (기본값: 0)
 * @returns 변환된 숫자 또는 기본값
 *
 * @example
 * safeStringToNumber("1000000") // 1000000
 * safeStringToNumber(500000) // 500000
 * safeStringToNumber("invalid") // 0
 * safeStringToNumber(undefined, 100) // 100
 * safeStringToNumber(null, -1) // -1
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
 * Member contribution 자동 계산
 *
 * 계약월급여, 참여율, 참여개월수를 기반으로 멤버의 총 기여금액을 계산합니다.
 * 계산 공식: (월급여 × 참여율 / 100) × 참여개월수
 *
 * @param monthlySalary - 계약 월급여 (숫자 또는 문자열)
 * @param participationRate - 참여율 0-100 (숫자 또는 문자열)
 * @param participationMonths - 참여 개월수 (숫자 또는 문자열)
 * @returns 계산된 총 기여금액 (정수로 반올림)
 *
 * @example
 * // 월급여 5,000,000원, 참여율 30%, 12개월
 * calculateMemberContribution(5000000, 30, 12) // 18000000
 *
 * // 문자열 입력도 지원
 * calculateMemberContribution("5000000", "30", "12") // 18000000
 *
 * // 잘못된 입력은 0 반환
 * calculateMemberContribution(0, 30, 12) // 0
 * calculateMemberContribution("invalid", 30, 12) // 0
 */
export function calculateMemberContribution(
  monthlySalary: number | string,
  participationRate: number | string,
  participationMonths: number | string,
): number {
  const salary = safeStringToNumber(monthlySalary, 0)
  const rate = safeStringToNumber(participationRate, 0)
  const months = safeStringToNumber(participationMonths, 0)

  if (salary === 0 || rate === 0 || months === 0) return 0

  return Math.round(((salary * rate) / 100) * months)
}

/**
 * 현금/현물 금액 자동 분배
 *
 * 총 금액을 기존 금액 타입(현금 또는 현물)에 따라 자동으로 분배합니다.
 * 분배 로직:
 * 1. 현재 현금 금액이 있으면 → 전액 현금으로
 * 2. 현재 현물 금액이 있으면 → 전액 현물로
 * 3. 둘 다 없으면 → 기본값으로 전액 현금으로
 *
 * @param totalAmount - 분배할 총 금액
 * @param currentCashAmount - 현재 현금 금액 (숫자 또는 문자열)
 * @param currentInKindAmount - 현재 현물 금액 (숫자 또는 문자열)
 * @returns 분배된 현금/현물 금액 객체 { cashAmount, inKindAmount }
 *
 * @example
 * // 현금이 있는 경우 → 전액 현금
 * distributeMemberAmount(10000000, 5000000, 0)
 * // { cashAmount: "10000000", inKindAmount: "0" }
 *
 * // 현물이 있는 경우 → 전액 현물
 * distributeMemberAmount(10000000, 0, 5000000)
 * // { cashAmount: "0", inKindAmount: "10000000" }
 *
 * // 둘 다 없는 경우 → 기본적으로 현금
 * distributeMemberAmount(10000000, 0, 0)
 * // { cashAmount: "10000000", inKindAmount: "0" }
 */
export function distributeMemberAmount(
  totalAmount: number,
  currentCashAmount: string | number,
  currentInKindAmount: string | number,
): { cashAmount: string; inKindAmount: string } {
  const cash = safeStringToNumber(currentCashAmount, 0)
  const inKind = safeStringToNumber(currentInKindAmount, 0)

  // 현금이 있으면 현금에 할당
  if (cash > 0) {
    return {
      cashAmount: totalAmount.toString(),
      inKindAmount: '0',
    }
  }

  // 현물이 있으면 현물에 할당
  if (inKind > 0) {
    return {
      cashAmount: '0',
      inKindAmount: totalAmount.toString(),
    }
  }

  // 둘 다 0이면 기본적으로 현금에 할당
  return {
    cashAmount: totalAmount.toString(),
    inKindAmount: '0',
  }
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
