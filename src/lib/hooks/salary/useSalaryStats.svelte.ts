/**
 * useSalaryStats Hook
 * 급여 통계 및 대시보드 비즈니스 로직
 */

import * as salaryStatsService from '$lib/services/salary/salary-stats.service'
import { salaryStore } from '$lib/stores/salary'
import { pushToast } from '$lib/stores/toasts'
import type { SalaryStructure } from '$lib/types/salary'

export function useSalaryStats() {
  const store = salaryStore

  /**
   * 급여 구조 목록 로드
   */
  async function loadSalaryStructures() {
    store.setLoading(true)
    const result = await salaryStatsService.fetchSalaryStructures()

    if (result.success && result.data) {
      store.setSalaryStructures(result.data)
    } else {
      pushToast({
        message: result.error || '급여 구조 목록을 불러오는데 실패했습니다.',
        type: 'error',
      })
    }

    store.setLoading(false)
  }

  /**
   * 급여 구조 생성
   */
  async function createSalaryStructure(
    structure: Omit<SalaryStructure, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    store.setLoading(true)
    const result = await salaryStatsService.createSalaryStructure(structure)

    if (result.success && result.data) {
      pushToast({ message: '급여 구조가 추가되었습니다.', type: 'success' })
      await loadSalaryStructures() // 목록 새로고침
      return true
    } else {
      pushToast({ message: result.error || '급여 구조 추가에 실패했습니다.', type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 급여 구조 수정
   */
  async function updateSalaryStructure(id: string, updates: Partial<SalaryStructure>) {
    store.setLoading(true)
    const result = await salaryStatsService.updateSalaryStructure(id, updates)

    if (result.success) {
      pushToast({ message: '급여 구조가 수정되었습니다.', type: 'success' })
      await loadSalaryStructures() // 목록 새로고침
      return true
    } else {
      pushToast({ message: result.error || '급여 구조 수정에 실패했습니다.', type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 급여 구조 삭제
   */
  async function deleteSalaryStructure(id: string) {
    store.setLoading(true)
    const result = await salaryStatsService.deleteSalaryStructure(id)

    if (result.success) {
      pushToast({ message: '급여 구조가 삭제되었습니다.', type: 'success' })
      await loadSalaryStructures() // 목록 새로고침
      return true
    } else {
      pushToast({ message: result.error || '급여 구조 삭제에 실패했습니다.', type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 대시보드용 통계 계산
   */
  function getDashboardStats() {
    return {
      currentPeriod: store.statistics.currentPeriod,
      previousPeriod: store.statistics.previousPeriod,
      currentMonth: store.statistics.currentMonth,
      previousMonth: store.statistics.previousMonth,
      departmentStats: store.statistics.departmentStats,
      activeContracts: store.activeContracts.length,
      totalContracts: store.data.contracts.length,
    }
  }

  /**
   * 액션 아이템 계산 (처리 필요 항목)
   */
  function getActionItems() {
    const currentPeriod = store.statistics.currentPeriod
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    // 이번 달 급여명세서 미작성
    const activeEmployees = store.activeContracts.length
    const currentPayslips = store.data.payslips.filter((p) => p.period === currentPeriod).length
    const missingPayslips = activeEmployees - currentPayslips

    // 계약 만료 임박 (30일 이내)
    const expiringContracts = store.activeContracts.filter(
      (c) => c.endDate && c.endDate >= today && c.endDate <= thirtyDaysFromNow,
    ).length

    // 승인 대기 (임시 - 실제로는 status로 필터링)
    const pendingApprovals = store.data.payslips.filter((p) => p.status === 'calculated').length

    return {
      missingPayslips,
      expiringContracts,
      pendingApprovals,
      total: missingPayslips + expiringContracts + pendingApprovals,
    }
  }

  return {
    store,
    loadSalaryStructures,
    createSalaryStructure,
    updateSalaryStructure,
    deleteSalaryStructure,
    getDashboardStats,
    getActionItems,
  }
}
