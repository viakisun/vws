/**
 * TransactionManagement 유틸리티 함수들
 */

import type { Transaction, Account, CreateTransactionRequest } from '$lib/finance/types'
import type { FilteredStatistics } from '$lib/finance/types/transaction-state'
import { getCurrentUTCTimestamp, convertToDateTimeLocal } from './transaction-formatters'

/**
 * 서버 사이드 필터링을 위한 쿼리 파라미터 구성
 */
export function buildQueryParams(params: {
  selectedAccount: string
  dateFrom: string
  dateTo: string
  searchTerm: string
}): Record<string, any> {
  const queryParams: Record<string, any> = {}

  if (params.selectedAccount) {
    queryParams.accountId = params.selectedAccount
  }

  if (params.dateFrom) {
    queryParams.dateFrom = params.dateFrom + 'T00:00:00Z'
  }

  if (params.dateTo) {
    queryParams.dateTo = params.dateTo + 'T23:59:59Z'
  }

  if (params.searchTerm) {
    queryParams.search = params.searchTerm
  }

  // 전체 계좌인 경우 리미트 해제, 특정 계좌인 경우 기본 리미트 적용
  if (!params.selectedAccount) {
    queryParams.limit = 1000
  } else {
    queryParams.limit = 100
  }

  return queryParams
}

/**
 * 거래 필터링
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: {
    searchTerm: string
    selectedAccount: string
  },
): Transaction[] {
  return transactions.filter((transaction) => {
    // 검색어 필터
    if (
      filters.searchTerm &&
      !transaction.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
    ) {
      return false
    }
    // 계좌 필터
    if (filters.selectedAccount && transaction.accountId !== filters.selectedAccount) {
      return false
    }
    return true
  })
}

/**
 * 계좌 필터링
 */
export function filterAccounts(activeAccounts: Account[], selectedAccount: string): Account[] {
  return selectedAccount
    ? activeAccounts.filter((account) => account.id === selectedAccount)
    : activeAccounts
}

/**
 * 거래 통계 계산
 */
export function calculateStatistics(transactions: Transaction[]): FilteredStatistics {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netAmount = totalIncome - totalExpense

  return {
    totalIncome,
    totalExpense,
    netAmount,
    count: transactions.length,
  }
}

/**
 * 폼 데이터 초기화
 */
export function getInitialFormData(): CreateTransactionRequest {
  return {
    accountId: '',
    categoryId: '',
    amount: 0,
    type: 'expense',
    description: '',
    transactionDate: getCurrentUTCTimestamp(),
    referenceNumber: '',
    notes: '',
    tags: [],
  }
}

/**
 * 날짜/시간 입력 초기값 가져오기
 */
export function getInitialDateTimeInput(): string {
  return convertToDateTimeLocal(getCurrentUTCTimestamp())
}
