import { TransactionService } from '$lib/finance/services/transaction-service'
import type {
  CreateTransactionRequest,
  DailyTransactionSummary,
  Transaction,
  TransactionFilter,
  TransactionStats,
  UpdateTransactionRequest,
} from '$lib/finance/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('Finance Transaction Service', () => {
  let transactionService: TransactionService

  beforeEach(() => {
    vi.clearAllMocks()
    transactionService = new TransactionService()
  })

  describe('getTransactions', () => {
    it('모든 거래를 성공적으로 조회해야 함', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          amount: 100000,
          type: 'income',
          description: '매출 수입',
          transactionDate: '2025-01-15T10:00:00Z',
          status: 'completed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
        {
          id: 'transaction-2',
          accountId: 'account-1',
          categoryId: 'category-2',
          amount: 50000,
          type: 'expense',
          description: '사무용품 구매',
          transactionDate: '2025-01-14T15:30:00Z',
          status: 'completed',
          createdAt: '2025-01-14T15:30:00Z',
          updatedAt: '2025-01-14T15:30:00Z',
        },
      ]

      const mockResponse = {
        transactions: mockTransactions,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: mockResponse.pagination,
          }),
      } as Response)

      const result = await transactionService.getTransactions()

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions')
    })

    it('계좌 ID 필터로 거래를 조회해야 함', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          amount: 100000,
          type: 'income',
          description: '매출 수입',
          transactionDate: '2025-01-15T10:00:00Z',
          status: 'completed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
      ]

      const filter: TransactionFilter = { accountId: 'account-1' }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
            },
          }),
      } as Response)

      const result = await transactionService.getTransactions(filter)

      expect(result.transactions).toEqual(mockTransactions)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions?accountId=account-1')
    })

    it('카테고리 ID 필터로 거래를 조회해야 함', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          amount: 100000,
          type: 'income',
          description: '매출 수입',
          transactionDate: '2025-01-15T10:00:00Z',
          status: 'completed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
      ]

      const filter: TransactionFilter = { categoryId: 'category-1' }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
            },
          }),
      } as Response)

      const result = await transactionService.getTransactions(filter)

      expect(result.transactions).toEqual(mockTransactions)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions?categoryId=category-1')
    })

    it('거래 타입 필터로 거래를 조회해야 함', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          amount: 100000,
          type: 'income',
          description: '매출 수입',
          transactionDate: '2025-01-15T10:00:00Z',
          status: 'completed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
      ]

      const filter: TransactionFilter = { type: 'income' }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
            },
          }),
      } as Response)

      const result = await transactionService.getTransactions(filter)

      expect(result.transactions).toEqual(mockTransactions)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions?type=income')
    })

    it('날짜 범위 필터로 거래를 조회해야 함', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          amount: 100000,
          type: 'income',
          description: '매출 수입',
          transactionDate: '2025-01-15T10:00:00Z',
          status: 'completed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
      ]

      const filter: TransactionFilter = {
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
            },
          }),
      } as Response)

      const result = await transactionService.getTransactions(filter)

      expect(result.transactions).toEqual(mockTransactions)
      expect(fetch).toHaveBeenCalledWith(
        '/api/finance/transactions?dateFrom=2025-01-01&dateTo=2025-01-31',
      )
    })

    it('금액 범위 필터로 거래를 조회해야 함', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          amount: 100000,
          type: 'income',
          description: '매출 수입',
          transactionDate: '2025-01-15T10:00:00Z',
          status: 'completed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
      ]

      const filter: TransactionFilter = {
        amountMin: 50000,
        amountMax: 200000,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
            },
          }),
      } as Response)

      const result = await transactionService.getTransactions(filter)

      expect(result.transactions).toEqual(mockTransactions)
      expect(fetch).toHaveBeenCalledWith(
        '/api/finance/transactions?amountMin=50000&amountMax=200000',
      )
    })

    it('검색어로 거래를 조회해야 함', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          amount: 100000,
          type: 'income',
          description: '매출 수입',
          transactionDate: '2025-01-15T10:00:00Z',
          status: 'completed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
      ]

      const filter: TransactionFilter = { search: '매출' }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
            },
          }),
      } as Response)

      const result = await transactionService.getTransactions(filter)

      expect(result.transactions).toEqual(mockTransactions)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions?search=%EB%A7%A4%EC%B6%9C')
    })

    it('태그 필터로 거래를 조회해야 함', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          amount: 100000,
          type: 'income',
          description: '매출 수입',
          transactionDate: '2025-01-15T10:00:00Z',
          status: 'completed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
      ]

      const filter: TransactionFilter = { tags: ['매출', '수입'] }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
            },
          }),
      } as Response)

      const result = await transactionService.getTransactions(filter)

      expect(result.transactions).toEqual(mockTransactions)
      expect(fetch).toHaveBeenCalledWith(
        '/api/finance/transactions?tags=%EB%A7%A4%EC%B6%9C%2C%EC%88%98%EC%9E%85',
      )
    })

    it('페이지네이션으로 거래를 조회해야 함', async () => {
      const mockTransactions: Transaction[] = []

      const filter = { page: 2, limit: 10 }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: {
              page: 2,
              limit: 10,
              total: 50,
              totalPages: 5,
            },
          }),
      } as Response)

      const result = await transactionService.getTransactions(filter)

      expect(result.transactions).toEqual(mockTransactions)
      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.total).toBe(50)
      expect(result.pagination.totalPages).toBe(5)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions?page=2&limit=10')
    })

    it('복합 필터로 거래를 조회해야 함', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          amount: 100000,
          type: 'income',
          description: '매출 수입',
          transactionDate: '2025-01-15T10:00:00Z',
          status: 'completed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
      ]

      const filter: TransactionFilter = {
        accountId: 'account-1',
        categoryId: 'category-1',
        type: 'income',
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        amountMin: 50000,
        amountMax: 200000,
        search: '매출',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
            },
          }),
      } as Response)

      const result = await transactionService.getTransactions(filter)

      expect(result.transactions).toEqual(mockTransactions)
      expect(fetch).toHaveBeenCalledWith(
        '/api/finance/transactions?accountId=account-1&categoryId=category-1&type=income&dateFrom=2025-01-01&dateTo=2025-01-31&amountMin=50000&amountMax=200000&search=%EB%A7%A4%EC%B6%9C&tags=%EB%A7%A4%EC%B6%9C%2C%EC%88%98%EC%9E%85&page=1&limit=20',
      )
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(transactionService.getTransactions()).rejects.toThrow('Network error')
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Database connection failed',
          }),
      } as Response)

      await expect(transactionService.getTransactions()).rejects.toThrow(
        'Database connection failed',
      )
    })

    it('빈 거래 목록을 올바르게 처리해야 함', async () => {
      const mockTransactions: Transaction[] = []

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransactions,
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
            },
          }),
      } as Response)

      const result = await transactionService.getTransactions()

      expect(result.transactions).toEqual([])
      expect(result.transactions).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('getTransaction', () => {
    it('특정 거래를 성공적으로 조회해야 함', async () => {
      const mockTransaction: Transaction = {
        id: 'transaction-1',
        accountId: 'account-1',
        categoryId: 'category-1',
        amount: 100000,
        type: 'income',
        description: '매출 수입',
        transactionDate: '2025-01-15T10:00:00Z',
        status: 'completed',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockTransaction,
          }),
      } as Response)

      const result = await transactionService.getTransaction('transaction-1')

      expect(result).toEqual(mockTransaction)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions/transaction-1')
    })

    it('존재하지 않는 거래 조회 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Transaction not found',
          }),
      } as Response)

      await expect(transactionService.getTransaction('non-existent')).rejects.toThrow(
        'Transaction not found',
      )
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(transactionService.getTransaction('transaction-1')).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('createTransaction', () => {
    it('새 거래를 성공적으로 생성해야 함', async () => {
      const transactionData: CreateTransactionRequest = {
        accountId: 'account-1',
        categoryId: 'category-1',
        amount: 100000,
        type: 'income',
        description: '매출 수입',
        transactionDate: '2025-01-15T10:00:00Z',
      }

      const mockCreatedTransaction: Transaction = {
        id: 'transaction-new',
        ...transactionData,
        status: 'completed',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCreatedTransaction,
          }),
      } as Response)

      const result = await transactionService.createTransaction(transactionData)

      expect(result).toEqual(mockCreatedTransaction)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })
    })

    it('지출 거래를 생성해야 함', async () => {
      const transactionData: CreateTransactionRequest = {
        accountId: 'account-1',
        categoryId: 'category-2',
        amount: 50000,
        type: 'expense',
        description: '사무용품 구매',
        transactionDate: '2025-01-14T15:30:00Z',
        tags: ['사무용품', '지출'],
      }

      const mockCreatedTransaction: Transaction = {
        id: 'transaction-expense',
        ...transactionData,
        status: 'completed',
        createdAt: '2025-01-14T15:30:00Z',
        updatedAt: '2025-01-14T15:30:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCreatedTransaction,
          }),
      } as Response)

      const result = await transactionService.createTransaction(transactionData)

      expect(result.type).toBe('expense')
      expect(result.amount).toBe(50000)
    })

    it('이체 거래를 생성해야 함', async () => {
      const transactionData: CreateTransactionRequest = {
        accountId: 'account-1',
        categoryId: 'category-3',
        amount: 200000,
        type: 'transfer',
        description: '계좌 간 이체',
        transactionDate: '2025-01-13T09:00:00Z',
        tags: ['이체'],
      }

      const mockCreatedTransaction: Transaction = {
        id: 'transaction-transfer',
        ...transactionData,
        status: 'completed',
        createdAt: '2025-01-13T09:00:00Z',
        updatedAt: '2025-01-13T09:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCreatedTransaction,
          }),
      } as Response)

      const result = await transactionService.createTransaction(transactionData)

      expect(result.type).toBe('transfer')
      expect(result.amount).toBe(200000)
    })

    it('존재하지 않는 계좌로 거래 생성 시 에러를 던져야 함', async () => {
      const transactionData: CreateTransactionRequest = {
        accountId: 'non-existent-account',
        categoryId: 'category-1',
        amount: 100000,
        type: 'income',
        description: '매출 수입',
        transactionDate: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Account not found',
          }),
      } as Response)

      await expect(transactionService.createTransaction(transactionData)).rejects.toThrow(
        'Account not found',
      )
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      const transactionData: CreateTransactionRequest = {
        accountId: 'account-1',
        categoryId: 'category-1',
        amount: 100000,
        type: 'income',
        description: '매출 수입',
        transactionDate: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(transactionService.createTransaction(transactionData)).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('updateTransaction', () => {
    it('거래를 성공적으로 수정해야 함', async () => {
      const updateData: UpdateTransactionRequest = {
        id: 'transaction-1',
        amount: 150000,
        description: '수정된 매출 수입',
      }

      const mockUpdatedTransaction: Transaction = {
        id: 'transaction-1',
        accountId: 'account-1',
        categoryId: 'category-1',
        ...updateData,
        type: 'income',
        transactionDate: '2025-01-15T10:00:00Z',
        status: 'completed',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T11:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockUpdatedTransaction,
          }),
      } as Response)

      const result = await transactionService.updateTransaction('transaction-1', updateData)

      expect(result).toEqual(mockUpdatedTransaction)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions/transaction-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
    })

    it('존재하지 않는 거래 수정 시 에러를 던져야 함', async () => {
      const updateData: UpdateTransactionRequest = {
        id: 'non-existent',
        description: '수정된 설명',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Transaction not found',
          }),
      } as Response)

      await expect(
        transactionService.updateTransaction('non-existent', updateData),
      ).rejects.toThrow('Transaction not found')
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      const updateData: UpdateTransactionRequest = {
        id: 'transaction-1',
        description: '수정된 설명',
      }

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(
        transactionService.updateTransaction('transaction-1', updateData),
      ).rejects.toThrow('Network error')
    })
  })

  describe('deleteTransaction', () => {
    it('거래를 성공적으로 삭제해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
          }),
      } as Response)

      await transactionService.deleteTransaction('transaction-1')

      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions/transaction-1', {
        method: 'DELETE',
      })
    })

    it('존재하지 않는 거래 삭제 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Transaction not found',
          }),
      } as Response)

      await expect(transactionService.deleteTransaction('non-existent')).rejects.toThrow(
        'Transaction not found',
      )
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(transactionService.deleteTransaction('transaction-1')).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('getTransactionStats', () => {
    it('거래 통계를 성공적으로 조회해야 함', async () => {
      const mockStats: TransactionStats = {
        totalIncome: 5000000,
        totalExpense: 3000000,
        netAmount: 2000000,
        transactionCount: 100,
        averageTransactionAmount: 50000,
        incomeCount: 60,
        expenseCount: 40,
        topCategories: [
          { categoryId: 'category-1', categoryName: '매출', amount: 3000000, count: 30 },
          { categoryId: 'category-2', categoryName: '사무용품', amount: 500000, count: 20 },
        ],
        monthlyTrend: [
          { month: '2024-11', income: 4000000, expense: 2500000 },
          { month: '2024-12', income: 4500000, expense: 2800000 },
          { month: '2025-01', income: 5000000, expense: 3000000 },
        ],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockStats,
          }),
      } as Response)

      const result = await transactionService.getTransactionStats()

      expect(result).toEqual(mockStats)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions/stats')
    })

    it('필터로 거래 통계를 조회해야 함', async () => {
      const mockStats: TransactionStats = {
        totalIncome: 2500000,
        totalExpense: 1500000,
        netAmount: 1000000,
        transactionCount: 50,
        averageTransactionAmount: 40000,
        incomeCount: 30,
        expenseCount: 20,
        topCategories: [
          { categoryId: 'category-1', categoryName: '매출', amount: 2000000, count: 20 },
          { categoryId: 'category-2', categoryName: '사무용품', amount: 300000, count: 15 },
        ],
        monthlyTrend: [
          { month: '2024-12', income: 2000000, expense: 1200000 },
          { month: '2025-01', income: 2500000, expense: 1500000 },
        ],
      }

      const filter: TransactionFilter = {
        accountId: 'account-1',
        dateFrom: '2024-12-01',
        dateTo: '2025-01-31',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockStats,
          }),
      } as Response)

      const result = await transactionService.getTransactionStats(filter)

      expect(result).toEqual(mockStats)
      expect(fetch).toHaveBeenCalledWith(
        '/api/finance/transactions/stats?accountId=account-1&dateFrom=2024-12-01&dateTo=2025-01-31',
      )
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(transactionService.getTransactionStats()).rejects.toThrow('Network error')
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Database connection failed',
          }),
      } as Response)

      await expect(transactionService.getTransactionStats()).rejects.toThrow(
        'Database connection failed',
      )
    })
  })

  describe('getDailyTransactionSummary', () => {
    it('일별 거래 요약을 성공적으로 조회해야 함', async () => {
      const mockSummary: DailyTransactionSummary = {
        date: '2025-01-15',
        totalTransactions: 10,
        totalIncome: 500000,
        totalExpense: 200000,
        netAmount: 300000,
        transactionCount: 10,
        topCategories: [
          { categoryId: 'category-1', categoryName: '매출', amount: 400000, count: 4 },
          { categoryId: 'category-2', categoryName: '사무용품', amount: 100000, count: 2 },
        ],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockSummary,
          }),
      } as Response)

      const result = await transactionService.getDailyTransactionSummary('2025-01-15')

      expect(result).toEqual(mockSummary)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions/daily-summary?date=2025-01-15')
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(transactionService.getDailyTransactionSummary('2025-01-15')).rejects.toThrow(
        'Network error',
      )
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'No data found for the specified date',
          }),
      } as Response)

      await expect(transactionService.getDailyTransactionSummary('2025-01-15')).rejects.toThrow(
        'No data found for the specified date',
      )
    })
  })

  describe('getMonthlyTransactionSummary', () => {
    it('월별 거래 요약을 성공적으로 조회해야 함', async () => {
      const mockSummary: DailyTransactionSummary = {
        date: '2025-01',
        totalTransactions: 100,
        totalIncome: 5000000,
        totalExpense: 3000000,
        netAmount: 2000000,
        transactionCount: 100,
        topCategories: [
          { categoryId: 'category-1', categoryName: '매출', amount: 4000000, count: 40 },
          { categoryId: 'category-2', categoryName: '사무용품', amount: 800000, count: 20 },
        ],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockSummary,
          }),
      } as Response)

      const result = await transactionService.getMonthlyTransactionSummary(2025, 1)

      expect(result).toEqual(mockSummary)
      expect(fetch).toHaveBeenCalledWith(
        '/api/finance/transactions/monthly-summary?year=2025&month=1',
      )
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(transactionService.getMonthlyTransactionSummary(2025, 1)).rejects.toThrow(
        'Network error',
      )
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'No data found for the specified month',
          }),
      } as Response)

      await expect(transactionService.getMonthlyTransactionSummary(2025, 1)).rejects.toThrow(
        'No data found for the specified month',
      )
    })
  })

  describe('uploadTransactions', () => {
    it('거래 내역을 성공적으로 업로드해야 함', async () => {
      const mockFile = new File(['test content'], 'transactions.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const mockUploadResult = {
        success: 45,
        failed: 5,
        errors: [
          'Row 10: Invalid amount format',
          'Row 15: Missing required field',
          'Row 20: Invalid date format',
          'Row 25: Duplicate transaction',
          'Row 30: Invalid account ID',
        ],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockUploadResult,
          }),
      } as Response)

      const result = await transactionService.uploadTransactions(mockFile)

      expect(result).toEqual(mockUploadResult)
      expect(fetch).toHaveBeenCalledWith('/api/finance/transactions/upload', {
        method: 'POST',
        body: expect.any(FormData),
      })
    })

    it('업로드 실패 시 에러를 던져야 함', async () => {
      const mockFile = new File(['test content'], 'transactions.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Invalid file format',
          }),
      } as Response)

      await expect(transactionService.uploadTransactions(mockFile)).rejects.toThrow(
        'Invalid file format',
      )
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      const mockFile = new File(['test content'], 'transactions.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(transactionService.uploadTransactions(mockFile)).rejects.toThrow('Network error')
    })
  })

  describe('Integration tests', () => {
    it('전체 거래 관리 워크플로우가 올바르게 작동해야 함', async () => {
      // 1. 모든 거래 조회
      const mockAllTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          amount: 100000,
          type: 'income',
          description: '매출 수입',
          transactionDate: '2025-01-15T10:00:00Z',
          status: 'completed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
        {
          id: 'transaction-2',
          accountId: 'account-1',
          categoryId: 'category-2',
          amount: 50000,
          type: 'expense',
          description: '사무용품 구매',
          transactionDate: '2025-01-14T15:30:00Z',
          status: 'completed',
          createdAt: '2025-01-14T15:30:00Z',
          updatedAt: '2025-01-14T15:30:00Z',
        },
      ]

      // 2. 새 거래 생성
      const newTransactionData: CreateTransactionRequest = {
        accountId: 'account-1',
        categoryId: 'category-3',
        amount: 200000,
        type: 'income',
        description: '새로운 매출',
        transactionDate: '2025-01-16T09:00:00Z',
        tags: ['새매출', '수입'],
      }

      const mockNewTransaction: Transaction = {
        id: 'transaction-new',
        ...newTransactionData,
        status: 'completed',
        createdAt: '2025-01-16T09:00:00Z',
        updatedAt: '2025-01-16T09:00:00Z',
      }

      // 3. 수입 거래만 필터링
      const mockIncomeTransactions = mockAllTransactions.filter((t) => t.type === 'income')

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockAllTransactions,
              pagination: {
                page: 1,
                limit: 20,
                total: 2,
                totalPages: 1,
              },
            }),
        } as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockNewTransaction,
            }),
        } as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockIncomeTransactions,
              pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
              },
            }),
        } as Response)

      // 전체 거래 조회
      const allTransactionsResult = await transactionService.getTransactions()
      expect(allTransactionsResult.transactions).toHaveLength(2)

      // 새 거래 생성
      const createResult = await transactionService.createTransaction(newTransactionData)
      expect(createResult.description).toBe('새로운 매출')

      // 수입 거래만 필터링
      const incomeTransactionsResult = await transactionService.getTransactions({ type: 'income' })
      expect(incomeTransactionsResult.transactions).toHaveLength(1)
    })

    it('다양한 거래 타입과 상태를 올바르게 처리해야 함', async () => {
      const testCases = [
        {
          data: {
            accountId: 'account-1',
            categoryId: 'category-1',
            amount: 100000,
            type: 'income' as const,
            description: '매출 수입',
            transactionDate: '2025-01-15T10:00:00Z',
          },
          expectedType: 'income',
          expectedAmount: 100000,
        },
        {
          data: {
            accountId: 'account-1',
            categoryId: 'category-2',
            amount: 50000,
            type: 'expense' as const,
            description: '사무용품 구매',
            transactionDate: '2025-01-14T15:30:00Z',
          },
          expectedType: 'expense',
          expectedAmount: 50000,
        },
        {
          data: {
            accountId: 'account-1',
            categoryId: 'category-3',
            amount: 200000,
            type: 'transfer' as const,
            description: '계좌 간 이체',
            transactionDate: '2025-01-13T09:00:00Z',
            tags: ['이체'],
          },
          expectedType: 'transfer',
          expectedAmount: 200000,
        },
      ]

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]
        const mockTransaction: Transaction = {
          id: `transaction-test-${i}`,
          ...testCase.data,
          status: 'completed',
          createdAt: testCase.data.transactionDate,
          updatedAt: testCase.data.transactionDate,
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockTransaction,
            }),
        } as Response)

        const result = await transactionService.createTransaction(testCase.data)

        expect(result.type).toBe(testCase.expectedType)
        expect(result.amount).toBe(testCase.expectedAmount)
      }
    })
  })
})
