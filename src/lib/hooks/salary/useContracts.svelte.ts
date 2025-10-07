/**
 * useContracts Hook
 * 급여 계약 관리 비즈니스 로직
 */

import * as contractService from '$lib/services/salary/contract.service'
import { salaryStore } from '$lib/stores/salary'
import { pushToast } from '$lib/stores/toasts'
import type {
  CreateSalaryContractRequest,
  SalaryContractFilter,
  UpdateSalaryContractRequest,
} from '$lib/types/salary-contracts'

export function useContracts() {
  const store = salaryStore

  /**
   * 급여 계약 목록 로드
   */
  async function loadContracts(filter?: Partial<SalaryContractFilter>) {
    store.setLoading(true)
    store.clearError()

    const result = await contractService.fetchContracts(
      filter,
      store.ui.pagination.contractPage,
      store.ui.pagination.contractLimit,
    )

    if (result.success && result.data) {
      store.setContracts(result.data.data, result.data.total)
    } else {
      store.setError(result.error || '급여 계약 목록을 불러오는데 실패했습니다.')
      pushToast({ message: result.error || '급여 계약 목록을 불러오는데 실패했습니다.', type: 'error' })
    }

    store.setLoading(false)
  }

  /**
   * 급여 계약 통계 로드
   */
  async function loadContractStats() {
    const result = await contractService.fetchContractStats()

    if (result.success && result.data) {
      store.setContractStats(result.data)
    } else {
      pushToast({ message: result.error || '급여 계약 통계를 불러오는데 실패했습니다.', type: 'error' })
    }
  }

  /**
   * 직원별 급여 정보 로드
   */
  async function loadEmployeeSalaryInfo(employeeId: string) {
    store.setLoading(true)
    const result = await contractService.fetchEmployeeSalaryInfo(employeeId)

    if (result.success && result.data) {
      // currentSalaryInfo는 필요시 store에 추가
      pushToast({ message: '직원 급여 정보를 불러왔습니다.', type: 'success' })
    } else {
      pushToast({ message: result.error || '직원 급여 정보를 불러오는데 실패했습니다.', type: 'error' })
    }

    store.setLoading(false)
  }

  /**
   * 급여 계약 생성
   */
  async function createContract(contractData: CreateSalaryContractRequest) {
    store.setLoading(true)
    const result = await contractService.createContract(contractData)

    if (result.success && result.data) {
      pushToast({ message: '급여 계약이 생성되었습니다.', type: 'success' })
      await loadContracts() // 목록 새로고침
      store.closeContractModal()
      return true
    } else {
      pushToast({ message: result.error || '급여 계약 생성에 실패했습니다.', type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 급여 계약 수정
   */
  async function updateContract(contractId: string, updateData: UpdateSalaryContractRequest) {
    store.setLoading(true)
    const result = await contractService.updateContract(contractId, updateData)

    if (result.success) {
      pushToast({ message: '급여 계약이 수정되었습니다.', type: 'success' })
      await loadContracts() // 목록 새로고침
      store.closeContractModal()
      return true
    } else {
      pushToast({ message: result.error || '급여 계약 수정에 실패했습니다.', type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 급여 계약 삭제
   */
  async function deleteContract(contractId: string) {
    store.setLoading(true)
    const result = await contractService.deleteContract(contractId)

    if (result.success) {
      pushToast({ message: '급여 계약이 삭제되었습니다.', type: 'success' })
      await loadContracts() // 목록 새로고침
      return true
    } else {
      pushToast({ message: result.error || '급여 계약 삭제에 실패했습니다.', type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 필터 설정
   */
  function setFilter(filter: Partial<SalaryContractFilter>) {
    store.setContractFilter(filter)
    loadContracts(filter)
  }

  /**
   * 필터 초기화
   */
  function resetFilter() {
    store.resetContractFilter()
    loadContracts()
  }

  /**
   * 페이지 변경
   */
  function setPage(page: number) {
    store.setContractPage(page)
    loadContracts()
  }

  return {
    store,
    loadContracts,
    loadContractStats,
    loadEmployeeSalaryInfo,
    createContract,
    updateContract,
    deleteContract,
    setFilter,
    resetFilter,
    setPage,
  }
}
