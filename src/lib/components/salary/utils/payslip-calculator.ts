import type { Allowance, Deduction, EmployeeContract } from '../types'
import { SALARY_VALIDATION_TOLERANCE, CORE_SALARY_ALLOWANCE_IDS } from '../constants'

/**
 * 급여 총액 계산
 * @param allowances - 수당 목록
 * @param deductions - 공제 목록
 * @returns 지급총액, 공제총액, 실지급액
 */
export function calculateTotals(allowances: Allowance[], deductions: Deduction[]) {
  const totalPayments = allowances.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalDeductions = deductions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const netSalary = totalPayments - totalDeductions

  return {
    totalPayments,
    totalDeductions,
    netSalary,
  }
}

/**
 * 급여 검증 결과 타입
 */
export type ValidationResult = {
  isValid: boolean
  coreSalaryTotal: number
  contractSalary: number
  difference: number
}

/**
 * 급여 총액 검증
 * 기본급 + 차량유지 + 식대의 합계가 계약 급여와 일치하는지 확인
 * @param allowances - 수당 목록
 * @param contract - 급여 계약 정보
 * @returns 검증 결과 (contract가 없으면 null)
 */
export function validateSalaryAmount(
  allowances: Allowance[],
  contract: EmployeeContract | null,
): ValidationResult | null {
  if (!contract) {
    return null
  }

  const basicSalary = Number(allowances.find((a) => a.id === 'basic_salary')?.amount || 0)

  const vehicleMaintenance = Number(
    allowances.find((a) => a.id === 'vehicle_maintenance')?.amount || 0,
  )

  const mealAllowance = Number(allowances.find((a) => a.id === 'meal_allowance')?.amount || 0)

  const coreSalaryTotal = basicSalary + vehicleMaintenance + mealAllowance
  const contractSalary = contract.monthlySalary || 0

  const isValid = Math.abs(coreSalaryTotal - contractSalary) <= SALARY_VALIDATION_TOLERANCE

  return {
    isValid,
    coreSalaryTotal,
    contractSalary,
    difference: coreSalaryTotal - contractSalary,
  }
}

/**
 * 급여 검증 메시지 생성
 * @param validation - 검증 결과
 * @param formatNumber - 숫자 포맷팅 함수
 * @returns 검증 메시지 (검증 결과가 없으면 null)
 */
export function getSalaryValidationMessage(
  validation: ValidationResult | null,
  formatNumber: (value: number, withComma: boolean, suffix: string) => string,
): {
  type: 'success' | 'error'
  message: string
} | null {
  if (!validation) return null

  if (validation.isValid) {
    return {
      type: 'success',
      message: '✅ 급여 총액이 계약 조건과 일치합니다.',
    }
  } else {
    const diffText = formatNumber(Math.abs(validation.difference), true, '원')

    return {
      type: 'error',
      message: `⚠️ 급여 총액 불일치: 계약 급여(${formatNumber(validation.contractSalary, true, '원')})와 차이 ${diffText}`,
    }
  }
}
