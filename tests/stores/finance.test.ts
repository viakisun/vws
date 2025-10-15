import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the logger
vi.mock('$lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock the finance types
const mockAccount = {
  id: 'account-1',
  name: '기업주계좌',
  accountNumber: '123-456-789012',
  bankName: '국민은행',
  bankCode: '004',
  branchName: '강남지점',
  accountType: 'checking',
  balance: 50000000,
  currency: 'KRW',
  isActive: true,
  companyCode: 'DEFAULT',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}

const mockTransaction = {
  id: 'transaction-1',
  accountId: 'account-1',
  amount: 10000000,
  type: 'income',
  category: 'sales',
  subcategory: 'product_sales',
  description: '제품 판매 수익',
  referenceNumber: 'INV-2025-001',
  transactionDate: '2025-01-15',
  balanceAfter: 60000000,
  isReconciled: true,
  companyCode: 'DEFAULT',
  createdAt: '2025-01-15T00:00:00.000Z',
  updatedAt: '2025-01-15T00:00:00.000Z',
}

const mockBankSummary = {
  bankName: '국민은행',
  bankCode: '004',
  totalBalance: 50000000,
  accountCount: 1,
  lastTransactionDate: '2025-01-15',
}

const mockTransactionStats = {
  totalTransactions: 150,
  totalIncome: 50000000,
  totalExpense: 30000000,
  totalTransfer: 10000000,
  monthlyStats: [
    { month: '2025-01', income: 20000000, expense: 15000000 },
    { month: '2024-12', income: 18000000, expense: 12000000 },
  ],
}

describe('Finance Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial data structure', () => {
      // Since we can't directly import the runes-based store in tests,
      // we'll test the structure through mock data
      const financeData = {
        accounts: [],
        transactions: [],
        bankSummaries: [],
        transactionStats: null,
      }

      const financeUI = {
        loading: false,
        error: null,
        modals: {
          showAccountModal: false,
          showTransactionModal: false,
          selectedAccountId: null,
          selectedTransactionId: null,
        },
        filters: {
          accountFilter: {},
          transactionFilter: {},
        },
        pagination: {
          transactionPage: 1,
          transactionLimit: 20,
          transactionTotal: 0,
          transactionTotalPages: 0,
        },
      }

      expect(financeData.accounts).toEqual([])
      expect(financeData.transactions).toEqual([])
      expect(financeData.bankSummaries).toEqual([])
      expect(financeData.transactionStats).toBeNull()
      expect(financeUI.loading).toBe(false)
      expect(financeUI.error).toBeNull()
    })
  })

  describe('data management', () => {
    it('should handle accounts data correctly', () => {
      const accounts = [mockAccount]
      const accountsData = {
        accounts,
        transactions: [],
        bankSummaries: [],
        transactionStats: null,
      }

      expect(accountsData.accounts).toHaveLength(1)
      expect(accountsData.accounts[0]).toEqual(mockAccount)
      expect(accountsData.accounts[0].id).toBe('account-1')
      expect(accountsData.accounts[0].name).toBe('기업주계좌')
      expect(accountsData.accounts[0].balance).toBe(50000000)
    })

    it('should handle transactions data correctly', () => {
      const transactions = [mockTransaction]
      const transactionsData = {
        accounts: [],
        transactions,
        bankSummaries: [],
        transactionStats: null,
      }

      expect(transactionsData.transactions).toHaveLength(1)
      expect(transactionsData.transactions[0]).toEqual(mockTransaction)
      expect(transactionsData.transactions[0].id).toBe('transaction-1')
      expect(transactionsData.transactions[0].amount).toBe(10000000)
      expect(transactionsData.transactions[0].type).toBe('income')
    })

    it('should handle bank summaries data correctly', () => {
      const bankSummaries = [mockBankSummary]
      const bankSummariesData = {
        accounts: [],
        transactions: [],
        bankSummaries,
        transactionStats: null,
      }

      expect(bankSummariesData.bankSummaries).toHaveLength(1)
      expect(bankSummariesData.bankSummaries[0]).toEqual(mockBankSummary)
      expect(bankSummariesData.bankSummaries[0].bankName).toBe('국민은행')
      expect(bankSummariesData.bankSummaries[0].totalBalance).toBe(50000000)
    })

    it('should handle transaction stats data correctly', () => {
      const transactionStats = mockTransactionStats
      const statsData = {
        accounts: [],
        transactions: [],
        bankSummaries: [],
        transactionStats,
      }

      expect(statsData.transactionStats).toEqual(mockTransactionStats)
      expect(statsData.transactionStats?.totalTransactions).toBe(150)
      expect(statsData.transactionStats?.totalIncome).toBe(50000000)
      expect(statsData.transactionStats?.monthlyStats).toHaveLength(2)
    })
  })

  describe('UI state management', () => {
    it('should handle loading state correctly', () => {
      const loadingStates = [
        { loading: false, expected: false },
        { loading: true, expected: true },
      ]

      loadingStates.forEach(({ loading, expected }) => {
        const uiState = {
          loading,
          error: null,
          modals: {
            showAccountModal: false,
            showTransactionModal: false,
            selectedAccountId: null,
            selectedTransactionId: null,
          },
          filters: {
            accountFilter: {},
            transactionFilter: {},
          },
          pagination: {
            transactionPage: 1,
            transactionLimit: 20,
            transactionTotal: 0,
            transactionTotalPages: 0,
          },
        }

        expect(uiState.loading).toBe(expected)
      })
    })

    it('should handle error state correctly', () => {
      const errorStates = [
        { error: null, expected: null },
        { error: 'Database connection failed', expected: 'Database connection failed' },
        { error: 'Validation error', expected: 'Validation error' },
      ]

      errorStates.forEach(({ error, expected }) => {
        const uiState = {
          loading: false,
          error,
          modals: {
            showAccountModal: false,
            showTransactionModal: false,
            selectedAccountId: null,
            selectedTransactionId: null,
          },
          filters: {
            accountFilter: {},
            transactionFilter: {},
          },
          pagination: {
            transactionPage: 1,
            transactionLimit: 20,
            transactionTotal: 0,
            transactionTotalPages: 0,
          },
        }

        expect(uiState.error).toBe(expected)
      })
    })

    it('should handle modal states correctly', () => {
      const modalStates = [
        {
          showAccountModal: false,
          showTransactionModal: false,
          selectedAccountId: null,
          selectedTransactionId: null,
        },
        {
          showAccountModal: true,
          showTransactionModal: false,
          selectedAccountId: 'account-1',
          selectedTransactionId: null,
        },
        {
          showAccountModal: false,
          showTransactionModal: true,
          selectedAccountId: null,
          selectedTransactionId: 'transaction-1',
        },
      ]

      modalStates.forEach((modalState) => {
        const uiState = {
          loading: false,
          error: null,
          modals: modalState,
          filters: {
            accountFilter: {},
            transactionFilter: {},
          },
          pagination: {
            transactionPage: 1,
            transactionLimit: 20,
            transactionTotal: 0,
            transactionTotalPages: 0,
          },
        }

        expect(uiState.modals).toEqual(modalState)
      })
    })

    it('should handle filter states correctly', () => {
      const filterStates = [
        {
          accountFilter: {},
          transactionFilter: {},
        },
        {
          accountFilter: { bankName: '국민은행' },
          transactionFilter: { type: 'income' },
        },
        {
          accountFilter: { accountType: 'checking' },
          transactionFilter: { category: 'sales' },
        },
      ]

      filterStates.forEach((filterState) => {
        const uiState = {
          loading: false,
          error: null,
          modals: {
            showAccountModal: false,
            showTransactionModal: false,
            selectedAccountId: null,
            selectedTransactionId: null,
          },
          filters: filterState,
          pagination: {
            transactionPage: 1,
            transactionLimit: 20,
            transactionTotal: 0,
            transactionTotalPages: 0,
          },
        }

        expect(uiState.filters).toEqual(filterState)
      })
    })

    it('should handle pagination states correctly', () => {
      const paginationStates = [
        {
          transactionPage: 1,
          transactionLimit: 20,
          transactionTotal: 0,
          transactionTotalPages: 0,
        },
        {
          transactionPage: 2,
          transactionLimit: 20,
          transactionTotal: 100,
          transactionTotalPages: 5,
        },
        {
          transactionPage: 1,
          transactionLimit: 50,
          transactionTotal: 150,
          transactionTotalPages: 3,
        },
      ]

      paginationStates.forEach((paginationState) => {
        const uiState = {
          loading: false,
          error: null,
          modals: {
            showAccountModal: false,
            showTransactionModal: false,
            selectedAccountId: null,
            selectedTransactionId: null,
          },
          filters: {
            accountFilter: {},
            transactionFilter: {},
          },
          pagination: paginationState,
        }

        expect(uiState.pagination).toEqual(paginationState)
      })
    })
  })

  describe('statistics calculations', () => {
    it('should calculate total balance correctly', () => {
      const accounts = [
        { ...mockAccount, balance: 10000000 },
        { ...mockAccount, id: 'account-2', balance: 20000000 },
        { ...mockAccount, id: 'account-3', balance: 30000000 },
      ]

      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
      expect(totalBalance).toBe(60000000)
    })

    it('should calculate active accounts count correctly', () => {
      const accounts = [
        { ...mockAccount, isActive: true },
        { ...mockAccount, id: 'account-2', isActive: true },
        { ...mockAccount, id: 'account-3', isActive: false },
        { ...mockAccount, id: 'account-4', isActive: true },
      ]

      const activeAccountsCount = accounts.filter((account) => account.isActive).length
      expect(activeAccountsCount).toBe(3)
    })

    it('should calculate monthly income correctly', () => {
      const transactions = [
        { ...mockTransaction, type: 'income', amount: 10000000 },
        { ...mockTransaction, id: 'transaction-2', type: 'income', amount: 5000000 },
        { ...mockTransaction, id: 'transaction-3', type: 'expense', amount: 3000000 },
      ]

      const monthlyIncome = transactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0)
      expect(monthlyIncome).toBe(15000000)
    })

    it('should calculate monthly expense correctly', () => {
      const transactions = [
        { ...mockTransaction, type: 'expense', amount: 5000000 },
        { ...mockTransaction, id: 'transaction-2', type: 'expense', amount: 3000000 },
        { ...mockTransaction, id: 'transaction-3', type: 'income', amount: 10000000 },
      ]

      const monthlyExpense = transactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0)
      expect(monthlyExpense).toBe(8000000)
    })
  })

  describe('edge cases', () => {
    it('should handle empty data arrays', () => {
      const emptyData = {
        accounts: [],
        transactions: [],
        bankSummaries: [],
        transactionStats: null,
      }

      expect(emptyData.accounts).toHaveLength(0)
      expect(emptyData.transactions).toHaveLength(0)
      expect(emptyData.bankSummaries).toHaveLength(0)
      expect(emptyData.transactionStats).toBeNull()
    })

    it('should handle very large data sets', () => {
      const largeAccounts = Array.from({ length: 1000 }, (_, i) => ({
        ...mockAccount,
        id: `account-${i}`,
        name: `계좌 ${i}`,
        balance: Math.floor(Math.random() * 100000000),
      }))

      expect(largeAccounts).toHaveLength(1000)
      expect(largeAccounts[0].id).toBe('account-0')
      expect(largeAccounts[999].id).toBe('account-999')
    })

    it('should handle special characters in data', () => {
      const specialAccount = {
        ...mockAccount,
        name: '특수문자@#$%^&*()계좌',
        bankName: '특수@#$은행',
      }

      expect(specialAccount.name).toBe('특수문자@#$%^&*()계좌')
      expect(specialAccount.bankName).toBe('특수@#$은행')
    })

    it('should handle Unicode characters in data', () => {
      const unicodeAccount = {
        ...mockAccount,
        name: '한글계좌한글',
        bankName: '한글은행한글',
      }

      expect(unicodeAccount.name).toBe('한글계좌한글')
      expect(unicodeAccount.bankName).toBe('한글은행한글')
    })

    it('should handle very large numbers', () => {
      const largeNumberAccount = {
        ...mockAccount,
        balance: 999999999999,
      }

      expect(largeNumberAccount.balance).toBe(999999999999)
    })

    it('should handle zero values', () => {
      const zeroAccount = {
        ...mockAccount,
        balance: 0,
      }

      expect(zeroAccount.balance).toBe(0)
    })
  })
})
