/**
 * 멤버(Member) 관련 유틸리티 함수
 * ProjectDetailView에서 사용하는 프로젝트 멤버 데이터 처리 함수들
 */

import { isKoreanName } from '$lib/utils/korean-name'

/**
 * 멤버 필드 접근 유틸리티 - camelCase와 snake_case 모두 지원
 */
export function getMemberField<T>(
  member: Record<string, any>,
  camelCase: string,
  snakeCase: string,
  defaultValue: T,
): T {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return member?.[camelCase] || member?.[snakeCase] || defaultValue
}

/**
 * 멤버 시작일 가져오기
 */
export function getMemberStartDate(member: Record<string, any>): string {
  return getMemberField(member, 'startDate', 'start_date', '')
}

/**
 * 멤버 종료일 가져오기
 */
export function getMemberEndDate(member: Record<string, any>): string {
  return getMemberField(member, 'endDate', 'end_date', '')
}

/**
 * 멤버 직원 ID 가져오기
 */
export function getMemberEmployeeId(member: Record<string, any>): string {
  return getMemberField(member, 'employeeId', 'employee_id', '')
}

/**
 * 멤버 참여율 가져오기
 */
export function getMemberParticipationRate(member: Record<string, any>): number {
  return getMemberField(member, 'participationRate', 'participation_rate', 0)
}

/**
 * 멤버 월별 금액 가져오기
 */
export function getMemberMonthlyAmount(member: Record<string, any>): number {
  return getMemberField(member, 'monthlyAmount', 'monthly_amount', 0)
}

/**
 * 멤버 직원 이름 가져오기
 */
export function getMemberEmployeeName(member: Record<string, any>): string {
  return getMemberField(member, 'employeeName', 'employee_name', '')
}

/**
 * 멤버 역할 가져오기
 */
export function getMemberRole(member: Record<string, any>): string {
  return getMemberField(member, 'role', 'role', '')
}

/**
 * 멤버 현금 금액 가져오기
 */
export function getMemberCashAmount(member: Record<string, any>): number {
  return getMemberField(member, 'cashAmount', 'cash_amount', 0)
}

/**
 * 멤버 현물 금액 가져오기
 */
export function getMemberInKindAmount(member: Record<string, any>): number {
  return getMemberField(member, 'inKindAmount', 'in_kind_amount', 0)
}

/**
 * 한글 이름 포맷팅
 * 한글 이름일 경우 성과 이름 사이에 공백 추가
 */
export function formatKoreanName(name: string): string {
  if (!name) return ''

  // 이미 공백이 있으면 그대로 반환
  if (name.includes(' ')) return name

  // 한글 이름인 경우 성과 이름 사이에 공백 추가
  if (isKoreanName(name) && name.length >= 2) {
    return name[0] + ' ' + name.slice(1)
  }

  return name
}

/**
 * 담당자 이름 포맷팅 (employee 객체에서)
 */
export function formatAssigneeName(
  assigneeEmployeeId: string,
  assigneeEmployeeName: string,
  fallback: string = '미할당',
): string {
  if (assigneeEmployeeId && assigneeEmployeeName) {
    return formatKoreanName(assigneeEmployeeName)
  }
  return fallback
}

/**
 * 담당자 이름 포맷팅 (필드명으로)
 */
export function formatAssigneeNameFromFields(
  item: Record<string, any>,
  fallback: string = '미할당',
): string {
  const employeeId = (item.assignee_employee_id || item.assigneeEmployeeId || '') as string
  const employeeName = (item.assignee_employee_name || item.assigneeEmployeeName || '') as string
  return formatAssigneeName(employeeId, employeeName, fallback)
}

/**
 * employee 객체에서 담당자 이름 생성
 */
export function createAssigneeNameFromEmployee(employee: Record<string, any>): string {
  const name = (employee.name || employee.employee_name || '') as string
  return formatKoreanName(name)
}

/**
 * 직원 선택 옵션 포맷팅 (select용)
 */
export function formatEmployeeForSelect(employee: Record<string, any>): string {
  const id = (employee.id || employee.employee_id || '') as string
  const name = (employee.name || employee.employee_name || '') as string
  const formattedName = formatKoreanName(name)
  return `${id} - ${formattedName}`
}

/**
 * 참여 개월 수 계산
 */
export function calculateParticipationMonths(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)

  const yearDiff = end.getFullYear() - start.getFullYear()
  const monthDiff = end.getMonth() - start.getMonth()

  return yearDiff * 12 + monthDiff + 1
}

/**
 * 멤버의 총 비용 계산 (현금 + 현물)
 */
export function calculateMemberTotalCost(member: Record<string, any>): {
  cash: number
  inKind: number
  total: number
} {
  const cash = getMemberCashAmount(member)
  const inKind = getMemberInKindAmount(member)

  return {
    cash,
    inKind,
    total: cash + inKind,
  }
}

/**
 * 여러 멤버의 총 비용 합계 계산
 */
export function calculateMembersTotalCost(members: Record<string, any>[]): {
  totalCash: number
  totalInKind: number
  grandTotal: number
  memberCount: number
} {
  const totals = {
    totalCash: 0,
    totalInKind: 0,
    grandTotal: 0,
    memberCount: members.length,
  }

  members.forEach((member) => {
    totals.totalCash += getMemberCashAmount(member)
    totals.totalInKind += getMemberInKindAmount(member)
  })

  totals.grandTotal = totals.totalCash + totals.totalInKind

  return totals
}

/**
 * 멤버가 특정 기간에 참여 중인지 확인
 */
export function isMemberActiveInPeriod(
  member: Record<string, any>,
  periodStart: string,
  periodEnd: string,
): boolean {
  const memberStart = new Date(getMemberStartDate(member))
  const memberEnd = new Date(getMemberEndDate(member))
  const periodStartDate = new Date(periodStart)
  const periodEndDate = new Date(periodEnd)

  // 멤버 참여 기간이 해당 기간과 겹치는지 확인
  return memberStart <= periodEndDate && memberEnd >= periodStartDate
}

/**
 * 멤버 검증: 필수 필드 체크
 */
export function validateMember(member: Record<string, any>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!getMemberEmployeeId(member)) {
    errors.push('직원 ID가 필요합니다')
  }

  if (!getMemberStartDate(member)) {
    errors.push('시작일이 필요합니다')
  }

  if (!getMemberEndDate(member)) {
    errors.push('종료일이 필요합니다')
  }

  const participationRate = getMemberParticipationRate(member)
  if (participationRate <= 0 || participationRate > 100) {
    errors.push('참여율은 0보다 크고 100 이하여야 합니다')
  }

  const startDate = new Date(getMemberStartDate(member))
  const endDate = new Date(getMemberEndDate(member))
  if (startDate > endDate) {
    errors.push('시작일은 종료일보다 이전이어야 합니다')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
