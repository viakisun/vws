/**
 * 프로젝트 관리 계산 유틸리티
 *
 * 프로젝트 예산, 멤버, 기간 등의 계산 로직을 포함합니다.
 */

import * as memberUtils from './memberUtils'
import * as budgetUtils from './budgetUtils'

// ============================================================================
// 타입 정의
// ============================================================================

interface ProjectMember {
  participationRate?: number
  participation_rate?: number
  cashAmount?: string | number
  cash_amount?: string | number
  inKindAmount?: string | number
  in_kind_amount?: string | number
  startDate?: string
  start_date?: string
  endDate?: string
  end_date?: string
  [key: string]: any
}

interface ProjectBudget {
  period_number?: number
  start_date?: string
  end_date?: string
  government_funding_amount?: string | number
  company_cash_amount?: string | number
  company_in_kind_amount?: string | number
  personnel_cost_cash?: string | number
  personnel_cost_in_kind?: string | number
  research_material_cost_cash?: string | number
  research_material_cost_in_kind?: string | number
  research_activity_cost_cash?: string | number
  research_activity_cost_in_kind?: string | number
  research_stipend_cash?: string | number
  research_stipend_in_kind?: string | number
  indirect_cost_cash?: string | number
  indirect_cost_in_kind?: string | number
  [key: string]: any
}

interface BudgetTotals {
  personnelCash: number
  personnelInKind: number
  researchMaterialCash: number
  researchMaterialInKind: number
  researchActivityCash: number
  researchActivityInKind: number
  researchStipendCash: number
  researchStipendInKind: number
  indirectCash: number
  indirectInKind: number
  totalCash: number
  totalInKind: number
  totalBudget: number
}

interface TableTotals {
  totalContractSalary: number
  totalParticipationRate: number
  totalCashAmount: number
  totalInKindAmount: number
  totalParticipationMonths: number
  averageParticipationRate: number
}

interface MonthlyCost {
  month: number
  year: number
  monthNumber: number
  monthName: string
  cash: number
  inKind: number
  total: number
}

interface PersonnelCostSummary {
  totalCash: number
  totalInKind: number
  totalCost: number
  monthlyCosts: MonthlyCost[]
  periodInfo: {
    startDate: string
    endDate: string
    months: number
  } | null
}

// ============================================================================
// 상수
// ============================================================================

const AVERAGE_DAYS_PER_MONTH = 30.44
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24
const MONTHS_PER_YEAR = 12
const THOUSAND = 1000
const TOLERANCE_AMOUNT = 1000 // 예산 불일치 허용 오차 (1천원)

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 안전하게 숫자를 파싱합니다
 * @param value 파싱할 값
 * @param defaultValue 기본값 (기본: 0)
 * @returns 파싱된 숫자
 */
function safeParseFloat(value: string | number | undefined | null, defaultValue = 0): number {
  if (value === undefined || value === null || value === '') return defaultValue
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? defaultValue : num
}

/**
 * 안전하게 정수를 파싱합니다
 * @param value 파싱할 값
 * @param defaultValue 기본값 (기본: 0)
 * @returns 파싱된 정수
 */
function safeParseInt(value: string | number | undefined | null, defaultValue = 0): number {
  if (value === undefined || value === null || value === '') return defaultValue
  const num = typeof value === 'string' ? parseInt(value, 10) : Math.floor(value)
  return isNaN(num) ? defaultValue : num
}

// ============================================================================
// 기간 계산
// ============================================================================

/**
 * 두 날짜 사이의 개월 수를 계산합니다
 * @param startDate 시작일 (YYYY-MM-DD 형식)
 * @param endDate 종료일 (YYYY-MM-DD 형식)
 * @returns 개월 수 (올림)
 */
export function calculatePeriodMonths(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // 날짜 유효성 검사
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffMonths = Math.ceil(diffTime / (MILLISECONDS_PER_DAY * AVERAGE_DAYS_PER_MONTH))

  return diffMonths
}

// ============================================================================
// 멤버 급여 계산
// ============================================================================

/**
 * 계약 월급여를 계산합니다 (월급 기준)
 * @param member 프로젝트 멤버 정보
 * @returns 월급여 (반올림)
 */
