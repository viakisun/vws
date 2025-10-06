/**
 * 프로젝트 관리 계산 유틸리티
 *
 * 프로젝트 예산, 멤버, 기간 등의 계산 로직을 포함합니다.
 */

import * as memberUtils from './memberUtils'
import * as budgetUtils from './budgetUtils'

/**
 * 연차 기간 계산 (개월 수)
 */
export function calculatePeriodMonths(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)) // 평균 월 일수

  return diffMonths
}

/**
 * 계약월급여 계산 함수 (월급 기준)
 */
export function calculateContractMonthlySalary(member: any): number {
  const monthlyAmount = memberUtils.getMemberMonthlyAmount(member)
  return Math.round(monthlyAmount)
}

/**
 * 현금/현물 금액 계산 함수
 */
export function calculateContributionAmount(
  member: any,
  type: 'cash' | 'in_kind',
  participationMonths?: number,
): number {
  const monthlySalary = calculateContractMonthlySalary(member)
  const participationRate = member.participationRate || 0
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
 * 멤버의 기여 유형 자동 판단 함수
 */
export function getMemberContributionType(member: any): 'cash' | 'in_kind' | 'none' {
  const cashAmount = parseInt(member.cash_amount || member.cashAmount || '0')
  const inKindAmount = parseInt(member.in_kind_amount || member.inKindAmount || '0')

  if (cashAmount > 0) return 'cash'
  if (inKindAmount > 0) return 'in_kind'
  return 'none'
}

/**
 * 테이블 합계 계산 함수들
 */
export function calculateTableTotals(projectMembers: any[]) {
  let totalContractSalary = 0
  let totalParticipationRate = 0
  let totalCashAmount = 0
  let totalInKindAmount = 0
  let totalParticipationMonths = 0

  projectMembers.forEach((member) => {
    totalContractSalary += calculateContractMonthlySalary(member)
    totalParticipationRate += member.participation_rate || member.participationRate || 0
    totalCashAmount += parseInt(member.cash_amount || member.cashAmount || '0')
    totalInKindAmount += parseInt(member.in_kind_amount || member.inKindAmount || '0')
    totalParticipationMonths += calculatePeriodMonths(member.start_date, member.end_date)
  })

  return {
    totalContractSalary,
    totalParticipationRate,
    totalCashAmount,
    totalInKindAmount,
    totalParticipationMonths,
    averageParticipationRate:
      projectMembers.length > 0 ? totalParticipationRate / projectMembers.length : 0,
  }
}

/**
 * 천원 단위로 변환 (입력용)
 */
export function toThousands(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return (num / 1000).toString()
}

/**
 * 천원 단위에서 원 단위로 변환 (저장용)
 */
export function fromThousands(value: string): number {
  const num = parseFloat(value) || 0
  return num * 1000
}

/**
 * 연차별 예산과 연구개발비 불일치 확인
 */
export function checkBudgetMismatch(
  budget: any,
  projectBudgets?: any[],
  selectedEvidencePeriod?: number,
) {
  if (!projectBudgets || projectBudgets.length === 0) return null

  const targetBudget =
    budget ||
    projectBudgets.find((b) => budgetUtils.getPeriodNumber(b) === selectedEvidencePeriod) ||
    projectBudgets[0]

  // 연차별 예산 총액 계산
  const annualBudgetTotal =
    (parseFloat(targetBudget.government_funding_amount) || 0) +
    (parseFloat(targetBudget.company_cash_amount) || 0) +
    (parseFloat(targetBudget.company_in_kind_amount) || 0)

  // 연차별 예산의 현금/현물 구성
  const annualBudgetCash =
    (parseFloat(targetBudget.government_funding_amount) || 0) +
    (parseFloat(targetBudget.company_cash_amount) || 0)
  const annualBudgetInKind = parseFloat(targetBudget.company_in_kind_amount) || 0

  // 연구개발비의 현금/현물 각각 계산
  const researchCostCash =
    (parseFloat(targetBudget.personnel_cost_cash) || 0) +
    (parseFloat(targetBudget.research_material_cost_cash) || 0) +
    (parseFloat(targetBudget.research_activity_cost_cash) || 0) +
    (parseFloat(targetBudget.research_stipend_cash) || 0) +
    (parseFloat(targetBudget.indirect_cost_cash) || 0)

  const researchCostInKind =
    (parseFloat(targetBudget.personnel_cost_in_kind) || 0) +
    (parseFloat(targetBudget.research_material_cost_in_kind) || 0) +
    (parseFloat(targetBudget.research_activity_cost_in_kind) || 0) +
    (parseFloat(targetBudget.research_stipend_in_kind) || 0) +
    (parseFloat(targetBudget.indirect_cost_in_kind) || 0)

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
 * 사업비 합계 계산
 */
export function calculateBudgetTotals(projectBudgets: any[]) {
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
      // 모든 항목을 예산 편성 데이터에서 직접 가져오기 (미래 기간 구분 없이)
      acc.personnelCash += parseFloat(budget.personnel_cost_cash) || 0
      acc.personnelInKind += parseFloat(budget.personnel_cost_in_kind) || 0
      acc.researchMaterialCash += parseFloat(budget.research_material_cost_cash) || 0
      acc.researchMaterialInKind += parseFloat(budget.research_material_cost_in_kind) || 0
      acc.researchActivityCash += parseFloat(budget.research_activity_cost_cash) || 0
      acc.researchActivityInKind += parseFloat(budget.research_activity_cost_in_kind) || 0
      acc.researchStipendCash += parseFloat(budget.research_stipend_cash) || 0
      acc.researchStipendInKind += parseFloat(budget.research_stipend_in_kind) || 0
      acc.indirectCash += parseFloat(budget.indirect_cost_cash) || 0
      acc.indirectInKind += parseFloat(budget.indirect_cost_in_kind) || 0

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
      totalBudget: 0,
      totalSpent: 0,
    },
  )

  // 총 예산은 각 비목의 합계로 직접 계산 (reduce 외부에서)
  totals.totalBudget =
    totals.personnelCash +
    totals.personnelInKind +
    totals.researchMaterialCash +
    totals.researchMaterialInKind +
    totals.researchActivityCash +
    totals.researchActivityInKind +
    totals.researchStipendCash +
    totals.researchStipendInKind +
    totals.indirectCash +
    totals.indirectInKind

  totals.totalCash =
    totals.personnelCash +
    totals.researchMaterialCash +
    totals.researchActivityCash +
    totals.researchStipendCash +
    totals.indirectCash
  totals.totalInKind =
    totals.personnelInKind +
    totals.researchMaterialInKind +
    totals.researchActivityInKind +
    totals.researchStipendInKind +
    totals.indirectInKind

  return totals
}

