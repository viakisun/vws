import type { EmployeeContract } from '../types'

/**
 * 특정 연월이 계약 기간 내에 있는지 확인
 * @param contract - 급여 계약 정보
 * @param year - 연도
 * @param month - 월 (1~12)
 * @returns 계약 기간 내 여부 (계약 정보가 없거나 시작일이 없으면 true)
 */
export function isWithinContractPeriod(
  contract: EmployeeContract | null,
  year: number,
  month: number,
): boolean {
  if (!contract || !contract.startDate) {
    return true
  }

  const contractStartDate = new Date(contract.startDate)
  const contractEndDate = contract.endDate ? new Date(contract.endDate) : null

  const monthStartDate = new Date(year, month - 1, 1)
  const monthEndDate = new Date(year, month, 0)

  // 해당 월의 마지막 날이 계약 시작일보다 이전이면 계약 기간 밖
  if (monthEndDate < contractStartDate) {
    return false
  }

  // 계약 종료일이 있고, 해당 월의 첫 날이 계약 종료일보다 이후이면 계약 기간 밖
  if (contractEndDate && monthStartDate > contractEndDate) {
    return false
  }

  return true
}
