/**
 * useBudgets Hook
 * 예산 관리 비즈니스 로직
 */

import { financeStore } from '$lib/stores/finance'
import type {
  BudgetFilter,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '$lib/finance/types/budget'

export function useBudgets() {
  const store = financeStore

  /**
   * 예산 목록 로드
   */
  async function loadBudgets(filter?: BudgetFilter) {
    // TODO: 예산 서비스 구현 시 활성화
    // store.setLoading(true)
    // store.clearError()
    // try {
    //   const budgets = await budgetService.getBudgets(filter)
    //   store.setBudgets(budgets)
    // } catch (error) {
    //   const message = error instanceof Error ? error.message : '예산 목록을 불러오는데 실패했습니다.'
    //   store.setError(message)
    //   pushToast({ message, type: 'error' })
    // } finally {
    //   store.setLoading(false)
    // }
  }

  /**
   * 예산 생성
   */
  async function createBudget(data: CreateBudgetRequest) {
    // TODO: 예산 서비스 구현 시 활성화
    return false
  }

  /**
   * 예산 수정
   */
  async function updateBudget(id: string, data: UpdateBudgetRequest) {
    // TODO: 예산 서비스 구현 시 활성화
    return false
  }

  /**
   * 예산 삭제
   */
  async function deleteBudget(id: string) {
    // TODO: 예산 서비스 구현 시 활성화
    return false
  }

  /**
   * 예산 분석 조회
   */
  async function loadBudgetAnalysis(year: number, month?: number) {
    // TODO: 예산 서비스 구현 시 활성화
    return null
  }

  /**
   * 필터 설정
   */
  function setFilter(filter: Partial<BudgetFilter>) {
    store.setBudgetFilter(filter)
    loadBudgets(filter)
  }

  /**
   * 필터 초기화
   */
  function resetFilter() {
    store.resetBudgetFilter()
    loadBudgets()
  }

  return {
    store,
    loadBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    loadBudgetAnalysis,
    setFilter,
    resetFilter,
  }
}