export function calculateContractMonthlySalary(member: ProjectMember): number {
  const monthlyAmount = memberUtils.getMemberMonthlyAmount(member)
  return Math.round(monthlyAmount)
}

/**
 * 멤버의 참여율을 가져옵니다
 * @param member 프로젝트 멤버 정보
 * @returns 참여율 (%)
 */
function getMemberParticipationRate(member: ProjectMember): number {
  return safeParseFloat(member.participationRate || member.participation_rate, 0)
}

/**
 * 멤버의 현금/현물 기여 금액을 계산합니다
 * @param member 프로젝트 멤버 정보
 * @param type 기여 유형 ('cash' 또는 'in_kind')
 * @param participationMonths 참여 개월수 (선택사항)
 * @returns 기여 금액 (반올림)
 */
export function calculateContributionAmount(
  member: ProjectMember,
  type: 'cash' | 'in_kind',
  participationMonths?: number,
): number {
  const monthlySalary = calculateContractMonthlySalary(member)
  const participationRate = getMemberParticipationRate(member)
  
  const months =
    participationMonths ||
    calculatePeriodMonths(
      memberUtils.getMemberStartDate(member),
      memberUtils.getMemberEndDate(member),
    )

  // 계약월급여 * 참여율(%) * 참여개월수
  const amount = ((monthlySalary * participationRate) / 100) * months
  return Math.round(amount)
}

/**
 * 멤버의 현금 기여 금액을 가져옵니다
 * @param member 프로젝트 멤버 정보
 * @returns 현금 금액
 */
function getMemberCashAmount(member: ProjectMember): number {
  return safeParseInt(member.cash_amount || member.cashAmount, 0)
}

/**
 * 멤버의 현물 기여 금액을 가져옵니다
 * @param member 프로젝트 멤버 정보
 * @returns 현물 금액
 */
function getMemberInKindAmount(member: ProjectMember): number {
  return safeParseInt(member.in_kind_amount || member.inKindAmount, 0)
}

/**
 * 멤버의 기여 유형을 자동으로 판단합니다
 * @param member 프로젝트 멤버 정보
 * @returns 기여 유형 ('cash', 'in_kind', 'none')
 */
export function getMemberContributionType(member: ProjectMember): 'cash' | 'in_kind' | 'none' {
  const cashAmount = getMemberCashAmount(member)
  const inKindAmount = getMemberInKindAmount(member)

  if (cashAmount > 0) return 'cash'
  if (inKindAmount > 0) return 'in_kind'
  return 'none'
}

// ============================================================================
// 테이블 합계 계산
// ============================================================================

/**
 * 프로젝트 멤버들의 테이블 합계를 계산합니다
 * @param projectMembers 프로젝트 멤버 배열
 * @returns 각 항목의 합계
 */
export function calculateTableTotals(projectMembers: ProjectMember[]): TableTotals {
  if (!projectMembers || projectMembers.length === 0) {
    return {
      totalContractSalary: 0,
      totalParticipationRate: 0,
      totalCashAmount: 0,
      totalInKindAmount: 0,
      totalParticipationMonths: 0,
      averageParticipationRate: 0,
    }
  }

  const totals: TableTotals = projectMembers.reduce(
    (acc, member) => {
      acc.totalContractSalary += calculateContractMonthlySalary(member)
      acc.totalParticipationRate += getMemberParticipationRate(member)
      acc.totalCashAmount += getMemberCashAmount(member)
      acc.totalInKindAmount += getMemberInKindAmount(member)
      
      const startDate = member.start_date || member.startDate || ''
      const endDate = member.end_date || member.endDate || ''
      acc.totalParticipationMonths += calculatePeriodMonths(startDate, endDate)
      
      return acc
    },
    {
      totalContractSalary: 0,
      totalParticipationRate: 0,
      totalCashAmount: 0,
      totalInKindAmount: 0,
      totalParticipationMonths: 0,
      averageParticipationRate: 0,
    } as TableTotals,
  )

  // 평균 참여율 계산
  totals.averageParticipationRate = totals.totalParticipationRate / projectMembers.length

  return totals
}

// ============================================================================
// 단위 변환
// ============================================================================

/**
 * 원 단위를 천원 단위로 변환합니다 (입력용)
 * @param value 원 단위 값
 * @returns 천원 단위 문자열
 */
