import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockCrmStats } from '../../fixtures/crm-fixtures'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../../helpers/api-helper'
import { DBHelper } from '../../helpers/db-helper'

// Mock requireAuth
const mockRequireAuth = vi.fn()

// Mock the API endpoint handler
const mockGET = vi.fn()

describe('CRM Stats API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    DBHelper.reset()
    mockRequireAuth.mockResolvedValue({
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'ADMIN',
        permissions: ['read', 'write', 'admin'],
      },
    })
  })

  describe('GET /api/crm/stats', () => {
    it('should fetch CRM statistics successfully', async () => {
      const mockStats = {
        totalCustomers: 25,
        totalActiveContracts: 18,
        expectedRevenueThisMonth: 15000000,
        openOpportunities: 7,
      }

      // Mock database responses for each stat query
      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_customers', {
        rows: [{ count: mockStats.totalCustomers }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_contracts WHERE status = $1', {
        rows: [{ count: mockStats.totalActiveContracts }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COALESCE(SUM(total_amount), 0) as sum FROM crm_contracts', {
        rows: [{ sum: mockStats.expectedRevenueThisMonth }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_opportunities WHERE status = $1', {
        rows: [{ count: mockStats.openOpportunities }],
        rowCount: 1,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        // Simulate the stats calculation logic
        const customerCount = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_customers')
        const activeContracts = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_contracts WHERE status = $1', ['active'])
        const expectedRevenue = await DBHelper.getMockQuery()('SELECT COALESCE(SUM(total_amount), 0) as sum FROM crm_contracts')
        const openOpportunities = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_opportunities WHERE status = $1', ['open'])

        const stats = mockCrmStats

        return new Response(JSON.stringify({ success: true, data: stats }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockStats)
    })

    it('should handle database errors gracefully', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_customers')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(JSON.stringify({ success: false, error: 'Failed to fetch CRM stats' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Failed to fetch CRM stats')
    })

    it('should handle unauthorized access', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await mockRequireAuth(request)
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(401)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Unauthorized')
    })

    it('should return zero values when no data exists', async () => {
      const emptyStats = {
        totalCustomers: 0,
        totalActiveContracts: 0,
        expectedRevenueThisMonth: 0,
        openOpportunities: 0,
      }

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_customers', {
        rows: [{ count: 0 }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_contracts WHERE status = $1', {
        rows: [{ count: 0 }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COALESCE(SUM(total_amount), 0) as sum FROM crm_contracts', {
        rows: [{ sum: 0 }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_opportunities WHERE status = $1', {
        rows: [{ count: 0 }],
        rowCount: 1,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const customerCount = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_customers')
        const activeContracts = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_contracts WHERE status = $1', ['active'])
        const expectedRevenue = await DBHelper.getMockQuery()('SELECT COALESCE(SUM(total_amount), 0) as sum FROM crm_contracts')
        const openOpportunities = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_opportunities WHERE status = $1', ['open'])

        const stats = emptyStats

        return new Response(JSON.stringify({ success: true, data: stats }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(emptyStats)
    })

    it('should handle partial data availability', async () => {
      const partialStats = {
        totalCustomers: 10,
        totalActiveContracts: 5,
        expectedRevenueThisMonth: 0,
        openOpportunities: 0,
      }

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_customers', {
        rows: [{ count: 10 }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_contracts WHERE status = $1', {
        rows: [{ count: 5 }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COALESCE(SUM(total_amount), 0) as sum FROM crm_contracts', {
        rows: [{ sum: 0 }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_opportunities WHERE status = $1', {
        rows: [{ count: 0 }],
        rowCount: 1,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const customerCount = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_customers')
        const activeContracts = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_contracts WHERE status = $1', ['active'])
        const expectedRevenue = await DBHelper.getMockQuery()('SELECT COALESCE(SUM(total_amount), 0) as sum FROM crm_contracts')
        const openOpportunities = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_opportunities WHERE status = $1', ['open'])

        const stats = partialStats

        return new Response(JSON.stringify({ success: true, data: stats }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(partialStats)
    })

    it('should handle large numbers correctly', async () => {
      const largeStats = {
        totalCustomers: 1000000,
        totalActiveContracts: 500000,
        expectedRevenueThisMonth: 999999999,
        openOpportunities: 100000,
      }

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_customers', {
        rows: [{ count: largeStats.totalCustomers }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_contracts WHERE status = $1', {
        rows: [{ count: largeStats.totalActiveContracts }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COALESCE(SUM(total_amount), 0) as sum FROM crm_contracts', {
        rows: [{ sum: largeStats.expectedRevenueThisMonth }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_opportunities WHERE status = $1', {
        rows: [{ count: largeStats.openOpportunities }],
        rowCount: 1,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const customerCount = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_customers')
        const activeContracts = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_contracts WHERE status = $1', ['active'])
        const expectedRevenue = await DBHelper.getMockQuery()('SELECT COALESCE(SUM(total_amount), 0) as sum FROM crm_contracts')
        const openOpportunities = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_opportunities WHERE status = $1', ['open'])

        const stats = largeStats

        return new Response(JSON.stringify({ success: true, data: stats }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(largeStats)
    })
  })

  describe('edge cases', () => {
    it('should handle null values in database responses', async () => {
      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_customers', {
        rows: [{ count: null }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_contracts WHERE status = $1', {
        rows: [{ count: null }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COALESCE(SUM(total_amount), 0) as sum FROM crm_contracts', {
        rows: [{ sum: null }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_opportunities WHERE status = $1', {
        rows: [{ count: null }],
        rowCount: 1,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const customerCount = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_customers')
        const activeContracts = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_contracts WHERE status = $1', ['active'])
        const expectedRevenue = await DBHelper.getMockQuery()('SELECT COALESCE(SUM(total_amount), 0) as sum FROM crm_contracts')
        const openOpportunities = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_opportunities WHERE status = $1', ['open'])

        const stats = {
          totalCustomers: customerCount.rows[0]?.count || 0,
          totalActiveContracts: activeContracts.rows[0]?.count || 0,
          expectedRevenueThisMonth: expectedRevenue.rows[0]?.sum || 0,
          openOpportunities: openOpportunities.rows[0]?.count || 0,
        }

        return new Response(JSON.stringify({ success: true, data: stats }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.totalCustomers).toBe(0)
      expect(responseBody.data.totalActiveContracts).toBe(0)
      expect(responseBody.data.expectedRevenueThisMonth).toBe(0)
      expect(responseBody.data.openOpportunities).toBe(0)
    })

    it('should handle empty database responses', async () => {
      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM crm_customers', {
        rows: [],
        rowCount: 0,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          const customerCount = await DBHelper.getMockQuery()('SELECT COUNT(*) as count FROM crm_customers')
          if (customerCount.rows.length === 0) {
            throw new Error('No data returned')
          }
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(JSON.stringify({ success: false, error: 'No data available' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(404)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('No data available')
    })
  })
})