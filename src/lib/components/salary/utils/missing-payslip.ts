import type { Employee, PayslipData } from '../types'

/**
 * 누락된 급여명세서 기간 정보
 */
export type MissingPeriod = {
  period: string
  year: number
  month: number
  label: string
}

/**
 * 계약 기간 내 누락된 급여명세서 기간 조회
 * @param employee - 직원 정보
 * @param payslipData - 급여명세서 데이터 목록
 * @returns 누락된 기간 목록
 */
export function getContractPeriodMissingPayslips(
  employee: Employee | null,
  payslipData: PayslipData[],
): MissingPeriod[] {
  if (!employee?.hireDate) {
    return []
  }

  const hireDate = new Date(employee.hireDate)
  const currentDate = new Date()
  const missingPeriods: MissingPeriod[] = []

  const current = new Date(hireDate.getFullYear(), hireDate.getMonth(), 1)
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  while (current <= end) {
    const period = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    const monthData = payslipData.find((month) => month.period === period)

    if (monthData && !monthData.hasData && !monthData.isLocked) {
      missingPeriods.push({
        period,
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        label: `${current.getFullYear()}년 ${current.getMonth() + 1}월`,
      })
    }

    current.setMonth(current.getMonth() + 1)
  }

  return missingPeriods
}

/**
 * 누락된 급여명세서 개수 계산
 * @param payslipData - 급여명세서 데이터 목록
 * @returns 누락된 개수
 */
export function getMissingPayslipCount(payslipData: PayslipData[]): number {
  return payslipData.filter((month) => !month.hasData && !month.isLocked).length
}
