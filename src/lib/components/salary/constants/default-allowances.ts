import type { Allowance, EmployeeContract } from '../types'

/**
 * 급여 수당 기본값 생성
 * @param contract - 직원 급여 계약 정보
 * @returns 기본 수당 항목 배열
 */
export function createDefaultAllowances(contract?: EmployeeContract | null): Allowance[] {
  const monthlySalary = contract?.monthlySalary || 0

  return [
    {
      id: 'basic_salary',
      name: '기본급',
      type: 'basic',
      amount: monthlySalary,
      isTaxable: true,
    },
    {
      id: 'position_allowance',
      name: '직책수당',
      type: 'allowance',
      amount: 0,
      isTaxable: true,
    },
    {
      id: 'bonus',
      name: '상여금',
      type: 'bonus',
      amount: 0,
      isTaxable: true,
    },
    {
      id: 'meal_allowance',
      name: '식대',
      type: 'allowance',
      amount: 0,
      isTaxable: false,
    },
    {
      id: 'vehicle_maintenance',
      name: '차량유지',
      type: 'allowance',
      amount: 0,
      isTaxable: false,
    },
    {
      id: 'annual_leave_allowance',
      name: '연차수당',
      type: 'allowance',
      amount: 0,
      isTaxable: true,
    },
    {
      id: 'year_end_settlement',
      name: '연말정산',
      type: 'settlement',
      amount: 0,
      isTaxable: true,
    },
  ]
}