export function toThousands(value: string | number): string {
  const num = safeParseFloat(value, 0)
  return (num / THOUSAND).toString()
}

/**
 * 천원 단위를 원 단위로 변환합니다 (저장용)
 * @param value 천원 단위 값
 * @returns 원 단위 숫자
 */
export function fromThousands(value: string): number {
  const num = safeParseFloat(value, 0)
  return num * THOUSAND
}

// ============================================================================
// 예산 검증
// ============================================================================

/**
 * 예산 항목의 현금 합계를 계산합니다
 * @param budget 예산 정보
 * @returns 현금 합계
 */
function calculateBudgetCash(budget: ProjectBudget): number {
  return (
    safeParseFloat(budget.personnel_cost_cash) +
    safeParseFloat(budget.research_material_cost_cash) +
    safeParseFloat(budget.research_activity_cost_cash) +
    safeParseFloat(budget.research_stipend_cash) +
    safeParseFloat(budget.indirect_cost_cash)
  )
}

/**
 * 예산 항목의 현물 합계를 계산합니다
 * @param budget 예산 정보
 * @returns 현물 합계
 */
function calculateBudgetInKind(budget: ProjectBudget): number {
  return (
    safeParseFloat(budget.personnel_cost_in_kind) +
    safeParseFloat(budget.research_material_cost_in_kind) +
    safeParseFloat(budget.research_activity_cost_in_kind) +
    safeParseFloat(budget.research_stipend_in_kind) +
    safeParseFloat(budget.indirect_cost_in_kind)
  )
}

/**
 * 연차별 예산과 연구개발비의 불일치 여부를 확인합니다
 * @param budget 현재 예산 정보
 * @param projectBudgets 전체 프로젝트 예산 배열
 * @param selectedEvidencePeriod 선택된 증빙 기간
 * @returns 불일치 정보 또는 null
 */
