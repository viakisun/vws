/**
 * Finance Store - Svelte 5 Runes
 * 자금 관리 통합 스토어
 */

import { logger } from '$lib/utils/logger'
import type {
  Account,
  Transaction,
  TransactionStats,
  AccountFilter,
  TransactionFilter,
  BudgetFilter,
  BankSummary,
} from '$lib/finance/types'
import type { Budget } from '$lib/finance/types/budget'

// 데이터 인터페이스
interface FinanceData {
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  bankSummaries: BankSummary[]
  transactionStats: TransactionStats | null
}

// UI 상태 인터페이스
interface FinanceUI {
  loading: boolean
  error: string | null
  modals: {
    showAccountModal: boolean
    showTransactionModal: boolean
    showBudgetModal: boolean
    selectedAccountId: string | null
    selectedTransactionId: string | null
    selectedBudgetId: string | null
  }
  filters: {
    accountFilter: Partial<AccountFilter>
    transactionFilter: Partial<TransactionFilter>
    budgetFilter: Partial<BudgetFilter>
  }
  pagination: {
    transactionPage: number
    transactionLimit: number
    transactionTotal: number
    transactionTotalPages: number
  }
}

// 통계 인터페이스
interface FinanceStatistics {
  totalBalance: number
  activeAccountsCount: number
  monthlyIncome: number
  monthlyExpense: number
  netCashFlow: number
}

// 초기 데이터
const initialData: FinanceData = {
  accounts: [],
  transactions: [],
  budgets: [],
  bankSummaries: [],
  transactionStats: null,
}

// 초기 UI 상태
const initialUI: FinanceUI = {
  loading: false,
  error: null,
  modals: {
    showAccountModal: false,
    showTransactionModal: false,
    showBudgetModal: false,
    selectedAccountId: null,
    selectedTransactionId: null,
    selectedBudgetId: null,
  },
  filters: {
    accountFilter: {},
    transactionFilter: {},
    budgetFilter: {},
  },
  pagination: {
    transactionPage: 1,
    transactionLimit: 20,
    transactionTotal: 0,
    transactionTotalPages: 0,
  },
}

class FinanceStore {
  data = $state<FinanceData>(initialData)
  ui = $state<FinanceUI>(initialUI)

  // ===== Computed Properties =====

  /** 대시보드 통계 - 서버에서 계산된 값 (단일 소스) */
  dashboardStats = $state<{
    totalBalance: number
    activeAccountsCount: number
    monthlyIncome: number
    monthlyExpense: number
    netCashFlow: number
  } | null>(null)

  /** 통계 정보 - dashboardStats 또는 기본값 반환 */
  statistics = $derived.by((): FinanceStatistics => {
    return {
      totalBalance: this.dashboardStats?.totalBalance ?? 0,
      activeAccountsCount:
        this.dashboardStats?.activeAccountsCount ??
        this.data.accounts.filter((acc) => acc.status === 'active').length,
      monthlyIncome: this.dashboardStats?.monthlyIncome ?? 0,
      monthlyExpense: this.dashboardStats?.monthlyExpense ?? 0,
      netCashFlow: this.dashboardStats?.netCashFlow ?? 0,
    }
  })

  /** 필터링된 계좌 목록 */
  get filteredAccounts() {
    let filtered = this.data.accounts

    const filter = this.ui.filters.accountFilter

    if (filter.bankId) {
      filtered = filtered.filter((acc) => acc.bankId === filter.bankId)
    }

    if (filter.accountType) {
      filtered = filtered.filter((acc) => acc.accountType === filter.accountType)
    }

    if (filter.status) {
      filtered = filtered.filter((acc) => acc.status === filter.status)
    }

    if (filter.isPrimary !== undefined) {
      filtered = filtered.filter((acc) => acc.isPrimary === filter.isPrimary)
    }

    if (filter.search) {
      const search = filter.search.toLowerCase()
      filtered = filtered.filter(
        (acc) =>
          acc.name.toLowerCase().includes(search) ||
          acc.accountNumber.toLowerCase().includes(search),
      )
    }

    return filtered
  }

  /** 활성 계좌 목록 */
  get activeAccounts() {
    return this.data.accounts.filter((acc) => acc.status === 'active')
  }

  /** 주 계좌 */
  get primaryAccount() {
    return this.data.accounts.find((acc) => acc.isPrimary) || null
  }

