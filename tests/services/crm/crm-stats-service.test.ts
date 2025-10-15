import { loadCRMStats, loadCustomerStats } from '$lib/crm/services/crm-stats-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('CRM Stats Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadCRMStats', () => {
    it('CRM 통계를 성공적으로 로드해야 함', async () => {
      const mockStats = {
        totalCustomers: 25,
        activeContracts: 15,
        expectedRevenueThisMonth: 2500000,
        openOpportunities: 8,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockStats,
          }),
      } as Response)

      const result = await loadCRMStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockStats)
      expect(fetch).toHaveBeenCalledWith('/api/crm/stats?type=overview')
    })

    it('API 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await loadCRMStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('CRM 통계 로드 중 오류가 발생했습니다.')
    })

    it('API 응답 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Database connection failed',
          }),
      } as Response)

      const result = await loadCRMStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('빈 통계 데이터를 올바르게 처리해야 함', async () => {
      const mockEmptyStats = {
        totalCustomers: 0,
        activeContracts: 0,
        expectedRevenueThisMonth: 0,
        openOpportunities: 0,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockEmptyStats,
          }),
      } as Response)

      const result = await loadCRMStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockEmptyStats)
      expect(result.data?.totalCustomers).toBe(0)
      expect((result.data as any)?.activeContracts).toBe(0)
      expect((result.data as any)?.expectedRevenueThisMonth).toBe(0)
      expect((result.data as any)?.openOpportunities).toBe(0)
    })

    it('큰 수치의 통계 데이터를 올바르게 처리해야 함', async () => {
      const mockLargeStats = {
        totalCustomers: 1000,
        activeContracts: 750,
        expectedRevenueThisMonth: 50000000,
        openOpportunities: 150,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockLargeStats,
          }),
      } as Response)

      const result = await loadCRMStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockLargeStats)
      expect(result.data?.totalCustomers).toBe(1000)
      expect((result.data as any)?.activeContracts).toBe(750)
      expect((result.data as any)?.expectedRevenueThisMonth).toBe(50000000)
      expect((result.data as any)?.openOpportunities).toBe(150)
    })

    it('네트워크 타임아웃 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Request timeout'))

      const result = await loadCRMStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('CRM 통계 로드 중 오류가 발생했습니다.')
    })

    it('잘못된 JSON 응답 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response)

      const result = await loadCRMStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('CRM 통계 로드 중 오류가 발생했습니다.')
    })
  })

  describe('loadCustomerStats', () => {
    it('고객별 통계를 성공적으로 로드해야 함', async () => {
      const mockCustomerStats = [
        {
          customer_id: 'customer-123',
          customer_name: '테스트 고객',
          total_sales: 15000000,
          total_purchases: 5000000,
          pending_amount: 3000000,
          overdue_amount: 0,
          transaction_count: 10,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCustomerStats,
          }),
      } as Response)

      const result = await loadCustomerStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCustomerStats)
      expect(fetch).toHaveBeenCalledWith('/api/crm/stats?type=customers')
    })

    it('존재하지 않는 고객의 통계 요청 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Customer not found',
          }),
      } as Response)

      const result = await loadCustomerStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Customer not found')
    })

    it('고객 통계 API 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await loadCustomerStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('고객별 통계 로드 중 오류가 발생했습니다.')
    })

    it('빈 고객 통계 데이터를 올바르게 처리해야 함', async () => {
      const mockEmptyCustomerStats: any[] = []

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockEmptyCustomerStats,
          }),
      } as Response)

      const result = await loadCustomerStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockEmptyCustomerStats)
      expect(result.data?.length).toBe(0)
    })

    it('대량 거래 고객의 통계를 올바르게 처리해야 함', async () => {
      const mockLargeCustomerStats = [
        {
          customer_id: 'customer-large',
          customer_name: '대량 거래 고객',
          total_sales: 500000000,
          total_purchases: 100000000,
          pending_amount: 75000000,
          overdue_amount: 0,
          transaction_count: 50,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockLargeCustomerStats,
          }),
      } as Response)

      const result = await loadCustomerStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockLargeCustomerStats)
      expect(result.data?.[0]?.total_sales).toBe(500000000)
      expect(result.data?.[0]?.pending_amount).toBe(75000000)
      expect(result.data?.[0]?.transaction_count).toBe(50)
    })

    it('잘못된 고객 ID 형식 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Invalid customer ID',
          }),
      } as Response)

      const result = await loadCustomerStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid customer ID')
    })

    it('네트워크 타임아웃 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Request timeout'))

      const result = await loadCustomerStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('고객별 통계 로드 중 오류가 발생했습니다.')
    })

    it('잘못된 JSON 응답 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response)

      const result = await loadCustomerStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('고객별 통계 로드 중 오류가 발생했습니다.')
    })
  })

  describe('Integration tests', () => {
    it('전체 CRM 통계 워크플로우가 올바르게 작동해야 함', async () => {
      // 1. 전체 CRM 통계 로드
      const mockCRMStats = {
        totalCustomers: 100,
        activeContracts: 75,
        expectedRevenueThisMonth: 15000000,
        openOpportunities: 20,
      }

      // 2. 고객 통계 로드
      const mockCustomerStats = [
        {
          customer_id: 'customer-workflow',
          customer_name: '워크플로우 고객',
          total_sales: 25000000,
          total_purchases: 5000000,
          pending_amount: 5000000,
          overdue_amount: 0,
          transaction_count: 8,
        },
      ]

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockCRMStats,
            }),
        } as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockCustomerStats,
            }),
        } as Response)

      // 전체 CRM 통계 로드
      const crmStatsResult = await loadCRMStats()
      expect(crmStatsResult.success).toBe(true)
      expect(crmStatsResult.data?.totalCustomers).toBe(100)
      expect((crmStatsResult.data as any)?.activeContracts).toBe(75)

      // 고객 통계 로드
      const customerStatsResult = await loadCustomerStats()
      expect(customerStatsResult.success).toBe(true)
      expect(customerStatsResult.data?.[0]?.customer_id).toBe('customer-workflow')
      expect(customerStatsResult.data?.[0]?.transaction_count).toBe(8)
    })

    it('고객 통계를 성공적으로 로드해야 함', async () => {
      const mockCustomerStats = [
        {
          customer_id: 'customer-1',
          customer_name: '고객 1',
          total_sales: 5000000,
          total_purchases: 1000000,
          pending_amount: 1000000,
          overdue_amount: 0,
          transaction_count: 3,
        },
        {
          customer_id: 'customer-2',
          customer_name: '고객 2',
          total_sales: 12000000,
          total_purchases: 3000000,
          pending_amount: 3000000,
          overdue_amount: 0,
          transaction_count: 7,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCustomerStats,
          }),
      } as Response)

      const result = await loadCustomerStats()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]?.customer_id).toBe('customer-1')
      expect(result.data?.[1]?.customer_id).toBe('customer-2')
    })

    it('CRM 통계와 고객 통계의 일관성을 확인해야 함', async () => {
      const mockCRMStats = {
        totalCustomers: 2,
        activeContracts: 5,
        expectedRevenueThisMonth: 8000000,
        openOpportunities: 3,
      }

      const mockCustomerStats = [
        {
          customer_id: 'customer-1',
          customer_name: '고객 1',
          total_sales: 3000000,
          total_purchases: 500000,
          pending_amount: 500000,
          overdue_amount: 0,
          transaction_count: 3,
        },
        {
          customer_id: 'customer-2',
          customer_name: '고객 2',
          total_sales: 4000000,
          total_purchases: 200000,
          pending_amount: 1000000,
          overdue_amount: 0,
          transaction_count: 2,
        },
      ]

      // 전체 CRM 통계 로드
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCRMStats,
          }),
      } as Response)

      // 고객 통계 로드
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCustomerStats,
          }),
      } as Response)

      const crmStatsResult = await loadCRMStats()
      expect(crmStatsResult.success).toBe(true)
      expect(crmStatsResult.data?.totalCustomers).toBe(2)

      const customerStatsResult = await loadCustomerStats()
      expect(customerStatsResult.success).toBe(true)
      expect(customerStatsResult.data).toHaveLength(2)

      // 통계 데이터 확인
      expect(customerStatsResult.data?.[0]?.customer_id).toBe('customer-1')
      expect(customerStatsResult.data?.[1]?.customer_id).toBe('customer-2')
    })
  })
})
