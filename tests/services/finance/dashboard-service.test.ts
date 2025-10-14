import { DashboardService } from '$lib/finance/services/dashboard-service'
import type { DailyFinanceReport, FinanceAlert, FinanceDashboard } from '$lib/finance/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockLogger } from '../../helpers/mock-helper'

// Mock fetch globally
global.fetch = vi.fn()

describe('Finance Dashboard Service', () => {
  let dashboardService: DashboardService

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger()
    dashboardService = new DashboardService()
  })

  describe('getDashboardData', () => {
    it('대시보드 데이터를 성공적으로 조회해야 함', async () => {
      const mockDashboard: FinanceDashboard = {
        date: '2025-01-15',
        totalBalance: 5000000,
        activeAccounts: 3,
        monthlyIncome: 2000000,
        monthlyExpense: 1500000,
        netCashFlow: 500000,
        accounts: [
          {
            id: 'account-1',
            bankId: 'bank-1',
            accountNumber: '123-456-789',
            accountName: '법인 통장',
            accountType: 'checking',
            balance: 3000000,
            status: 'active',
            isPrimary: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
          {
            id: 'account-2',
            bankId: 'bank-2',
            accountNumber: '987-654-321',
            accountName: '예금 통장',
            accountType: 'savings',
            balance: 2000000,
            status: 'active',
            isPrimary: false,
            createdAt: '2025-01-02T00:00:00Z',
            updatedAt: '2025-01-02T00:00:00Z',
          },
        ],
        recentTransactions: [
          {
            id: 'transaction-1',
            accountId: 'account-1',
            categoryId: 'category-1',
            amount: 100000,
            type: 'income',
            description: '매출 수입',
            transactionDate: '2025-01-15T10:00:00Z',
            status: 'completed',
            tags: ['매출', '수입'],
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
            tags: ['사무용품', '지출'],
            createdAt: '2025-01-14T15:30:00Z',
            updatedAt: '2025-01-14T15:30:00Z',
          },
        ],
        alerts: [
          {
            id: 'alert-1',
            type: 'low_balance',
            title: '잔액 부족 경고',
            message: '법인 통장의 잔액이 부족합니다.',
            severity: 'warning',
            isRead: false,
            createdAt: '2025-01-15T08:00:00Z',
          },
        ],
        trends: {
          dailyBalance: [
            { date: '2025-01-13', balance: 4800000 },
            { date: '2025-01-14', balance: 4900000 },
            { date: '2025-01-15', balance: 5000000 },
          ],
          monthlyIncome: [
            { month: '2024-11', amount: 1800000 },
            { month: '2024-12', amount: 1900000 },
            { month: '2025-01', amount: 2000000 },
          ],
          monthlyExpense: [
            { month: '2024-11', amount: 1400000 },
            { month: '2024-12', amount: 1450000 },
            { month: '2025-01', amount: 1500000 },
          ],
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockDashboard,
          }),
      } as Response)

      const result = await dashboardService.getDashboardData()

      expect(result).toEqual(mockDashboard)
      expect(fetch).toHaveBeenCalledWith('/api/finance/dashboard')
    })

    it('특정 날짜의 대시보드 데이터를 조회해야 함', async () => {
      const mockDashboard: FinanceDashboard = {
        date: '2025-01-10',
        totalBalance: 4500000,
        activeAccounts: 3,
        monthlyIncome: 1800000,
        monthlyExpense: 1400000,
        netCashFlow: 400000,
        accounts: [],
        recentTransactions: [],
        alerts: [],
        trends: {
          dailyBalance: [],
          monthlyIncome: [],
          monthlyExpense: [],
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockDashboard,
          }),
      } as Response)

      const result = await dashboardService.getDashboardData('2025-01-10')

      expect(result).toEqual(mockDashboard)
      expect(fetch).toHaveBeenCalledWith('/api/finance/dashboard?date=2025-01-10')
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(dashboardService.getDashboardData()).rejects.toThrow('Network error')
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Database connection failed',
          }),
      } as Response)

      await expect(dashboardService.getDashboardData()).rejects.toThrow(
        'Database connection failed',
      )
    })

    it('빈 대시보드 데이터를 올바르게 처리해야 함', async () => {
      const mockEmptyDashboard: FinanceDashboard = {
        date: '2025-01-15',
        totalBalance: 0,
        activeAccounts: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        netCashFlow: 0,
        accounts: [],
        recentTransactions: [],
        alerts: [],
        trends: {
          dailyBalance: [],
          monthlyIncome: [],
          monthlyExpense: [],
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockEmptyDashboard,
          }),
      } as Response)

      const result = await dashboardService.getDashboardData()

      expect(result.totalBalance).toBe(0)
      expect(result.activeAccounts).toBe(0)
      expect(result.accounts).toHaveLength(0)
      expect(result.recentTransactions).toHaveLength(0)
      expect(result.alerts).toHaveLength(0)
    })
  })

  describe('generateDailyReport', () => {
    it('자금일보를 성공적으로 생성해야 함', async () => {
      const mockDailyReport: DailyFinanceReport = {
        id: 'report-1',
        date: '2025-01-15',
        totalBalance: 5000000,
        dailyIncome: 200000,
        dailyExpense: 150000,
        netAmount: 50000,
        accountBalances: [
          {
            accountId: 'account-1',
            accountName: '법인 통장',
            balance: 3000000,
            change: 50000,
          },
          {
            accountId: 'account-2',
            accountName: '예금 통장',
            balance: 2000000,
            change: 0,
          },
        ],
        transactions: [
          {
            id: 'transaction-1',
            accountId: 'account-1',
            categoryId: 'category-1',
            amount: 200000,
            type: 'income',
            description: '매출 수입',
            transactionDate: '2025-01-15T10:00:00Z',
            status: 'completed',
            tags: ['매출', '수입'],
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z',
          },
          {
            id: 'transaction-2',
            accountId: 'account-1',
            categoryId: 'category-2',
            amount: 150000,
            type: 'expense',
            description: '사무용품 구매',
            transactionDate: '2025-01-15T14:30:00Z',
            status: 'completed',
            tags: ['사무용품', '지출'],
            createdAt: '2025-01-15T14:30:00Z',
            updatedAt: '2025-01-15T14:30:00Z',
          },
        ],
        summary: {
          incomeCount: 1,
          expenseCount: 1,
          totalTransactions: 2,
          topCategory: {
            categoryId: 'category-1',
            categoryName: '매출',
            amount: 200000,
          },
        },
        createdAt: '2025-01-15T23:59:59Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockDailyReport,
          }),
      } as Response)

      const result = await dashboardService.generateDailyReport('2025-01-15')

      expect(result).toEqual(mockDailyReport)
      expect(fetch).toHaveBeenCalledWith('/api/finance/reports/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: '2025-01-15' }),
      })
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(dashboardService.generateDailyReport('2025-01-15')).rejects.toThrow(
        'Network error',
      )
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Failed to generate daily report',
          }),
      } as Response)

      await expect(dashboardService.generateDailyReport('2025-01-15')).rejects.toThrow(
        'Failed to generate daily report',
      )
    })
  })

  describe('getDailyReport', () => {
    it('자금일보를 성공적으로 조회해야 함', async () => {
      const mockDailyReport: DailyFinanceReport = {
        id: 'report-1',
        date: '2025-01-15',
        totalBalance: 5000000,
        dailyIncome: 200000,
        dailyExpense: 150000,
        netAmount: 50000,
        accountBalances: [
          {
            accountId: 'account-1',
            accountName: '법인 통장',
            balance: 3000000,
            change: 50000,
          },
        ],
        transactions: [
          {
            id: 'transaction-1',
            accountId: 'account-1',
            categoryId: 'category-1',
            amount: 200000,
            type: 'income',
            description: '매출 수입',
            transactionDate: '2025-01-15T10:00:00Z',
            status: 'completed',
            tags: ['매출', '수입'],
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z',
          },
        ],
        summary: {
          incomeCount: 1,
          expenseCount: 0,
          totalTransactions: 1,
          topCategory: {
            categoryId: 'category-1',
            categoryName: '매출',
            amount: 200000,
          },
        },
        createdAt: '2025-01-15T23:59:59Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockDailyReport,
          }),
      } as Response)

      const result = await dashboardService.getDailyReport('2025-01-15')

      expect(result).toEqual(mockDailyReport)
      expect(fetch).toHaveBeenCalledWith('/api/finance/reports/daily?date=2025-01-15')
    })

    it('존재하지 않는 자금일보 조회 시 null을 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        status: 404,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Daily report not found',
          }),
      } as Response)

      const result = await dashboardService.getDailyReport('2025-01-15')

      expect(result).toBeNull()
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(dashboardService.getDailyReport('2025-01-15')).rejects.toThrow('Network error')
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        status: 500,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Internal server error',
          }),
      } as Response)

      await expect(dashboardService.getDailyReport('2025-01-15')).rejects.toThrow(
        'Internal server error',
      )
    })
  })

  describe('getDailyReports', () => {
    it('자금일보 목록을 성공적으로 조회해야 함', async () => {
      const mockDailyReports: DailyFinanceReport[] = [
        {
          id: 'report-1',
          date: '2025-01-13',
          totalBalance: 4800000,
          dailyIncome: 150000,
          dailyExpense: 100000,
          netAmount: 50000,
          accountBalances: [],
          transactions: [],
          summary: {
            incomeCount: 1,
            expenseCount: 1,
            totalTransactions: 2,
            topCategory: {
              categoryId: 'category-1',
              categoryName: '매출',
              amount: 150000,
            },
          },
          createdAt: '2025-01-13T23:59:59Z',
        },
        {
          id: 'report-2',
          date: '2025-01-14',
          totalBalance: 4900000,
          dailyIncome: 180000,
          dailyExpense: 120000,
          netAmount: 60000,
          accountBalances: [],
          transactions: [],
          summary: {
            incomeCount: 2,
            expenseCount: 1,
            totalTransactions: 3,
            topCategory: {
              categoryId: 'category-1',
              categoryName: '매출',
              amount: 180000,
            },
          },
          createdAt: '2025-01-14T23:59:59Z',
        },
        {
          id: 'report-3',
          date: '2025-01-15',
          totalBalance: 5000000,
          dailyIncome: 200000,
          dailyExpense: 150000,
          netAmount: 50000,
          accountBalances: [],
          transactions: [],
          summary: {
            incomeCount: 1,
            expenseCount: 1,
            totalTransactions: 2,
            topCategory: {
              categoryId: 'category-1',
              categoryName: '매출',
              amount: 200000,
            },
          },
          createdAt: '2025-01-15T23:59:59Z',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockDailyReports,
          }),
      } as Response)

      const result = await dashboardService.getDailyReports('2025-01-13', '2025-01-15')

      expect(result).toEqual(mockDailyReports)
      expect(fetch).toHaveBeenCalledWith(
        '/api/finance/reports/daily?startDate=2025-01-13&endDate=2025-01-15',
      )
    })

    it('빈 자금일보 목록을 올바르게 처리해야 함', async () => {
      const mockDailyReports: DailyFinanceReport[] = []

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockDailyReports,
          }),
      } as Response)

      const result = await dashboardService.getDailyReports('2025-01-01', '2025-01-31')

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(dashboardService.getDailyReports('2025-01-13', '2025-01-15')).rejects.toThrow(
        'Network error',
      )
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Invalid date range',
          }),
      } as Response)

      await expect(dashboardService.getDailyReports('2025-01-13', '2025-01-15')).rejects.toThrow(
        'Invalid date range',
      )
    })
  })

  describe('getAlerts', () => {
    it('자금 알림을 성공적으로 조회해야 함', async () => {
      const mockAlerts: FinanceAlert[] = [
        {
          id: 'alert-1',
          type: 'low_balance',
          title: '잔액 부족 경고',
          message: '법인 통장의 잔액이 부족합니다.',
          severity: 'warning',
          isRead: false,
          createdAt: '2025-01-15T08:00:00Z',
        },
        {
          id: 'alert-2',
          type: 'unusual_expense',
          title: '비정상적인 지출 감지',
          message: '평소보다 큰 금액의 지출이 발생했습니다.',
          severity: 'info',
          isRead: true,
          createdAt: '2025-01-14T16:30:00Z',
        },
        {
          id: 'alert-3',
          type: 'budget_exceeded',
          title: '예산 초과 경고',
          message: '사무용품 예산을 초과했습니다.',
          severity: 'error',
          isRead: false,
          createdAt: '2025-01-13T14:20:00Z',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAlerts,
          }),
      } as Response)

      const result = await dashboardService.getAlerts()

      expect(result).toEqual(mockAlerts)
      expect(fetch).toHaveBeenCalledWith('/api/finance/alerts')
    })

    it('읽지 않은 알림만 조회해야 함', async () => {
      const mockUnreadAlerts: FinanceAlert[] = [
        {
          id: 'alert-1',
          type: 'low_balance',
          title: '잔액 부족 경고',
          message: '법인 통장의 잔액이 부족합니다.',
          severity: 'warning',
          isRead: false,
          createdAt: '2025-01-15T08:00:00Z',
        },
        {
          id: 'alert-3',
          type: 'budget_exceeded',
          title: '예산 초과 경고',
          message: '사무용품 예산을 초과했습니다.',
          severity: 'error',
          isRead: false,
          createdAt: '2025-01-13T14:20:00Z',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockUnreadAlerts,
          }),
      } as Response)

      const result = await dashboardService.getAlerts(false)

      expect(result).toEqual(mockUnreadAlerts)
      expect(fetch).toHaveBeenCalledWith('/api/finance/alerts?isRead=false')
    })

    it('읽은 알림만 조회해야 함', async () => {
      const mockReadAlerts: FinanceAlert[] = [
        {
          id: 'alert-2',
          type: 'unusual_expense',
          title: '비정상적인 지출 감지',
          message: '평소보다 큰 금액의 지출이 발생했습니다.',
          severity: 'info',
          isRead: true,
          createdAt: '2025-01-14T16:30:00Z',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockReadAlerts,
          }),
      } as Response)

      const result = await dashboardService.getAlerts(true)

      expect(result).toEqual(mockReadAlerts)
      expect(fetch).toHaveBeenCalledWith('/api/finance/alerts?isRead=true')
    })

    it('빈 알림 목록을 올바르게 처리해야 함', async () => {
      const mockAlerts: FinanceAlert[] = []

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAlerts,
          }),
      } as Response)

      const result = await dashboardService.getAlerts()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(dashboardService.getAlerts()).rejects.toThrow('Network error')
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Failed to fetch alerts',
          }),
      } as Response)

      await expect(dashboardService.getAlerts()).rejects.toThrow('Failed to fetch alerts')
    })
  })

  describe('markAlertAsRead', () => {
    it('알림을 성공적으로 읽음 처리해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
          }),
      } as Response)

      await dashboardService.markAlertAsRead('alert-1')

      expect(fetch).toHaveBeenCalledWith('/api/finance/alerts/alert-1/read', {
        method: 'PUT',
      })
    })

    it('존재하지 않는 알림 읽음 처리 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Alert not found',
          }),
      } as Response)

      await expect(dashboardService.markAlertAsRead('non-existent')).rejects.toThrow(
        'Alert not found',
      )
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(dashboardService.markAlertAsRead('alert-1')).rejects.toThrow('Network error')
    })
  })

  describe('resolveAlert', () => {
    it('알림을 성공적으로 해결 처리해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
          }),
      } as Response)

      await dashboardService.resolveAlert('alert-1')

      expect(fetch).toHaveBeenCalledWith('/api/finance/alerts/alert-1/resolve', {
        method: 'PUT',
      })
    })

    it('존재하지 않는 알림 해결 처리 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Alert not found',
          }),
      } as Response)

      await expect(dashboardService.resolveAlert('non-existent')).rejects.toThrow('Alert not found')
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(dashboardService.resolveAlert('alert-1')).rejects.toThrow('Network error')
    })
  })

  describe('getFinancePredictions', () => {
    it('자금 예측을 성공적으로 조회해야 함', async () => {
      const mockPredictions = [
        {
          date: '2025-01-16',
          predictedBalance: 5050000,
          confidence: 0.85,
        },
        {
          date: '2025-01-17',
          predictedBalance: 5100000,
          confidence: 0.82,
        },
        {
          date: '2025-01-18',
          predictedBalance: 5150000,
          confidence: 0.78,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockPredictions,
          }),
      } as Response)

      const result = await dashboardService.getFinancePredictions(3)

      expect(result).toEqual(mockPredictions)
      expect(fetch).toHaveBeenCalledWith('/api/finance/predictions?days=3')
    })

    it('기본 30일 예측을 조회해야 함', async () => {
      const mockPredictions = [
        {
          date: '2025-01-16',
          predictedBalance: 5050000,
          confidence: 0.85,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockPredictions,
          }),
      } as Response)

      const result = await dashboardService.getFinancePredictions()

      expect(result).toEqual(mockPredictions)
      expect(fetch).toHaveBeenCalledWith('/api/finance/predictions?days=30')
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(dashboardService.getFinancePredictions(7)).rejects.toThrow('Network error')
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Failed to generate predictions',
          }),
      } as Response)

      await expect(dashboardService.getFinancePredictions(7)).rejects.toThrow(
        'Failed to generate predictions',
      )
    })
  })

  describe('getCashFlowAnalysis', () => {
    it('현금흐름 분석을 성공적으로 조회해야 함', async () => {
      const mockCashFlowAnalysis = {
        totalInflow: 2000000,
        totalOutflow: 1500000,
        netCashFlow: 500000,
        inflowByCategory: [
          { categoryId: 'category-1', categoryName: '매출', amount: 1800000 },
          { categoryId: 'category-2', categoryName: '기타 수입', amount: 200000 },
        ],
        outflowByCategory: [
          { categoryId: 'category-3', categoryName: '사무용품', amount: 800000 },
          { categoryId: 'category-4', categoryName: '인건비', amount: 700000 },
        ],
        dailyFlow: [
          { date: '2025-01-13', inflow: 600000, outflow: 400000, net: 200000 },
          { date: '2025-01-14', inflow: 700000, outflow: 500000, net: 200000 },
          { date: '2025-01-15', inflow: 700000, outflow: 600000, net: 100000 },
        ],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCashFlowAnalysis,
          }),
      } as Response)

      const result = await dashboardService.getCashFlowAnalysis('2025-01-13', '2025-01-15')

      expect(result).toEqual(mockCashFlowAnalysis)
      expect(fetch).toHaveBeenCalledWith(
        '/api/finance/analysis/cash-flow?startDate=2025-01-13&endDate=2025-01-15',
      )
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(
        dashboardService.getCashFlowAnalysis('2025-01-13', '2025-01-15'),
      ).rejects.toThrow('Network error')
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Failed to analyze cash flow',
          }),
      } as Response)

      await expect(
        dashboardService.getCashFlowAnalysis('2025-01-13', '2025-01-15'),
      ).rejects.toThrow('Failed to analyze cash flow')
    })
  })

  describe('Integration tests', () => {
    it('전체 대시보드 워크플로우가 올바르게 작동해야 함', async () => {
      // 1. 대시보드 데이터 조회
      const mockDashboard: FinanceDashboard = {
        date: '2025-01-15',
        totalBalance: 5000000,
        activeAccounts: 3,
        monthlyIncome: 2000000,
        monthlyExpense: 1500000,
        netCashFlow: 500000,
        accounts: [],
        recentTransactions: [],
        alerts: [
          {
            id: 'alert-1',
            type: 'low_balance',
            title: '잔액 부족 경고',
            message: '법인 통장의 잔액이 부족합니다.',
            severity: 'warning',
            isRead: false,
            createdAt: '2025-01-15T08:00:00Z',
          },
        ],
        trends: {
          dailyBalance: [],
          monthlyIncome: [],
          monthlyExpense: [],
        },
      }

      // 2. 자금일보 생성
      const mockDailyReport: DailyFinanceReport = {
        id: 'report-1',
        date: '2025-01-15',
        totalBalance: 5000000,
        dailyIncome: 200000,
        dailyExpense: 150000,
        netAmount: 50000,
        accountBalances: [],
        transactions: [],
        summary: {
          incomeCount: 1,
          expenseCount: 1,
          totalTransactions: 2,
          topCategory: {
            categoryId: 'category-1',
            categoryName: '매출',
            amount: 200000,
          },
        },
        createdAt: '2025-01-15T23:59:59Z',
      }

      // 3. 알림 읽음 처리
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockDashboard,
            }),
        } as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockDailyReport,
            }),
        } as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
            }),
        } as Response)

      // 대시보드 데이터 조회
      const dashboardResult = await dashboardService.getDashboardData()
      expect(dashboardResult.totalBalance).toBe(5000000)
      expect(dashboardResult.alerts).toHaveLength(1)

      // 자금일보 생성
      const reportResult = await dashboardService.generateDailyReport('2025-01-15')
      expect(reportResult.date).toBe('2025-01-15')
      expect(reportResult.netAmount).toBe(50000)

      // 알림 읽음 처리
      await dashboardService.markAlertAsRead('alert-1')
      expect(fetch).toHaveBeenCalledWith('/api/finance/alerts/alert-1/read', {
        method: 'PUT',
      })
    })

    it('다양한 알림 타입과 심각도를 올바르게 처리해야 함', async () => {
      const testCases = [
        {
          alert: {
            id: 'alert-1',
            type: 'low_balance',
            title: '잔액 부족 경고',
            message: '법인 통장의 잔액이 부족합니다.',
            severity: 'warning' as const,
            isRead: false,
            createdAt: '2025-01-15T08:00:00Z',
          },
          expectedSeverity: 'warning',
        },
        {
          alert: {
            id: 'alert-2',
            type: 'unusual_expense',
            title: '비정상적인 지출 감지',
            message: '평소보다 큰 금액의 지출이 발생했습니다.',
            severity: 'info' as const,
            isRead: true,
            createdAt: '2025-01-14T16:30:00Z',
          },
          expectedSeverity: 'info',
        },
        {
          alert: {
            id: 'alert-3',
            type: 'budget_exceeded',
            title: '예산 초과 경고',
            message: '사무용품 예산을 초과했습니다.',
            severity: 'error' as const,
            isRead: false,
            createdAt: '2025-01-13T14:20:00Z',
          },
          expectedSeverity: 'error',
        },
      ]

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]

        vi.mocked(fetch).mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: [testCase.alert],
            }),
        } as Response)

        const result = await dashboardService.getAlerts()

        expect(result[0].severity).toBe(testCase.expectedSeverity)
        expect(result[0].type).toBe(testCase.alert.type)
      }
    })
  })
})
