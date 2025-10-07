/**
 * Salary Contract Service
 * 급여 계약 관련 API 호출을 담당하는 서비스 레이어
 */

import type {
  ApiResponse,
  CreateSalaryContractRequest,
  CurrentSalaryInfo,
  PaginatedResponse,
  SalaryContract,
  SalaryContractFilter,
  SalaryContractStats,
  UpdateSalaryContractRequest,
} from '$lib/types/salary-contracts'

/**
 * 급여 계약 목록 조회
 */
export async function fetchContracts(
  filter?: Partial<SalaryContractFilter>,
  page = 1,
  limit = 20,
): Promise<ApiResponse<PaginatedResponse<SalaryContract>>> {
  try {
    const params = new URLSearchParams()
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value) params.append(key, String(value))
      })
    }
    params.append('page', String(page))
    params.append('limit', String(limit))

    const response = await fetch(`/api/salary/contracts?${params.toString()}`)
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 계약 목록을 불러오는데 실패했습니다.',
    }
  }
}

/**
 * 급여 계약 통계 조회
 */
export async function fetchContractStats(): Promise<ApiResponse<SalaryContractStats>> {
  try {
    const response = await fetch('/api/salary/contracts/stats')
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 계약 통계를 불러오는데 실패했습니다.',
    }
  }
}

/**
 * 직원별 급여 정보 조회
 */
export async function fetchEmployeeSalaryInfo(
  employeeId: string,
): Promise<ApiResponse<CurrentSalaryInfo>> {
  try {
    const response = await fetch(`/api/salary/contracts/employee/${employeeId}`)
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '직원 급여 정보를 불러오는데 실패했습니다.',
    }
  }
}

/**
 * 특정 급여 계약 조회
 */
export async function fetchContract(contractId: string): Promise<ApiResponse<SalaryContract>> {
  try {
    const response = await fetch(`/api/salary/contracts/${contractId}`)
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 계약을 불러오는데 실패했습니다.',
    }
  }
}

/**
 * 급여 계약 생성
 */
export async function createContract(
  contractData: CreateSalaryContractRequest,
): Promise<ApiResponse<SalaryContract>> {
  try {
    const response = await fetch('/api/salary/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contractData),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 계약 생성에 실패했습니다.',
    }
  }
}

/**
 * 급여 계약 수정
 */
export async function updateContract(
  contractId: string,
  updateData: UpdateSalaryContractRequest,
): Promise<ApiResponse<SalaryContract>> {
  try {
    const response = await fetch(`/api/salary/contracts/${contractId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 계약 수정에 실패했습니다.',
    }
  }
}

/**
 * 급여 계약 삭제
 */
export async function deleteContract(contractId: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const response = await fetch(`/api/salary/contracts/${contractId}`, {
      method: 'DELETE',
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 계약 삭제에 실패했습니다.',
    }
  }
}
