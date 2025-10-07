/**
 * Salary Statistics Service
 * 급여 통계 관련 API 호출을 담당하는 서비스 레이어
 */

import type { ApiResponse, SalaryStructure } from '$lib/types/salary'

/**
 * 급여 구조 목록 조회
 */
export async function fetchSalaryStructures(): Promise<ApiResponse<SalaryStructure[]>> {
  try {
    const response = await fetch('/api/salary/structures')
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 구조 목록을 불러오는데 실패했습니다.',
    }
  }
}

/**
 * 급여 구조 생성
 */
export async function createSalaryStructure(
  structure: Omit<SalaryStructure, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ApiResponse<SalaryStructure>> {
  try {
    const response = await fetch('/api/salary/structures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(structure),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 구조 추가에 실패했습니다.',
    }
  }
}

/**
 * 급여 구조 수정
 */
export async function updateSalaryStructure(
  id: string,
  updates: Partial<SalaryStructure>,
): Promise<ApiResponse<SalaryStructure>> {
  try {
    const response = await fetch(`/api/salary/structures/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 구조 수정에 실패했습니다.',
    }
  }
}

/**
 * 급여 구조 삭제
 */
export async function deleteSalaryStructure(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const response = await fetch(`/api/salary/structures/${id}`, {
      method: 'DELETE',
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 구조 삭제에 실패했습니다.',
    }
  }
}
