/**
 * useFinanceManagement Hook
 * 자금 관리 마스터 Hook - 모든 자금 관련 기능 통합
 */

import { useAccounts } from './useAccounts.svelte'
import { useTransactions } from './useTransactions.svelte'
import { useBudgets } from './useBudgets.svelte'

export function useFinanceManagement() {
  const accounts = useAccounts()
  const transactions = useTransactions()
  const budgets = useBudgets()

  /**
   * 모든 자금 관련 데이터 로드
   */
  async function loadAllData() {
    await Promise.all([
      accounts.loadAccounts(),
      accounts.loadBankSummaries(),
      transactions.loadTransactions(undefined, 1, 100),
      transactions.loadTransactionStats(),
      budgets.loadBudgets(),
      loadDashboardStats(), // 대시보드 통계 로드 (단일 소스)
    ])
  }

  /**
   * 대시보드 통계 로드 (서버에서 계산)
   */
  async function loadDashboardStats() {
    try {
      const response = await fetch('/api/finance/dashboard')
      const result = await response.json()

      if (result.success) {
        const { currentBalance, monthlyIncome, monthlyExpense, netCashFlow } = result.data
        accounts.store.setDashboardStats({
          totalBalance: currentBalance,
          activeAccountsCount: result.data.accountBalances?.length || 0,
          monthlyIncome,
          monthlyExpense,
          netCashFlow,
        })
      }
    } catch (error) {
      console.error('대시보드 통계 로드 실패:', error)
    }
  }

  /**
   * 대시보드용 통계 계산 - store에서 직접 가져오기
   */
  const statistics = $derived.by(() => ({
    dashboard: {
      totalBalance: accounts.store.statistics.totalBalance,
      activeAccounts: accounts.store.statistics.activeAccountsCount,
      monthlyIncome: accounts.store.statistics.monthlyIncome,
      monthlyExpense: accounts.store.statistics.monthlyExpense,
      netCashFlow: accounts.store.statistics.netCashFlow,
    },
    actionItems: {
      pendingTransactions: accounts.store.data.transactions.filter((t) => t.status === 'pending')
        .length,
      todayTransactions: accounts.store.data.transactions.filter(
        (t) => t.transactionDate === new Date().toISOString().split('T')[0],
      ).length,
      lowBalanceAccounts: accounts.store.data.accounts.filter(
        (acc) => acc.status === 'active' && (acc.balance ?? 0) < 1000000,
      ).length,
      total:
        accounts.store.data.transactions.filter((t) => t.status === 'pending').length +
        accounts.store.data.accounts.filter(
          (acc) => acc.status === 'active' && (acc.balance ?? 0) < 1000000,
        ).length,
    },
  }))

  /**
   * 필터링된 데이터
   */
  const filtered = $derived({
    accounts: accounts.store.filteredAccounts,
    transactions: transactions.store.filteredTransactions,
    budgets: [], // TODO: 예산 필터링 구현
  })

  return {
    // 공통 store
    store: accounts.store,

    // 개별 기능
    accounts: {
      load: accounts.loadAccounts,
      loadAccount: accounts.loadAccount,
      create: accounts.createAccount,
      update: accounts.updateAccount,
      delete: accounts.deleteAccount,
      loadSummary: accounts.loadAccountSummary,
      loadBankSummaries: accounts.loadBankSummaries,
      setFilter: accounts.setFilter,
      resetFilter: accounts.resetFilter,
    },

    transactions: {
      load: transactions.loadTransactions,
      loadTransaction: transactions.loadTransaction,
      create: transactions.createTransaction,
      update: transactions.updateTransaction,
      delete: transactions.deleteTransaction,
      loadStats: transactions.loadTransactionStats,
      loadDailySummary: transactions.loadDailyTransactionSummary,
      loadMonthlySummary: transactions.loadMonthlyTransactionSummary,
      upload: transactions.uploadTransactions,
      setFilter: transactions.setFilter,
      resetFilter: transactions.resetFilter,
      setPage: transactions.setPage,
    },

    budgets: {
      load: budgets.loadBudgets,
      create: budgets.createBudget,
      update: budgets.updateBudget,
      delete: budgets.deleteBudget,
      loadAnalysis: budgets.loadBudgetAnalysis,
      setFilter: budgets.setFilter,
      resetFilter: budgets.resetFilter,
    },

    // 통합 기능
    loadAllData,
    statistics,
    filtered,
  }
}
