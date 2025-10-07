/**
 * usePayslips Hook
 * 급여명세서 관리 비즈니스 로직
 */

import * as payslipService from '$lib/services/salary/payslip.service'
import { salaryStore } from '$lib/stores/salary'
import { pushToast } from '$lib/stores/toasts'
import type { Payslip } from '$lib/types/salary'

export function usePayslips() {
  const store = salaryStore

  /**
   * 급여명세서 목록 로드
   */
  async function loadPayslips() {
    store.setLoading(true)
    store.clearError()

    const result = await payslipService.fetchPayslips()

    if (result.success && result.data) {
      store.setPayslips(result.data)
    } else {
      store.setError(result.error || '급여명세서 목록을 불러오는데 실패했습니다.')
      pushToast({ message: result.error || '급여명세서 목록을 불러오는데 실패했습니다.', type: 'error' })
    }

    store.setLoading(false)
  }

  /**
   * 특정 직원의 급여명세서 로드
   */
  async function loadEmployeePayslips(employeeId: string) {
    store.setLoading(true)
    const result = await payslipService.fetchEmployeePayslips(employeeId)

    if (result.success && result.data) {
      store.setPayslips(result.data)
      pushToast({ message: '직원 급여명세서를 불러왔습니다.', type: 'error' })
    } else {
      pushToast({ message: result.error || '직원 급여명세서를 불러오는데 실패했습니다.', type: 'error' })
    }

    store.setLoading(false)
  }

  /**
   * 급여명세서 생성
   */
  async function createPayslip(employeeId: string, period: string) {
    store.setLoading(true)
    const result = await payslipService.createPayslip(employeeId, period)

    if (result.success && result.data) {
      pushToast({ message: '급여명세서가 생성되었습니다.', type: 'error' })
      await loadPayslips() // 목록 새로고침
      store.closePayslipModal()
      return true
    } else {
      pushToast({ message: result.error || '급여명세서 생성에 실패했습니다.', type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 급여명세서 수정
   */
  async function updatePayslip(payslipId: string, updates: Partial<Payslip>) {
    store.setLoading(true)
    const result = await payslipService.updatePayslip(payslipId, updates)

    if (result.success) {
      pushToast({ message: '급여명세서가 수정되었습니다.', type: 'error' })
      await loadPayslips() // 목록 새로고침
      store.closePayslipModal()
      return true
    } else {
      pushToast({ message: result.error || '급여명세서 수정에 실패했습니다.', type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 급여명세서 삭제
   */
  async function deletePayslip(payslipId: string) {
    store.setLoading(true)
    const result = await payslipService.deletePayslip(payslipId)

    if (result.success) {
      pushToast({ message: '급여명세서가 삭제되었습니다.', type: 'error' })
      await loadPayslips() // 목록 새로고침
      return true
    } else {
      pushToast({ message: result.error || '급여명세서 삭제에 실패했습니다.', type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 급여명세서 다운로드
   */
  async function downloadPayslip(payslipId: string) {
    store.setLoading(true)
    const result = await payslipService.downloadPayslip(payslipId)

    if (result.success) {
      pushToast({ message: '급여명세서가 다운로드되었습니다.', type: 'error' })
    } else {
      pushToast({ message: result.error || '급여명세서 다운로드에 실패했습니다.', type: 'error' })
    }

    store.setLoading(false)
    return result.success
  }

  /**
   * 급여 이력 로드
   */
  async function loadSalaryHistory(employeeId?: string) {
    store.setLoading(true)
    const result = await payslipService.fetchSalaryHistory(employeeId)

    if (result.success && result.data) {
      store.setSalaryHistory(result.data)
    } else {
      pushToast({ message: result.error || '급여 이력을 불러오는데 실패했습니다.', type: 'error' })
    }

    store.setLoading(false)
  }

  /**
   * 급여명세서 템플릿 업로드
   */
  async function uploadPayslipTemplate(formData: FormData) {
    store.setLoading(true)
    const result = await payslipService.uploadPayslipTemplate(formData)

    if (result.success) {
      pushToast({ message: '급여명세서가 업로드되었습니다.', type: 'error' })
      await loadPayslips() // 목록 새로고침
      return true
    } else {
      pushToast({ message: result.error || '급여명세서 업로드에 실패했습니다.', type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 필터 설정
   */
  function setFilter(filter: Partial<typeof store.ui.filters>) {
    store.setPayslipFilter(filter)
  }

  /**
   * 필터 초기화
   */
  function resetFilter() {
    store.resetPayslipFilter()
  }

  /**
   * 페이지 변경
   */
  function setPage(page: number) {
    store.setPayslipPage(page)
  }

  return {
    store,
    loadPayslips,
    loadEmployeePayslips,
    createPayslip,
    updatePayslip,
    deletePayslip,
    downloadPayslip,
    loadSalaryHistory,
    uploadPayslipTemplate,
    setFilter,
    resetFilter,
    setPage,
  }
}
