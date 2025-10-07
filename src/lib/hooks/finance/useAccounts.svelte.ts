/**
 * useAccounts Hook
 * 계좌 관리 비즈니스 로직
 */

import { accountService } from '$lib/finance/services/account-service'
import { financeStore } from '$lib/stores/finance'
import { pushToast } from '$lib/stores/toasts'
import type { AccountFilter, CreateAccountRequest, UpdateAccountRequest } from '$lib/finance/types'

export function useAccounts() {
  const store = financeStore

  /**
   * 계좌 목록 로드
   */
  async function loadAccounts(filter?: AccountFilter) {
    store.setLoading(true)
    store.clearError()

    try {
      const accounts = await accountService.getAccounts(filter)
      console.log('📋 [useAccounts] loadAccounts 완료:', {
        count: accounts.length,
        accounts: accounts.map((a) => ({ name: a.name, status: a.status })),
      })
      store.setAccounts(accounts)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '계좌 목록을 불러오는데 실패했습니다.'
      store.setError(message)
      pushToast({ message, type: 'error' })
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * 특정 계좌 조회
   */
  async function loadAccount(id: string) {
    store.setLoading(true)

    try {
      const account = await accountService.getAccount(id)
      return account
    } catch (error) {
      const message = error instanceof Error ? error.message : '계좌를 조회할 수 없습니다.'
      pushToast({ message, type: 'error' })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * 계좌 생성
   */
  async function createAccount(data: CreateAccountRequest) {
    store.setLoading(true)

    try {
      const newAccount = await accountService.createAccount(data)
      pushToast({ message: '계좌가 생성되었습니다.', type: 'success' })
      await loadAccounts() // 목록 새로고침
      store.closeAccountModal()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '계좌 생성에 실패했습니다.'
      pushToast({ message, type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 계좌 수정
   */
  async function updateAccount(id: string, data: UpdateAccountRequest) {
    store.setLoading(true)

    try {
      await accountService.updateAccount(id, data)
      pushToast({ message: '계좌가 수정되었습니다.', type: 'success' })
      await loadAccounts() // 목록 새로고침
      store.closeAccountModal()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '계좌 수정에 실패했습니다.'
      pushToast({ message, type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 계좌 삭제
   */
  async function deleteAccount(id: string) {
    store.setLoading(true)

    try {
      const result = await accountService.deleteAccount(id)
      pushToast({
        message: `계좌가 삭제되었습니다${result.deletedTransactionCount ? ` (거래 내역 ${result.deletedTransactionCount}건 함께 삭제)` : ''}.`,
        type: 'success',
      })
      await loadAccounts() // 목록 새로고침
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '계좌 삭제에 실패했습니다.'
      pushToast({ message, type: 'error' })
      store.setLoading(false)
      return false
    }
  }

  /**
   * 계좌 요약 정보 조회
   */
  async function loadAccountSummary(accountId: string, startDate?: string, endDate?: string) {
    store.setLoading(true)

    try {
      const summary = await accountService.getAccountSummary(accountId, startDate, endDate)
      return summary
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '계좌 요약 정보를 조회할 수 없습니다.'
      pushToast({ message, type: 'error' })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * 은행별 계좌 요약
   */
  async function loadBankSummaries() {
    store.setLoading(true)

    try {
      const summaries = await accountService.getBankSummaries()
      console.log('🏦 [useAccounts] loadBankSummaries 완료:', {
        count: summaries.length,
        summaries: summaries.map((s) => ({
          bank: s.bank?.name,
          totalBalance: s.totalBalance,
          accountCount: s.accountCount,
        })),
      })
      store.setBankSummaries(summaries)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '은행별 요약 정보를 조회할 수 없습니다.'
      pushToast({ message, type: 'error' })
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * 필터 설정
   */
  function setFilter(filter: Partial<AccountFilter>) {
    store.setAccountFilter(filter)
    loadAccounts(filter)
  }

  /**
   * 필터 초기화
   */
  function resetFilter() {
    store.resetAccountFilter()
    loadAccounts()
  }

  return {
    store,
    loadAccounts,
    loadAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    loadAccountSummary,
    loadBankSummaries,
    setFilter,
    resetFilter,
  }
}
