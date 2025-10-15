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
      expect(result.data?.activeContracts).toBe(0)
      expect(result.data?.expectedRevenueThisMonth).toBe(0)
      expect(result.data?.openOpportunities).toBe(0)
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
      expect(result.data?.activeContracts).toBe(750)
      expect(result.data?.expectedRevenueThisMonth).toBe(50000000)
      expect(result.data?.openOpportunities).toBe(150)
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
      const customerId = 'customer-123'
      const mockCustomerStats = {
        customerId,
        totalContracts: 5,
        activeContracts: 3,
        totalRevenue: 15000000,
        pendingAmount: 3000000,
        lastInteraction: '2025-01-10T14:30:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCustomerStats,
          }),
      } as Response)

      const result = await loadCustomerStats(customerId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCustomerStats)
      expect(fetch).toHaveBeenCalledWith('/api/crm/stats?type=customers')
    })

    it('존재하지 않는 고객의 통계 요청 시 에러를 반환해야 함', async () => {
      const nonExistentCustomerId = 'non-existent-customer'

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Customer not found',
          }),
      } as Response)

      const result = await loadCustomerStats(nonExistentCustomerId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Customer not found')
    })

    it('고객 통계 API 오류 시 에러를 반환해야 함', async () => {
      const customerId = 'customer-456'

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await loadCustomerStats(customerId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('고객별 통계 로드 중 오류가 발생했습니다.')
    })

    it('빈 고객 통계 데이터를 올바르게 처리해야 함', async () => {
      const customerId = 'customer-empty'
      const mockEmptyCustomerStats = {
        customerId,
        totalContracts: 0,
        activeContracts: 0,
        totalRevenue: 0,
        pendingAmount: 0,
        lastInteraction: null,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockEmptyCustomerStats,
          }),
      } as Response)

      const result = await loadCustomerStats(customerId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockEmptyCustomerStats)
      expect(result.data?.totalContracts).toBe(0)
      expect(result.data?.activeContracts).toBe(0)
      expect(result.data?.totalRevenue).toBe(0)
      expect(result.data?.pendingAmount).toBe(0)
      expect(result.data?.lastInteraction).toBeNull()
    })

    it('대량 거래 고객의 통계를 올바르게 처리해야 함', async () => {
      const customerId = 'customer-large'
      const mockLargeCustomerStats = {
        customerId,
        totalContracts: 50,
        activeContracts: 25,
        totalRevenue: 500000000,
        pendingAmount: 75000000,
        lastInteraction: '2025-01-15T09:15:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockLargeCustomerStats,
          }),
      } as Response)

      const result = await loadCustomerStats(customerId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockLargeCustomerStats)
      expect(result.data?.totalContracts).toBe(50)
      expect(result.data?.activeContracts).toBe(25)
      expect(result.data?.totalRevenue).toBe(500000000)
      expect(result.data?.pendingAmount).toBe(75000000)
      expect(result.data?.lastInteraction).toBe('2025-01-15T09:15:00Z')
    })

    it('잘못된 고객 ID 형식 시 에러를 반환해야 함', async () => {
      const invalidCustomerId = ''

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Invalid customer ID',
          }),
      } as Response)

      const result = await loadCustomerStats(invalidCustomerId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid customer ID')
    })

    it('네트워크 타임아웃 시 에러를 반환해야 함', async () => {
      const customerId = 'customer-timeout'

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Request timeout'))

      const result = await loadCustomerStats(customerId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('고객별 통계 로드 중 오류가 발생했습니다.')
    })

    it('잘못된 JSON 응답 시 에러를 반환해야 함', async () => {
      const customerId = 'customer-invalid-json'

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response)

      const result = await loadCustomerStats(customerId)

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

      // 2. 특정 고객 통계 로드
      const customerId = 'customer-workflow'
      const mockCustomerStats = {
        customerId,
        totalContracts: 8,
        activeContracts: 5,
        totalRevenue: 25000000,
        pendingAmount: 5000000,
        lastInteraction: '2025-01-15T10:00:00Z',
      }

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
      expect(crmStatsResult.data?.activeContracts).toBe(75)

      // 특정 고객 통계 로드
      const customerStatsResult = await loadCustomerStats(customerId)
      expect(customerStatsResult.success).toBe(true)
      expect(customerStatsResult.data?.customerId).toBe(customerId)
      expect(customerStatsResult.data?.totalContracts).toBe(8)
      expect(customerStatsResult.data?.activeContracts).toBe(5)
    })

    it('다양한 고객의 통계를 순차적으로 로드해야 함', async () => {
      const customerIds = ['customer-1', 'customer-2', 'customer-3']
      const mockCustomerStats = [
        {
          customerId: 'customer-1',
          totalContracts: 3,
          activeContracts: 2,
          totalRevenue: 5000000,
          pendingAmount: 1000000,
          lastInteraction: '2025-01-10T14:30:00Z',
        },
        {
          customerId: 'customer-2',
          totalContracts: 7,
          activeContracts: 4,
          totalRevenue: 12000000,
          pendingAmount: 3000000,
          lastInteraction: '2025-01-12T09:15:00Z',
        },
        {
          customerId: 'customer-3',
          totalContracts: 1,
          activeContracts: 1,
          totalRevenue: 2000000,
          pendingAmount: 0,
          lastInteraction: '2025-01-15T16:45:00Z',
        },
      ]

      for (let i = 0; i < customerIds.length; i++) {
        vi.mocked(fetch).mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockCustomerStats[i],
            }),
        } as Response)
      }

      const results = []
      for (const customerId of customerIds) {
        const result = await loadCustomerStats(customerId)
        results.push(result)
      }

      expect(results).toHaveLength(3)
      expect(results[0].success).toBe(true)
      expect(results[0].data?.customerId).toBe('customer-1')
      expect(results[0].data?.totalContracts).toBe(3)

      expect(results[1].success).toBe(true)
      expect(results[1].data?.customerId).toBe('customer-2')
      expect(results[1].data?.totalContracts).toBe(7)

      expect(results[2].success).toBe(true)
      expect(results[2].data?.customerId).toBe('customer-3')
      expect(results[2].data?.totalContracts).toBe(1)
    })

    it('CRM 통계와 고객 통계의 일관성을 확인해야 함', async () => {
      const mockCRMStats = {
        totalCustomers: 5,
        activeContracts: 12,
        expectedRevenueThisMonth: 8000000,
        openOpportunities: 3,
      }

      const customerIds = ['customer-1', 'customer-2', 'customer-3', 'customer-4', 'customer-5']
      const mockCustomerStats = [
        {
          customerId: 'customer-1',
          totalContracts: 3,
          activeContracts: 2,
          totalRevenue: 3000000,
          pendingAmount: 500000,
          lastInteraction: '2025-01-10T14:30:00Z',
        },
        {
          customerId: 'customer-2',
          totalContracts: 2,
          activeContracts: 1,
          totalRevenue: 1500000,
          pendingAmount: 0,
          lastInteraction: '2025-01-12T09:15:00Z',
        },
        {
          customerId: 'customer-3',
          totalContracts: 4,
          activeContracts: 3,
          totalRevenue: 4000000,
          pendingAmount: 1000000,
          lastInteraction: '2025-01-15T16:45:00Z',
        },
        {
          customerId: 'customer-4',
          totalContracts: 1,
          activeContracts: 1,
          totalRevenue: 800000,
          pendingAmount: 0,
          lastInteraction: '2025-01-14T11:20:00Z',
        },
        {
          customerId: 'customer-5',
          totalContracts: 2,
          activeContracts: 1,
          totalRevenue: 700000,
          pendingAmount: 200000,
          lastInteraction: '2025-01-13T15:30:00Z',
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

      // 각 고객별 통계 로드
      for (let i = 0; i < customerIds.length; i++) {
        vi.mocked(fetch).mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockCustomerStats[i],
            }),
        } as Response)
      }

      const crmStatsResult = await loadCRMStats()
      expect(crmStatsResult.success).toBe(true)
      expect(crmStatsResult.data?.totalCustomers).toBe(5)

      const customerStatsResults = []
      for (const customerId of customerIds) {
        const result = await loadCustomerStats(customerId)
        customerStatsResults.push(result)
      }

      // 전체 고객 수 확인
      expect(customerStatsResults).toHaveLength(5)

      // 각 고객별 통계 합계 확인
      const totalContracts = customerStatsResults.reduce(
        (sum, result) => sum + (result.data?.totalContracts || 0),
        0,
      )
      const totalActiveContracts = customerStatsResults.reduce(
        (sum, result) => sum + (result.data?.activeContracts || 0),
        0,
      )
      const totalRevenue = customerStatsResults.reduce(
        (sum, result) => sum + (result.data?.totalRevenue || 0),
        0,
      )

      expect(totalContracts).toBe(12) // 3+2+4+1+2
      expect(totalActiveContracts).toBe(8) // 2+1+3+1+1
      expect(totalRevenue).toBe(10000000) // 3000000+1500000+4000000+800000+700000
    })
  })
})
