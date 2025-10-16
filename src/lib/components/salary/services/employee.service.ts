import { formatKoreanNameStandard, sortKoreanNames, splitKoreanName } from '$lib/utils/korean-name'
import type { Employee, EmployeeContract } from '../types'

/**
 * 직원 목록 조회
 * @param limit - 조회할 최대 직원 수
 * @returns 직원 목록
 * @throws API 호출 실패 시 에러
 */
export async function fetchEmployeeList(limit: number = 100): Promise<Employee[]> {
  const response = await fetch(`/api/hr/employees?limit=${limit}`)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.success && result.data && result.data.data && Array.isArray(result.data.data)) {
    return result.data.data
      .map((emp: any) => {
        const standardName = formatKoreanNameStandard(emp.name || '')
        const { surname, givenName } = splitKoreanName(standardName)

        return {
          id: emp.id,
          employeeId: emp.employeeId,
          name: standardName,
          formatted_name: standardName,
          last_name: surname,
          first_name: givenName,
          department: emp.department || '부서없음',
          position: emp.position,
          hireDate: emp.hireDate,
          status: emp.status,
        }
      })
      .sort((a, b) => sortKoreanNames(a.name || '', b.name || ''))
  }

  return []
}

/**
 * 직원 급여 계약 정보 조회
 * @param employeeId - 직원 ID
 * @returns 급여 계약 정보 (없으면 null)
 * @throws API 호출 실패 시 에러
 */
export async function fetchEmployeeContract(employeeId: string): Promise<EmployeeContract | null> {
  if (!employeeId) {
    return null
  }

  const response = await fetch(`/api/salary/contracts?employeeId=${employeeId}`)
  const result = await response.json()

  if (
    result.success &&
    result.data?.data &&
    Array.isArray(result.data.data) &&
    result.data.data.length > 0
  ) {
    // 활성 계약 중 종료일이 없거나 미래인 계약 찾기
    const currentContract = result.data.data.find(
      (contract: EmployeeContract) =>
        contract.status === 'active' &&
        (!contract.endDate || new Date(contract.endDate) > new Date()),
    )

    return currentContract || null
  }

  return null
}
