/**
 * useTransactions Hook
 * 거래 내역 관리 비즈니스 로직
 */

import { transactionService } from '$lib/finance/services/transaction-service'
import { financeStore } from '$lib/stores/finance'
import { pushToast } from '$lib/stores/toasts'
import type {
  CreateTransactionRequest,
  TransactionFilter,
  UpdateTransactionRequest,
} from '$lib/finance/types'

export function useTransactions() {
  const store = financeStore

  /**
   * 거래 내역 목록 로드
   */
  async function loadTransactions(filter?: TransactionFilter, page = 1, limit = 20) {
    store.setLoading(true)
    store.clearError()

    try {
      const result = await transactionService.getTransactions({ ...filter, page, limit })
      console.log('💳 [useTransactions] loadTransactions 완료:', {
        count: result.transactions.length,
        total: result.pagination.total,
        withBalance: result.transactions.filter(
          (t) => t.balance !== null && t.balance !== undefined,
        ).length,
      })
      store.setTransactions(result.transactions)
      store.setTransactionPagination(result.pagination)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '거래 내역을 불러오는데 실패했습니다.'
      store.setError(message)
      pushToast({ message, type: 'error' })
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * 특정 거래 조회
   */
  async function loadTransaction(id: string) {
    store.setLoading(true)

    try {
      const transaction = await transactionService.getTransaction(id)
      return transaction
    } catch (error) {
      const message = error instanceof Error ? error.message : '거래를 조회할 수 없습니다.'
      pushToast({ message, type: 'error' })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * 거래 생성
   */
  async function createTransaction(data: CreateTransactionRequest) {
    store.setLoading(true)

    try {
      await transactionService.createTransaction(data)
      pushToast({ message: '거래가 등록되었습니다.', type: 'success' })
      await loadTransactions() // 목록 새로고침
      store.closeTransactionModal()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '거래 등록에 실패했습니다.'
      pushToast({ message, type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 거래 수정
   */
  async function updateTransaction(id: string, data: UpdateTransactionRequest) {
    store.setLoading(true)

    try {
      await transactionService.updateTransaction(id, data)
      pushToast({ message: '거래가 수정되었습니다.', type: 'success' })
      await loadTransactions() // 목록 새로고침
      store.closeTransactionModal()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '거래 수정에 실패했습니다.'
      pushToast({ message, type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 거래 삭제
   */
  async function deleteTransaction(id: string) {
    store.setLoading(true)

    try {
      await transactionService.deleteTransaction(id)
      pushToast({ message: '거래가 삭제되었습니다.', type: 'success' })
      await loadTransactions() // 목록 새로고침
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '거래 삭제에 실패했습니다.'
      pushToast({ message, type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 거래 통계 조회
   */
  async function loadTransactionStats(filter?: TransactionFilter) {
    store.setLoading(true)

    try {
      const stats = await transactionService.getTransactionStats(filter)
      store.setTransactionStats(stats)
    } catch (error) {
      const message = error instanceof Error ? error.message : '거래 통계를 조회할 수 없습니다.'
      pushToast({ message, type: 'error' })
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * 일별 거래 요약
   */
  async function loadDailyTransactionSummary(date: string) {
    store.setLoading(true)

    try {
      const summary = await transactionService.getDailyTransactionSummary(date)
      return summary
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '일별 거래 요약을 조회할 수 없습니다.'
      pushToast({ message, type: 'error' })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * 월별 거래 요약
   */
  async function loadMonthlyTransactionSummary(year: number, month: number) {
    store.setLoading(true)

    try {
      const summary = await transactionService.getMonthlyTransactionSummary(year, month)
      return summary
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '월별 거래 요약을 조회할 수 없습니다.'
      pushToast({ message, type: 'error' })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * 거래 내역 일괄 업로드
   */
  async function uploadTransactions(file: File) {
    store.setLoading(true)

    try {
      const result = await transactionService.uploadTransactions(file)
      pushToast({
        message: `거래 내역 업로드 완료 (성공: ${result.success}건, 실패: ${result.failed}건)`,
        type: result.failed > 0 ? 'error' : 'success',
      })
      await loadTransactions() // 목록 새로고침
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : '거래 내역 업로드에 실패했습니다.'
      pushToast({ message, type: 'error' })
      store.setLoading(false)
      return null
    }
  }

  /**
   * 필터 설정
   */
  function setFilter(filter: Partial<TransactionFilter>) {
    store.setTransactionFilter(filter)
    loadTransactions(filter)
  }

  /**
   * 필터 초기화
   */
  function resetFilter() {
    store.resetTransactionFilter()
    loadTransactions()
  }

  /**
   * 페이지 변경
   */
  function setPage(page: number) {
    store.setTransactionPage(page)
    loadTransactions(undefined, page)
  }

  return {
    store,
    loadTransactions,
    loadTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    loadTransactionStats,
    loadDailyTransactionSummary,
    loadMonthlyTransactionSummary,
    uploadTransactions,
    setFilter,
    resetFilter,
    setPage,
  }
}
