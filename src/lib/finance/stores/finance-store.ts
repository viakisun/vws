import { writable, derived } from 'svelte/store'
import type {
  Account,
  Transaction,
  Bank,
  TransactionCategory,
  FinanceDashboard,
} from '$lib/finance/types'
import { accountService, transactionService } from '$lib/finance/services'

// 기본 상태 인터페이스
interface FinanceState {
  accounts: Account[]
  transactions: Transaction[]
  banks: Bank[]
  categories: TransactionCategory[]
  dashboard: FinanceDashboard | null
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

// 초기 상태
const initialState: FinanceState = {
  accounts: [],
  transactions: [],
  banks: [],
  categories: [],
  dashboard: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
}

// 메인 스토어
const financeStore = writable<FinanceState>(initialState)

// 액션 함수들
export const financeActions = {
  // 로딩 상태 설정
  setLoading: (loading: boolean) => {
    financeStore.update((state) => ({ ...state, isLoading: loading }))
  },

  // 에러 설정
  setError: (error: string | null) => {
    financeStore.update((state) => ({ ...state, error }))
  },

  // 계좌 목록 로드
  loadAccounts: async (filter?: any) => {
    try {
      financeActions.setLoading(true)
      financeActions.setError(null)

      const accounts = await accountService.getAccounts(filter)

      financeStore.update((state) => ({
        ...state,
        accounts,
        lastUpdated: new Date().toISOString(),
      }))
    } catch (error) {
      financeActions.setError(
        error instanceof Error ? error.message : '계좌 목록을 불러올 수 없습니다.',
      )
    } finally {
      financeActions.setLoading(false)
    }
  },

  // 계좌 생성
  createAccount: async (accountData: any) => {
    try {
      financeActions.setLoading(true)
      financeActions.setError(null)

      const newAccount = await accountService.createAccount(accountData)

      financeStore.update((state) => ({
        ...state,
        accounts: [...state.accounts, newAccount],
        lastUpdated: new Date().toISOString(),
      }))

      return newAccount
    } catch (error) {
      financeActions.setError(error instanceof Error ? error.message : '계좌 생성에 실패했습니다.')
      throw error
    } finally {
      financeActions.setLoading(false)
    }
  },

  // 계좌 수정
  updateAccount: async (id: string, accountData: any) => {
    try {
      financeActions.setLoading(true)
      financeActions.setError(null)

      const updatedAccount = await accountService.updateAccount(id, accountData)

      financeStore.update((state) => ({
        ...state,
        accounts: state.accounts.map((account) => (account.id === id ? updatedAccount : account)),
        lastUpdated: new Date().toISOString(),
      }))

      return updatedAccount
    } catch (error) {
      financeActions.setError(error instanceof Error ? error.message : '계좌 수정에 실패했습니다.')
      throw error
    } finally {
      financeActions.setLoading(false)
    }
  },

  // 계좌 삭제
  deleteAccount: async (id: string) => {
    try {
      financeActions.setLoading(true)
      financeActions.setError(null)

      await accountService.deleteAccount(id)

      financeStore.update((state) => ({
        ...state,
        accounts: state.accounts.filter((account) => account.id !== id),
        lastUpdated: new Date().toISOString(),
      }))
    } catch (error) {
      financeActions.setError(error instanceof Error ? error.message : '계좌 삭제에 실패했습니다.')
      throw error
    } finally {
      financeActions.setLoading(false)
    }
  },

  // 거래 내역 로드
  loadTransactions: async (filter?: any) => {
    try {
      financeActions.setLoading(true)
      financeActions.setError(null)

      const result = await transactionService.getTransactions(filter)

      financeStore.update((state) => ({
        ...state,
        transactions: result.transactions,
        lastUpdated: new Date().toISOString(),
      }))

      return result
    } catch (error) {
      financeActions.setError(
        error instanceof Error ? error.message : '거래 내역을 불러올 수 없습니다.',
      )
      throw error
    } finally {
      financeActions.setLoading(false)
    }
  },

  // 거래 생성
  createTransaction: async (transactionData: any) => {
    try {
      financeActions.setLoading(true)
      financeActions.setError(null)

      const newTransaction = await transactionService.createTransaction(transactionData)

      financeStore.update((state) => ({
        ...state,
        transactions: [newTransaction, ...state.transactions],
        lastUpdated: new Date().toISOString(),
      }))

      return newTransaction
    } catch (error) {
      financeActions.setError(error instanceof Error ? error.message : '거래 생성에 실패했습니다.')
      throw error
    } finally {
      financeActions.setLoading(false)
    }
  },

  // 거래 수정
  updateTransaction: async (id: string, transactionData: any) => {
    try {
      financeActions.setLoading(true)
      financeActions.setError(null)

      const updatedTransaction = await transactionService.updateTransaction(id, transactionData)

      financeStore.update((state) => ({
        ...state,
        transactions: state.transactions.map((transaction) =>
          transaction.id === id ? updatedTransaction : transaction,
        ),
        lastUpdated: new Date().toISOString(),
      }))

      return updatedTransaction
    } catch (error) {
      financeActions.setError(error instanceof Error ? error.message : '거래 수정에 실패했습니다.')
      throw error
    } finally {
      financeActions.setLoading(false)
    }
  },

  // 거래 삭제
  deleteTransaction: async (id: string) => {
    try {
      financeActions.setLoading(true)
      financeActions.setError(null)

      await transactionService.deleteTransaction(id)

      financeStore.update((state) => ({
        ...state,
        transactions: state.transactions.filter((transaction) => transaction.id !== id),
        lastUpdated: new Date().toISOString(),
      }))
    } catch (error) {
      financeActions.setError(error instanceof Error ? error.message : '거래 삭제에 실패했습니다.')
      throw error
    } finally {
      financeActions.setLoading(false)
    }
  },

  // 모든 데이터 새로고침
  refreshAll: async () => {
    try {
      financeActions.setLoading(true)
      financeActions.setError(null)

      await Promise.all([
        financeActions.loadAccounts(),
        financeActions.loadTransactions({ limit: 100 }),
      ])
    } catch (error) {
      financeActions.setError(
        error instanceof Error ? error.message : '데이터 새로고침에 실패했습니다.',
      )
    } finally {
      financeActions.setLoading(false)
    }
  },

  // 스토어 초기화
  reset: () => {
    financeStore.set(initialState)
  },
}

// 파생 스토어들
export const accounts = derived(financeStore, ($store) => $store.accounts)
export const transactions = derived(financeStore, ($store) => $store.transactions)
export const banks = derived(financeStore, ($store) => $store.banks)
export const categories = derived(financeStore, ($store) => $store.categories)
export const dashboard = derived(financeStore, ($store) => $store.dashboard)
export const isLoading = derived(financeStore, ($store) => $store.isLoading)
export const error = derived(financeStore, ($store) => $store.error)
export const lastUpdated = derived(financeStore, ($store) => $store.lastUpdated)

// 계산된 값들
export const totalBalance = derived(accounts, ($accounts) =>
  $accounts.reduce((sum, account) => sum + account.balance, 0),
)

export const activeAccounts = derived(accounts, ($accounts) =>
  $accounts.filter((account) => account.status === 'active'),
)

export const primaryAccount = derived(
  accounts,
  ($accounts) => $accounts.find((account) => account.isPrimary) || null,
)

export const recentTransactions = derived(transactions, ($transactions) =>
  $transactions.slice(0, 10),
)

export const todayTransactions = derived(transactions, ($transactions) => {
  const today = new Date().toISOString().split('T')[0]
  return $transactions.filter((transaction) => transaction.transactionDate === today)
})

export const monthlyIncome = derived(transactions, ($transactions) => {
  const currentMonth = new Date().toISOString().substring(0, 7)
  return $transactions
    .filter(
      (transaction) =>
        transaction.transactionDate.startsWith(currentMonth) && transaction.type === 'income',
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0)
})

export const monthlyExpense = derived(transactions, ($transactions) => {
  const currentMonth = new Date().toISOString().substring(0, 7)
  return $transactions
    .filter(
      (transaction) =>
        transaction.transactionDate.startsWith(currentMonth) && transaction.type === 'expense',
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0)
})

export const netCashFlow = derived(
  [monthlyIncome, monthlyExpense],
  ([income, expense]) => income - expense,
)

// 스토어 내보내기
export { financeStore }
export default financeStore
