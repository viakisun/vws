/**
 * Research Development Budget Utility Functions
 * 연구개발사업 예산 관련 유틸리티 함수
 * RDDetailView에서 사용하는 예산 데이터 처리 함수들
 */

/**
 * 예산 필드 접근 유틸리티 - camelCase와 snake_case 모두 지원
 */
export function getBudgetField<T>(
  budget: Record<string, any>,
  camelCase: string,
  snakeCase: string,
  defaultValue: T,
): T {
  return budget?.[camelCase] || budget?.[snakeCase] || defaultValue
}

/**
 * 예산 기간(연차) 번호 가져오기
 */
export function getPeriodNumber(budget: Record<string, any>): number {
  return getBudgetField(budget, 'periodNumber', 'period_number', 1)
}

/**
 * 예산 시작일 가져오기
 */
export function getStartDate(budget: Record<string, any>): string {
  return getBudgetField(budget, 'startDate', 'start_date', '')
}

/**
 * 예산 종료일 가져오기
 */
export function getEndDate(budget: Record<string, any>): string {
  return getBudgetField(budget, 'endDate', 'end_date', '')
}

/**
 * 회계연도 가져오기
 */
export function getFiscalYear(budget: Record<string, any>): string {
  return getBudgetField(budget, 'fiscalYear', 'period_number', '')
}

/**
 * 인건비 총액 가져오기
 */
export function getPersonnelCost(budget: Record<string, any>): number {
  return getBudgetField(budget, 'personnelCost', 'personnel_cost', 0)
}

/**
 * 인건비 현금 금액 가져오기
 */
export function getPersonnelCostCash(budget: Record<string, any>): number {
  return getBudgetField(budget, 'personnelCostCash', 'personnel_cost_cash', 0)
}

/**
 * 인건비 현물 금액 가져오기
 */
export function getPersonnelCostInKind(budget: Record<string, any>): number {
  return getBudgetField(budget, 'personnelCostInKind', 'personnel_cost_in_kind', 0)
}

/**
 * 연구재료비 총액 가져오기
 */
export function getResearchMaterialCost(budget: Record<string, any>): number {
  return getBudgetField(budget, 'researchMaterialCost', 'research_material_cost', 0)
}

/**
 * 연구재료비 현금 금액 가져오기
 */
export function getResearchMaterialCostCash(budget: Record<string, any>): number {
  return getBudgetField(budget, 'researchMaterialCostCash', 'research_material_cost_cash', 0)
}

/**
 * 연구재료비 현물 금액 가져오기
 */
export function getResearchMaterialCostInKind(budget: Record<string, any>): number {
  return getBudgetField(budget, 'researchMaterialCostInKind', 'research_material_cost_in_kind', 0)
}

/**
 * 연구활동비 총액 가져오기
 */
export function getResearchActivityCost(budget: Record<string, any>): number {
  return getBudgetField(budget, 'researchActivityCost', 'research_activity_cost', 0)
}

/**
 * 연구활동비 현금 금액 가져오기
 */
export function getResearchActivityCostCash(budget: Record<string, any>): number {
  return getBudgetField(budget, 'researchActivityCostCash', 'research_activity_cost_cash', 0)
}

/**
 * 연구활동비 현물 금액 가져오기
 */
export function getResearchActivityCostInKind(budget: Record<string, any>): number {
  return getBudgetField(budget, 'researchActivityCostInKind', 'research_activity_cost_in_kind', 0)
}

/**
 * 연구수당 총액 가져오기
 */
export function getResearchStipend(budget: Record<string, any>): number {
  return getBudgetField(budget, 'researchStipend', 'research_stipend', 0)
}

/**
 * 연구수당 현금 금액 가져오기
 */
export function getResearchStipendCash(budget: Record<string, any>): number {
  return getBudgetField(budget, 'researchStipendCash', 'research_stipend_cash', 0)
}

/**
 * 연구수당 현물 금액 가져오기
 */
export function getResearchStipendInKind(budget: Record<string, any>): number {
  return getBudgetField(budget, 'researchStipendInKind', 'research_stipend_in_kind', 0)
}

/**
 * 간접비 총액 가져오기
 */
export function getIndirectCost(budget: Record<string, any>): number {
  return getBudgetField(budget, 'indirectCost', 'indirect_cost', 0)
}

/**
 * 간접비 현금 금액 가져오기
 */
export function getIndirectCostCash(budget: Record<string, any>): number {
  return getBudgetField(budget, 'indirectCostCash', 'indirect_cost_cash', 0)
}

/**
 * 간접비 현물 금액 가져오기
 */
export function getIndirectCostInKind(budget: Record<string, any>): number {
  return getBudgetField(budget, 'indirectCostInKind', 'indirect_cost_in_kind', 0)
}

/**
 * 연차 표시 포맷 (예: "1차년도")
 */
export function formatPeriodDisplay(budget: Record<string, any>): string {
  const period = getPeriodNumber(budget)
  return `${period}차년도`
}

/**
 * 연차 툴팁 포맷 (기간 포함)
 */
export function formatPeriodTooltip(budget: Record<string, any>): string {
  const period = getPeriodNumber(budget)
  const startDate = getStartDate(budget)
  const endDate = getEndDate(budget)

  if (!startDate || !endDate) {
    return `${period}차년도`
  }

  return `${period}차년도 (${startDate} ~ ${endDate})`
}

/**
 * 예산 총액 계산 (모든 비목의 합)
 */
export function calculateTotalBudget(budget: Record<string, any>): {
  cash: number
  inKind: number
  total: number
} {
  const personnelCash = getPersonnelCostCash(budget)
  const personnelInKind = getPersonnelCostInKind(budget)
  const materialCash = getResearchMaterialCostCash(budget)
  const materialInKind = getResearchMaterialCostInKind(budget)
  const activityCash = getResearchActivityCostCash(budget)
  const activityInKind = getResearchActivityCostInKind(budget)
  const stipendCash = getResearchStipendCash(budget)
  const stipendInKind = getResearchStipendInKind(budget)
  const indirectCash = getIndirectCostCash(budget)
  const indirectInKind = getIndirectCostInKind(budget)

  const cash = personnelCash + materialCash + activityCash + stipendCash + indirectCash
  const inKind = personnelInKind + materialInKind + activityInKind + stipendInKind + indirectInKind

  return {
    cash,
    inKind,
    total: cash + inKind,
  }
}

/**
 * 여러 예산의 합계 계산
 */
export function calculateBudgetTotals(budgets: Record<string, any>[]): {
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
  grandTotal: number
} {
  const totals = {
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
    grandTotal: 0,
  }

  budgets.forEach((budget) => {
    totals.personnelCash += getPersonnelCostCash(budget)
    totals.personnelInKind += getPersonnelCostInKind(budget)
    totals.researchMaterialCash += getResearchMaterialCostCash(budget)
    totals.researchMaterialInKind += getResearchMaterialCostInKind(budget)
    totals.researchActivityCash += getResearchActivityCostCash(budget)
    totals.researchActivityInKind += getResearchActivityCostInKind(budget)
    totals.researchStipendCash += getResearchStipendCash(budget)
    totals.researchStipendInKind += getResearchStipendInKind(budget)
    totals.indirectCash += getIndirectCostCash(budget)
    totals.indirectInKind += getIndirectCostInKind(budget)
  })

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

  totals.grandTotal = totals.totalCash + totals.totalInKind

  return totals
}

/**
 * 날짜를 ISO 형식으로 변환
 */
export function convertDateToISO(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().split('T')[0]
}