/**
 * 인건비 요약 계산 (해당 연차의 인건비 합계 및 월별 상세)
 */
export function calculatePersonnelCostSummary(projectMembers: any[], projectBudgets: any[]) {
  if (
    !projectMembers ||
    projectMembers.length === 0 ||
    !projectBudgets ||
    projectBudgets.length === 0
  ) {
    return {
      totalCash: 0,
      totalInKind: 0,
      totalCost: 0,
      monthlyCosts: [],
      periodInfo: null,
    }
  }

  // 현재 연차의 첫 번째 사업비 정보를 기준으로 기간 설정
  const currentBudget = projectBudgets[0]
  if (!currentBudget.start_date || !currentBudget.end_date) {
    return {
      totalCash: 0,
      totalInKind: 0,
      totalCost: 0,
      monthlyCosts: [],
      periodInfo: null,
    }
  }

  const startDate = new Date(currentBudget.start_date)
  const endDate = new Date(currentBudget.end_date)

  let totalCash = 0
  let totalInKind = 0
  const monthlyCosts: any[] = []

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
      const memberStartDate = new Date(member.startDate || member.start_date)
      const memberEndDate = new Date(member.endDate || member.end_date)
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = new Date(year, month, 0) // 해당 월의 마지막 날

      // 해당 월에 참여하는지 확인
      if (memberStartDate <= monthEnd && memberEndDate >= monthStart) {
        const cashAmount = parseFloat(member.cash_amount || member.cashAmount || '0') || 0
        const inKindAmount = parseFloat(member.in_kind_amount || member.inKindAmount || '0') || 0

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
  totalCash = monthlyCosts.reduce((sum, month) => sum + month.cash, 0)
  totalInKind = monthlyCosts.reduce((sum, month) => sum + month.inKind, 0)
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