  /** 필터링된 거래 내역 */
  get filteredTransactions() {
    let filtered = this.data.transactions

    const filter = this.ui.filters.transactionFilter

    if (filter.accountId) {
      filtered = filtered.filter((tx) => tx.accountId === filter.accountId)
    }

    if (filter.categoryId) {
      filtered = filtered.filter((tx) => tx.categoryId === filter.categoryId)
    }

    if (filter.type) {
      filtered = filtered.filter((tx) => tx.type === filter.type)
    }

    if (filter.status) {
      filtered = filtered.filter((tx) => tx.status === filter.status)
    }

    if (filter.dateFrom) {
      filtered = filtered.filter((tx) => tx.transactionDate >= filter.dateFrom!)
    }

    if (filter.dateTo) {
      filtered = filtered.filter((tx) => tx.transactionDate <= filter.dateTo!)
    }

    if (filter.amountMin !== undefined) {
      filtered = filtered.filter((tx) => tx.amount >= filter.amountMin!)
    }

    if (filter.amountMax !== undefined) {
      filtered = filtered.filter((tx) => tx.amount <= filter.amountMax!)
    }

    if (filter.search) {
      const search = filter.search.toLowerCase()
      filtered = filtered.filter(
        (tx) =>
          tx.description?.toLowerCase().includes(search) ||
          tx.counterparty?.toLowerCase().includes(search),
      )
    }

    return filtered
  }

  /** 최근 거래 내역 (10건) */
  get recentTransactions() {
    return this.data.transactions.slice(0, 10)
  }

  /** 오늘 거래 내역 */
  get todayTransactions() {
    const today = new Date().toISOString().split('T')[0]
    return this.data.transactions.filter((tx) => tx.transactionDate === today)
  }

  // ===== Data Setters =====

  setAccounts(accounts: Account[]) {
    this.data.accounts = accounts
  }

  setTransactions(transactions: Transaction[]) {
    this.data.transactions = transactions
  }

  setBudgets(budgets: Budget[]) {
    this.data.budgets = budgets
  }

  setBankSummaries(summaries: BankSummary[]) {
    this.data.bankSummaries = summaries
  }

  setTransactionStats(stats: TransactionStats) {
    this.data.transactionStats = stats
  }

  setTransactionPagination(pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }) {
    this.ui.pagination.transactionPage = pagination.page
    this.ui.pagination.transactionLimit = pagination.limit
    this.ui.pagination.transactionTotal = pagination.total
    this.ui.pagination.transactionTotalPages = pagination.totalPages
  }

  setDashboardStats(stats: {
    totalBalance: number
    activeAccountsCount: number
    monthlyIncome: number
    monthlyExpense: number
    netCashFlow: number
  }) {
    this.dashboardStats = stats
    logger.info('📊 [financeStore] 대시보드 통계 업데이트 (서버):', stats)
  }

  // ===== UI State Setters =====

  setLoading(loading: boolean) {
    this.ui.loading = loading
  }

  setError(error: string | null) {
    this.ui.error = error
  }

  clearError() {
    this.ui.error = null
  }

  // ===== Modal Management =====

  openAccountModal(accountId?: string) {
    this.ui.modals.showAccountModal = true
    this.ui.modals.selectedAccountId = accountId || null
  }

  closeAccountModal() {
    this.ui.modals.showAccountModal = false
    this.ui.modals.selectedAccountId = null
  }

  openTransactionModal(transactionId?: string) {
    this.ui.modals.showTransactionModal = true
    this.ui.modals.selectedTransactionId = transactionId || null
  }

  closeTransactionModal() {
    this.ui.modals.showTransactionModal = false
    this.ui.modals.selectedTransactionId = null
  }

  openBudgetModal(budgetId?: string) {
    this.ui.modals.showBudgetModal = true
    this.ui.modals.selectedBudgetId = budgetId || null
  }

  closeBudgetModal() {
    this.ui.modals.showBudgetModal = false
    this.ui.modals.selectedBudgetId = null
  }

  // ===== Filter Management =====

  setAccountFilter(filter: Partial<AccountFilter>) {
    this.ui.filters.accountFilter = { ...this.ui.filters.accountFilter, ...filter }
  }

  resetAccountFilter() {
    this.ui.filters.accountFilter = {}
  }

  setTransactionFilter(filter: Partial<TransactionFilter>) {
    this.ui.filters.transactionFilter = { ...this.ui.filters.transactionFilter, ...filter }
  }

  resetTransactionFilter() {
    this.ui.filters.transactionFilter = {}
  }

  setBudgetFilter(filter: Partial<BudgetFilter>) {
    this.ui.filters.budgetFilter = { ...this.ui.filters.budgetFilter, ...filter }
  }

  resetBudgetFilter() {
    this.ui.filters.budgetFilter = {}
  }

  setTransactionPage(page: number) {
    this.ui.pagination.transactionPage = page
  }

  // ===== Reset =====

  reset() {
    this.data = initialData
    this.ui = initialUI
  }
}

// 싱글톤 인스턴스
export const financeStore = new FinanceStore()
