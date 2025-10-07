/**
 * Payslip Service
 * 급여명세서 관련 API 호출을 담당하는 서비스 레이어
 */

import type { ApiResponse, Payslip, SalaryHistory } from '$lib/types/salary'

/**
 * 급여명세서 목록 조회
 */
export async function fetchPayslips(): Promise<ApiResponse<Payslip[]>> {
  try {
    const response = await fetch('/api/salary/payslips')
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여명세서 목록을 불러오는데 실패했습니다.',
    }
  }
}

/**
 * 특정 직원의 급여명세서 조회
 */
export async function fetchEmployeePayslips(employeeId: string): Promise<ApiResponse<Payslip[]>> {
  try {
    const response = await fetch(`/api/salary/payslips/employee/${employeeId}`)
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '직원 급여명세서를 불러오는데 실패했습니다.',
    }
  }
}

/**
 * 급여명세서 생성
 */
export async function createPayslip(
  employeeId: string,
  period: string,
): Promise<ApiResponse<Payslip>> {
  try {
    const response = await fetch('/api/salary/payslips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, period }),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여명세서 생성에 실패했습니다.',
    }
  }
}

/**
 * 급여명세서 수정
 */
export async function updatePayslip(
  payslipId: string,
  updates: Partial<Payslip>,
): Promise<ApiResponse<Payslip>> {
  try {
    const response = await fetch(`/api/salary/payslips/${payslipId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여명세서 수정에 실패했습니다.',
    }
  }
}

/**
 * 급여명세서 삭제
 */
export async function deletePayslip(payslipId: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const response = await fetch(`/api/salary/payslips/${payslipId}`, {
      method: 'DELETE',
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여명세서 삭제에 실패했습니다.',
    }
  }
}

/**
 * 급여명세서 다운로드
 */
export async function downloadPayslip(
  payslipId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/salary/payslips/${payslipId}/download`)

    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payslip-${payslipId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      return { success: true }
    } else {
      return { success: false, error: '급여명세서 다운로드에 실패했습니다.' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여명세서 다운로드에 실패했습니다.',
    }
  }
}

/**
 * 급여 이력 조회
 */
export async function fetchSalaryHistory(
  employeeId?: string,
): Promise<ApiResponse<SalaryHistory[]>> {
  try {
    const url = employeeId ? `/api/salary/history/${employeeId}` : '/api/salary/history'
    const response = await fetch(url)
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여 이력을 불러오는데 실패했습니다.',
    }
  }
}

/**
 * 급여명세서 템플릿 업로드
 */
export async function uploadPayslipTemplate(formData: FormData): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/salary/payslips/upload', {
      method: 'POST',
      body: formData,
    })
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '급여명세서 업로드에 실패했습니다.',
    }
  }
}
