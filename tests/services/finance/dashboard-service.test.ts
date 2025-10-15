import { DashboardService } from '$lib/finance/services/dashboard-service'
import type { DailyFinanceReport, FinanceAlert, FinanceDashboard } from '$lib/finance/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('Finance Dashboard Service', () => {
  let dashboardService: DashboardService

  beforeEach(() => {
    vi.clearAllMocks()
    dashboardService = new DashboardService()
  })

  describe('getDashboardData', () => {
    it('대시보드 데이터를 성공적으로 조회해야 함', async () => {
      const mockDashboard: FinanceDashboard = {
        currentBalance: 5000000,
        monthlyIncome: 2000000,
        monthlyExpense: 1500000,
        netCashFlow: 500000,
        accountBalances: [],
        upcomingPayments: [],
        budgetStatus: {} as any,
        lastUpdated: '2025-01-15T10:00:00Z',
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
        ],
        alerts: [
          {
            id: 'alert-1',
            type: 'low_balance',
            title: '잔액 부족 경고',
            message: '법인 통장의 잔액이 부족합니다.',
            severity: 'medium',
            isRead: false,
            isResolved: false,
            createdAt: '2025-01-15T08:00:00Z',
          },
        ],
        trends: [
          {
            period: '2025-01-13',
            metric: 'balance',
            value: 4800000,
            change: 0,
            changePercentage: 0,
            direction: 'stable',
          },
          {
            period: '2025-01-14',
            metric: 'balance',
            value: 4900000,
            change: 100000,
            changePercentage: 2.1,
            direction: 'up',
          },
          {
            period: '2025-01-15',
            metric: 'balance',
            value: 5000000,
            change: 100000,
            changePercentage: 2.0,
            direction: 'up',
          },
          {
            period: '2024-11',
            metric: 'income',
            value: 1800000,
            change: 0,
            changePercentage: 0,
            direction: 'stable',
          },
          {
            period: '2024-12',
            metric: 'income',
            value: 1900000,
            change: 100000,
            changePercentage: 5.6,
            direction: 'up',
          },
          {
            period: '2025-01',
            metric: 'income',
            value: 2000000,
            change: 100000,
            changePercentage: 5.3,
            direction: 'up',
          },
          {
            period: '2024-11',
            metric: 'expense',
            value: 1400000,
            change: 0,
            changePercentage: 0,
            direction: 'stable',
          },
          {
            period: '2024-12',
            metric: 'expense',
            value: 1450000,
            change: 50000,
            changePercentage: 3.6,
            direction: 'up',
          },
          {
            period: '2025-01',
            metric: 'expense',
            value: 1500000,
            change: 50000,
            changePercentage: 3.4,
            direction: 'up',
          },
        ],
        predictions: [],
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
        currentBalance: 4500000,
        monthlyIncome: 1800000,
        monthlyExpense: 1400000,
        netCashFlow: 400000,
        accountBalances: [],
        recentTransactions: [],
        upcomingPayments: [],
        budgetStatus: {} as any,
        alerts: [],
        trends: [],
        predictions: [],
        lastUpdated: '2025-01-10T10:00:00Z',
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
        currentBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        netCashFlow: 0,
        accountBalances: [],
        recentTransactions: [],
        upcomingPayments: [],
        budgetStatus: {} as any,
        alerts: [],
        trends: [],
        predictions: [],
        lastUpdated: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockEmptyDashboard,
          }),
      } as Response)

      const result = await dashboardService.getDashboardData()

      expect(result.currentBalance).toBe(0)
      expect(result.accountBalances).toHaveLength(0)
      expect(result.recentTransactions).toHaveLength(0)
      expect(result.recentTransactions).toHaveLength(0)
      expect(result.alerts).toHaveLength(0)
    })
  })

  describe('generateDailyReport', () => {
    it('자금일보를 성공적으로 생성해야 함', async () => {
      const mockDailyReport: DailyFinanceReport = {
        id: 'report-1',
        reportDate: '2025-01-15',
        status: 'completed',
        openingBalance: 5000000,
        closingBalance: 4850000,
        totalInflow: 200000,
        totalOutflow: 350000,
        netFlow: -150000,
        transactionCount: 2,
        accountSummaries: [],
        categorySummaries: [],
        alerts: [],
        notes: '',
        generatedAt: '2025-01-15T10:00:00Z',
        generatedBy: 'system',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
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
        body: JSON.stringify({ generatedAt: '2025-01-15' }),
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
        reportDate: '2025-01-15',
        status: 'completed',
        openingBalance: 3000000,
        closingBalance: 3200000,
        totalInflow: 200000,
        totalOutflow: 0,
        netFlow: 200000,
        transactionCount: 1,
        accountSummaries: [],
        categorySummaries: [],
        alerts: [],
        notes: '',
        generatedAt: '2025-01-15T10:00:00Z',
        generatedBy: 'system',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
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
          reportDate: '2025-01-13',
          status: 'completed',
          openingBalance: 5000000,
          closingBalance: 5200000,
          totalInflow: 300000,
          totalOutflow: 100000,
          netFlow: 200000,
          transactionCount: 5,
          accountSummaries: [],
          categorySummaries: [],
          alerts: [],
          notes: '',
          generatedAt: '2025-01-13T10:00:00Z',
          generatedBy: 'system',
          createdAt: '2025-01-13T23:59:59Z',
          updatedAt: '2025-01-13T23:59:59Z',
        },
        {
          id: 'report-2',
          reportDate: '2025-01-14',
          status: 'completed',
          openingBalance: 5200000,
          closingBalance: 5100000,
          totalInflow: 200000,
          totalOutflow: 300000,
          netFlow: -100000,
          transactionCount: 3,
          accountSummaries: [],
          categorySummaries: [],
          alerts: [],
          notes: '',
          generatedAt: '2025-01-14T10:00:00Z',
          generatedBy: 'system',
          createdAt: '2025-01-14T23:59:59Z',
          updatedAt: '2025-01-14T23:59:59Z',
        },
        {
          id: 'report-3',
          reportDate: '2025-01-15',
          status: 'completed',
          openingBalance: 5100000,
          closingBalance: 5300000,
          totalInflow: 400000,
          totalOutflow: 200000,
          netFlow: 200000,
          transactionCount: 4,
          accountSummaries: [],
          categorySummaries: [],
          alerts: [],
          notes: '',
          generatedAt: '2025-01-15T10:00:00Z',
          generatedBy: 'system',
          createdAt: '2025-01-15T23:59:59Z',
          updatedAt: '2025-01-15T23:59:59Z',
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
          severity: 'medium',
          isRead: false,
          isResolved: false,
          createdAt: '2025-01-15T08:00:00Z',
        },
        {
          id: 'alert-2',
          type: 'high_expense',
          title: '비정상적인 지출 감지',
          message: '평소보다 큰 금액의 지출이 발생했습니다.',
          severity: 'low',
          isRead: true,
          isResolved: false,
          createdAt: '2025-01-14T16:30:00Z',
        },
        {
          id: 'alert-3',
          type: 'budget_exceeded',
          title: '예산 초과 경고',
          message: '사무용품 예산을 초과했습니다.',
          severity: 'high',
          isRead: false,
          isResolved: false,
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
          severity: 'medium',
          isRead: false,
          isResolved: false,
          createdAt: '2025-01-15T08:00:00Z',
        },
        {
          id: 'alert-3',
          type: 'budget_exceeded',
          title: '예산 초과 경고',
          message: '사무용품 예산을 초과했습니다.',
          severity: 'high',
          isRead: false,
          isResolved: false,
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
          type: 'high_expense',
          title: '비정상적인 지출 감지',
          message: '평소보다 큰 금액의 지출이 발생했습니다.',
          severity: 'low',
          isRead: true,
          isResolved: false,
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
          generatedAt: '2025-01-16',
          predictedBalance: 5050000,
          confidence: 0.85,
        },
        {
          generatedAt: '2025-01-17',
          predictedBalance: 5100000,
          confidence: 0.82,
        },
        {
          generatedAt: '2025-01-18',
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
          generatedAt: '2025-01-16',
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
          { generatedAt: '2025-01-13', inflow: 600000, outflow: 400000, net: 200000 },
          { generatedAt: '2025-01-14', inflow: 700000, outflow: 500000, net: 200000 },
          { generatedAt: '2025-01-15', inflow: 700000, outflow: 600000, net: 100000 },
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
        currentBalance: 5000000,
        monthlyIncome: 2000000,
        monthlyExpense: 1500000,
        netCashFlow: 500000,
        accountBalances: [],
        recentTransactions: [],
        upcomingPayments: [],
        budgetStatus: {} as any,
        alerts: [
          {
            id: 'alert-1',
            type: 'low_balance',
            title: '잔액 부족 경고',
            message: '법인 통장의 잔액이 부족합니다.',
            severity: 'medium',
            isRead: false,
            isResolved: false,
            createdAt: '2025-01-15T08:00:00Z',
          },
        ],
        trends: [],
        predictions: [],
        lastUpdated: '2025-01-15T10:00:00Z',
      }

      // 2. 자금일보 생성
      const mockDailyReport: DailyFinanceReport = {
        id: 'report-1',
        reportDate: '2025-01-15',
        status: 'completed',
        openingBalance: 5000000,
        closingBalance: 4850000,
        totalInflow: 200000,
        totalOutflow: 350000,
        netFlow: -150000,
        transactionCount: 2,
        accountSummaries: [],
        categorySummaries: [],
        alerts: [],
        notes: '',
        generatedAt: '2025-01-15T10:00:00Z',
        generatedBy: 'system',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
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
      expect(dashboardResult.currentBalance).toBe(5000000)
      expect(dashboardResult.alerts).toHaveLength(1)

      // 자금일보 생성
      const reportResult = await dashboardService.generateDailyReport('2025-01-15')
      expect(reportResult.reportDate).toBe('2025-01-15')
      expect(reportResult.netFlow).toBe(200000)

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
            isResolved: false,
            createdAt: '2025-01-15T08:00:00Z',
          },
          expectedSeverity: 'warning',
        },
        {
          alert: {
            id: 'alert-2',
            type: 'unusual_transaction',
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