export function checkBudgetMismatch(
  budget: ProjectBudget | null,
  projectBudgets?: ProjectBudget[],
  selectedEvidencePeriod?: number,
) {
  if (!projectBudgets || projectBudgets.length === 0) return null

  // 대상 예산 결정: 전달된 budget, 선택된 기간의 budget, 또는 첫 번째 budget
  const targetBudget =
    budget ||
    projectBudgets.find((b) => budgetUtils.getPeriodNumber(b) === selectedEvidencePeriod) ||
    projectBudgets[0]

  if (!targetBudget) return null

  // 연차별 예산 총액 계산
  const annualBudgetTotal =
    safeParseFloat(targetBudget.government_funding_amount) +
    safeParseFloat(targetBudget.company_cash_amount) +
    safeParseFloat(targetBudget.company_in_kind_amount)

  // 연차별 예산의 현금/현물 구성
  const annualBudgetCash =
    safeParseFloat(targetBudget.government_funding_amount) +
    safeParseFloat(targetBudget.company_cash_amount)
  const annualBudgetInKind = safeParseFloat(targetBudget.company_in_kind_amount)

  // 연구개발비의 현금/현물 각각 계산
  const researchCostCash = calculateBudgetCash(targetBudget)
  const researchCostInKind = calculateBudgetInKind(targetBudget)
  const researchCostTotal = researchCostCash + researchCostInKind

  // 허용 오차 이상 차이 시 불일치로 판단
  if (researchCostTotal > 0 && Math.abs(annualBudgetTotal - researchCostTotal) > TOLERANCE_AMOUNT) {
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

// ============================================================================
// 사업비 합계 계산
// ============================================================================

/**
 * 프로젝트 예산 항목들의 합계를 계산합니다
 * @param projectBudgets 프로젝트 예산 배열
 * @returns 각 항목별 합계
 */
export function calculateBudgetTotals(projectBudgets: ProjectBudget[]): BudgetTotals {
  if (!projectBudgets || projectBudgets.length === 0) {
    return {
      personnelCash: 0,
      personnelInKind: 0,
      researchMaterialCash: 0,
      researchMaterialInKind: 0,
      researchActivityCash: 0,
      researchActivityInKind: 0,
      researchStipendCash: 0,
      researchStipendInKind: 0,
      indirectCash: 0,
      indirectInKind: 0,
      totalCash: 0,
      totalInKind: 0,
      totalBudget: 0,
    }
  }

  const totals = projectBudgets.reduce(
    (acc, budget) => {
      // 모든 항목을 예산 편성 데이터에서 직접 가져오기
      acc.personnelCash += safeParseFloat(budget.personnel_cost_cash)
      acc.personnelInKind += safeParseFloat(budget.personnel_cost_in_kind)
      acc.researchMaterialCash += safeParseFloat(budget.research_material_cost_cash)
      acc.researchMaterialInKind += safeParseFloat(budget.research_material_cost_in_kind)
      acc.researchActivityCash += safeParseFloat(budget.research_activity_cost_cash)
      acc.researchActivityInKind += safeParseFloat(budget.research_activity_cost_in_kind)
      acc.researchStipendCash += safeParseFloat(budget.research_stipend_cash)
      acc.researchStipendInKind += safeParseFloat(budget.research_stipend_in_kind)
      acc.indirectCash += safeParseFloat(budget.indirect_cost_cash)
      acc.indirectInKind += safeParseFloat(budget.indirect_cost_in_kind)

      return acc
    },
    {
      personnelCash: 0,
      personnelInKind: 0,
      researchMaterialCash: 0,
      researchMaterialInKind: 0,
      researchActivityCash: 0,
      researchActivityInKind: 0,
      researchStipendCash: 0,
      researchStipendInKind: 0,
      indirectCash: 0,
      indirectInKind: 0,
      totalCash: 0,
      totalInKind: 0,
      totalBudget: 0,
    } as BudgetTotals,
  )

  // 현금 합계 계산
  totals.totalCash =
    totals.personnelCash +
    totals.researchMaterialCash +
    totals.researchActivityCash +
    totals.researchStipendCash +
    totals.indirectCash

  // 현물 합계 계산
  totals.totalInKind =
    totals.personnelInKind +
    totals.researchMaterialInKind +
    totals.researchActivityInKind +
    totals.researchStipendInKind +
    totals.indirectInKind

  // 총 예산 계산
  totals.totalBudget = totals.totalCash + totals.totalInKind

  return totals
}

// ============================================================================
// 계약 기반 월간금액 계산
// ============================================================================

/**
 * 참여기간 내 계약 정보를 기반으로 월간금액을 자동 계산합니다
 * @param employeeId 직원 ID
 * @param participationRate 참여율 (숫자 또는 문자열)
 * @param startDate 참여 시작일 (선택사항)
 * @param endDate 참여 종료일 (선택사항)
 * @returns 계산된 월간금액
 */
export async function calculateMonthlyAmountFromContract(
  employeeId: string,
  participationRate: number | string,
  startDate?: string,
  endDate?: string,
): Promise<number> {
  // 참여율을 숫자로 변환
  const rate = safeParseFloat(participationRate)

  // 필수 파라미터 검증
  if (!employeeId || !rate || isNaN(rate)) {
    return 0
  }

  // 참여기간이 없으면 0 반환
  if (!startDate || !endDate) {
    return 0
  }

  try {
    // 참여기간 내의 계약 정보 조회
    const response = await fetch(
      `/api/project-management/employees/${employeeId}/contract?startDate=${startDate}&endDate=${endDate}`,
    )
    
    if (!response.ok) {
      return 0
    }

    const contractData = (await response.json()) as {
      success: boolean
      data?: { annual_salary: string | number }
    }

    if (!contractData.success || !contractData.data) {
      return 0
    }

    const annualSalary = safeParseFloat(contractData.data.annual_salary)

    if (annualSalary === 0) {
      return 0
    }

    // 월급 계산: 연봉 / 12 * 참여율
    const monthlyAmount = Math.round((annualSalary / MONTHS_PER_YEAR) * (rate / 100))

    return monthlyAmount
  } catch (_error) {
    // 로깅은 상위 컴포넌트에서 처리
    return 0
  }
}

// ============================================================================
// 날짜 포맷 변환
// ============================================================================

/**
 * 날짜를 ISO 형식(YYYY-MM-DD)으로 변환합니다
 * @param dateStr "2025. 01. 01." 형식의 날짜 문자열
 * @returns "2025-01-01" 형식의 날짜 문자열
 */
export function convertDateToISO(dateStr: string): string {
  if (!dateStr) return ''
  // "2025. 01. 01." 형식을 "2025-01-01" 형식으로 변환
  return dateStr.replace(/\s+/g, '').replace(/\./g, '-').replace(/-$/, '')
}

// ============================================================================
// 입력 핸들러
// ============================================================================

/**
 * 숫자 입력 필드의 포맷팅을 처리합니다
 * @param e 입력 이벤트
 * @param callback 값 변경 콜백 함수
 * @param formatNumber 포맷팅 함수
 */
export function handleNumberInput(
  e: Event,
  callback: (value: string) => void,
  formatNumber: (value: string | number, includeUnit?: boolean) => string,
): void {
  const input = e.currentTarget as HTMLInputElement
  // 숫자만 추출
  const rawValue = input.value.replace(/[^\d]/g, '')
  // 콜백으로 원본 값 전달
  callback(rawValue || '0')
  // 포맷팅된 값으로 표시
  input.value = formatNumber(rawValue, false)
}

// ============================================================================
// 인건비 요약 계산
// ============================================================================

/**
 * 해당 연차의 인건비 합계 및 월별 상세 내역을 계산합니다
 * @param projectMembers 프로젝트 멤버 배열
 * @param projectBudgets 프로젝트 예산 배열
 * @returns 인건비 요약 정보
 */
export function calculatePersonnelCostSummary(
  projectMembers: ProjectMember[],
  projectBudgets: ProjectBudget[],
): PersonnelCostSummary {
  const emptyResult: PersonnelCostSummary = {
    totalCash: 0,
    totalInKind: 0,
    totalCost: 0,
    monthlyCosts: [],
    periodInfo: null,
  }

  if (
    !projectMembers ||
    projectMembers.length === 0 ||
    !projectBudgets ||
    projectBudgets.length === 0
  ) {
    return emptyResult
  }

  // 현재 연차의 첫 번째 사업비 정보를 기준으로 기간 설정
  const currentBudget = projectBudgets[0]
  if (!currentBudget?.start_date || !currentBudget?.end_date) {
    return emptyResult
  }

  const startDate = new Date(currentBudget.start_date)
  const endDate = new Date(currentBudget.end_date)

  // 날짜 유효성 검사
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return emptyResult
  }

  const monthlyCosts: MonthlyCost[] = []

  // 월별 데이터 생성
  const currentDate = new Date(startDate)
  let monthIndex = 1

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    const monthName = currentDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
    })

    let monthlyCash = 0
    let monthlyInKind = 0

    // 각 멤버의 해당 월 인건비 계산
    projectMembers.forEach((member) => {
      const memberStartStr = member.startDate || member.start_date || ''
      const memberEndStr = member.endDate || member.end_date || ''
      
      if (!memberStartStr || !memberEndStr) return

      const memberStartDate = new Date(memberStartStr)
      const memberEndDate = new Date(memberEndStr)
      
      // 날짜 유효성 검사
      if (isNaN(memberStartDate.getTime()) || isNaN(memberEndDate.getTime())) return
      
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = new Date(year, month, 0) // 해당 월의 마지막 날

      // 해당 월에 참여하는지 확인
      if (memberStartDate <= monthEnd && memberEndDate >= monthStart) {
        const cashAmount = getMemberCashAmount(member)
        const inKindAmount = getMemberInKindAmount(member)

        if (cashAmount > 0) {
          monthlyCash += cashAmount
        }
        if (inKindAmount > 0) {
          monthlyInKind += inKindAmount
        }
      }
    })

    monthlyCosts.push({
      month: monthIndex,
      year: year,
      monthNumber: month,
      monthName: monthName,
      cash: monthlyCash,
      inKind: monthlyInKind,
      total: monthlyCash + monthlyInKind,
    })

    // 다음 달로 이동
    currentDate.setMonth(currentDate.getMonth() + 1)
    monthIndex++
  }

  // 총합 계산
  const totalCash = monthlyCosts.reduce((sum, month) => sum + month.cash, 0)
  const totalInKind = monthlyCosts.reduce((sum, month) => sum + month.inKind, 0)
  const totalCost = totalCash + totalInKind

  return {
    totalCash,
    totalInKind,
    totalCost,
    monthlyCosts,
    periodInfo: {
      startDate: currentBudget.start_date,
      endDate: currentBudget.end_date,
      months: monthlyCosts.length,
    },
  }
}
