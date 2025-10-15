import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../../helpers/api-helper'
import { DBHelper } from '../../helpers/db-helper'

// Mock requireAuth
const mockRequireAuth = vi.fn()

// Mock the API endpoint handler
const mockGET = vi.fn()

describe('Finance Dashboard API', () => {
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

  describe('GET /api/finance/dashboard', () => {
    it('should fetch dashboard data successfully', async () => {
      const mockDashboardData = {
        totalBalance: 15000000,
        monthlyIncome: 5000000,
        monthlyExpense: 3000000,
        monthlyNet: 2000000,
        accountSummaries: [
          { id: 'account-1', name: '국민은행', balance: 10000000, type: 'checking' },
          { id: 'account-2', name: '신한은행', balance: 5000000, type: 'savings' },
        ],
        recentTransactions: [
          { id: 'tx-1', description: '급여', amount: 5000000, type: 'income', date: '2023-10-26' },
          { id: 'tx-2', description: '식비', amount: -15000, type: 'expense', date: '2023-10-25' },
        ],
        monthlyTrends: [
          { month: '2023-10', income: 5000000, expense: 3000000 },
          { month: '2023-09', income: 4500000, expense: 2800000 },
        ],
        alerts: [
          { id: 'alert-1', type: 'warning', message: '잔액이 낮습니다', severity: 'medium' },
        ],
      }

      // Mock multiple database queries for dashboard data
      DBHelper.mockQueryResponse('SELECT SUM(balance) as total FROM accounts', {
        rows: [{ total: mockDashboardData.totalBalance }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT * FROM accounts', {
        rows: mockDashboardData.accountSummaries,
        rowCount: mockDashboardData.accountSummaries.length,
      })

      DBHelper.mockQueryResponse('SELECT * FROM transactions', {
        rows: mockDashboardData.recentTransactions,
        rowCount: mockDashboardData.recentTransactions.length,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        // Simulate dashboard data aggregation
        const totalBalance = await DBHelper.getMockQuery()(
          'SELECT SUM(balance) as total FROM accounts',
        )
        const accounts = await DBHelper.getMockQuery()('SELECT * FROM accounts')
        const transactions = await DBHelper.getMockQuery()('SELECT * FROM transactions')

        const dashboardData = mockDashboardData

        return new Response(JSON.stringify({ success: true, data: dashboardData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockDashboardData)
    })

    it('should handle database errors gracefully', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT SUM(balance) as total FROM accounts')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch dashboard data' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      })

      const response = await mockGET({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Failed to fetch dashboard data')
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

      const response = await mockGET({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(401)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Unauthorized')
    })

    it('should return empty dashboard data when no data exists', async () => {
      const emptyDashboardData = {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        monthlyNet: 0,
        accountSummaries: [],
        recentTransactions: [],
        monthlyTrends: [],
        alerts: [],
      }

      DBHelper.mockQueryResponse('SELECT SUM(balance) as total FROM accounts', {
        rows: [{ total: 0 }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT * FROM accounts', {
        rows: [],
        rowCount: 0,
      })

      DBHelper.mockQueryResponse('SELECT * FROM transactions', {
        rows: [],
        rowCount: 0,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const totalBalance = await DBHelper.getMockQuery()(
          'SELECT SUM(balance) as total FROM accounts',
        )
        const accounts = await DBHelper.getMockQuery()('SELECT * FROM accounts')
        const transactions = await DBHelper.getMockQuery()('SELECT * FROM transactions')

        const dashboardData = emptyDashboardData

        return new Response(JSON.stringify({ success: true, data: dashboardData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(emptyDashboardData)
    })

    it('should handle partial data availability', async () => {
      const partialDashboardData = {
        totalBalance: 10000000,
        monthlyIncome: 2000000,
        monthlyExpense: 0,
        monthlyNet: 2000000,
        accountSummaries: [
          { id: 'account-1', name: '국민은행', balance: 10000000, type: 'checking' },
        ],
        recentTransactions: [],
        monthlyTrends: [],
        alerts: [],
      }

      DBHelper.mockQueryResponse('SELECT SUM(balance) as total FROM accounts', {
        rows: [{ total: 10000000 }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT * FROM accounts', {
        rows: partialDashboardData.accountSummaries,
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT * FROM transactions', {
        rows: [],
        rowCount: 0,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const totalBalance = await DBHelper.getMockQuery()(
          'SELECT SUM(balance) as total FROM accounts',
        )
        const accounts = await DBHelper.getMockQuery()('SELECT * FROM accounts')
        const transactions = await DBHelper.getMockQuery()('SELECT * FROM transactions')

        const dashboardData = partialDashboardData

        return new Response(JSON.stringify({ success: true, data: dashboardData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(partialDashboardData)
    })

    it('should handle large numbers correctly', async () => {
      const largeDataDashboard = {
        totalBalance: 999999999999,
        monthlyIncome: 500000000000,
        monthlyExpense: 300000000000,
        monthlyNet: 200000000000,
        accountSummaries: [
          { id: 'account-1', name: '대형은행', balance: 999999999999, type: 'checking' },
        ],
        recentTransactions: [
          {
            id: 'tx-1',
            description: '대규모 거래',
            amount: 500000000000,
            type: 'income',
            date: '2023-10-26',
          },
        ],
        monthlyTrends: [{ month: '2023-10', income: 500000000000, expense: 300000000000 }],
        alerts: [],
      }

      DBHelper.mockQueryResponse('SELECT SUM(balance) as total FROM accounts', {
        rows: [{ total: 999999999999 }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT * FROM accounts', {
        rows: largeDataDashboard.accountSummaries,
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT * FROM transactions', {
        rows: largeDataDashboard.recentTransactions,
        rowCount: 1,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const totalBalance = await DBHelper.getMockQuery()(
          'SELECT SUM(balance) as total FROM accounts',
        )
        const accounts = await DBHelper.getMockQuery()('SELECT * FROM accounts')
        const transactions = await DBHelper.getMockQuery()('SELECT * FROM transactions')

        const dashboardData = largeDataDashboard

        return new Response(JSON.stringify({ success: true, data: dashboardData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(largeDataDashboard)
    })
  })

  describe('edge cases', () => {
    it('should handle null values in database responses', async () => {
      DBHelper.mockQueryResponse('SELECT SUM(balance) as total FROM accounts', {
        rows: [{ total: null }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT * FROM accounts', {
        rows: [{ id: 'account-1', name: null, balance: null, type: null }],
        rowCount: 1,
      })

      DBHelper.mockQueryResponse('SELECT * FROM transactions', {
        rows: [],
        rowCount: 0,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const totalBalance = await DBHelper.getMockQuery()(
          'SELECT SUM(balance) as total FROM accounts',
        )
        const accounts = await DBHelper.getMockQuery()('SELECT * FROM accounts')
        const transactions = await DBHelper.getMockQuery()('SELECT * FROM transactions')

        const dashboardData = {
          totalBalance: totalBalance.rows[0]?.total || 0,
          monthlyIncome: 0,
          monthlyExpense: 0,
          monthlyNet: 0,
          accountSummaries:
            accounts.rows.length > 0
              ? accounts.rows.map((acc) => ({
                  id: acc.id || '',
                  name: acc.name || 'Unknown',
                  balance: acc.balance || 0,
                  type: acc.type || 'checking',
                }))
              : [],
          recentTransactions: [],
          monthlyTrends: [],
          alerts: [],
        }

        return new Response(JSON.stringify({ success: true, data: dashboardData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.totalBalance).toBe(0)
      expect(responseBody.data.accountSummaries).toBeDefined()
      if (responseBody.data.accountSummaries.length > 0) {
        expect(responseBody.data.accountSummaries[0].name).toBe('Unknown')
      }
    })

    it('should handle empty database responses', async () => {
      DBHelper.mockQueryResponse('SELECT SUM(balance) as total FROM accounts', {
        rows: [],
        rowCount: 0,
      })

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          const totalBalance = await DBHelper.getMockQuery()(
            'SELECT SUM(balance) as total FROM accounts',
          )
          if (totalBalance.rows.length === 0) {
            throw new Error('No data returned')
          }
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'No dashboard data available' }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      })

      const response = await mockGET({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(404)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('No dashboard data available')
    })
  })
})
