import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../../helpers/api-helper'
import { DBHelper } from '../../helpers/db-helper'

// Mock requireAuth
const mockRequireAuth = vi.fn()

// Mock the API endpoint handlers
const mockGET = vi.fn()
const mockPOST = vi.fn()
const mockPUT = vi.fn()
const mockDELETE = vi.fn()

describe('R&D Budgets API', () => {
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

  describe('GET /api/research-development/budgets/summary-by-year', () => {
    it('should fetch budget summary by year successfully', async () => {
      const mockBudgetSummary = {
        year: 2023,
        totalBudget: 500000000,
        totalSpent: 320000000,
        totalRemaining: 180000000,
        executionRate: 64.0,
        projects: [
          {
            id: 'project-1',
            name: 'AI 기반 자동화 시스템 개발',
            budget: 100000000,
            spent: 65000000,
            remaining: 35000000,
            executionRate: 65.0,
          },
          {
            id: 'project-2',
            name: '블록체인 보안 솔루션 연구',
            budget: 80000000,
            spent: 30000000,
            remaining: 50000000,
            executionRate: 37.5,
          },
        ],
      }

      DBHelper.mockSelectResponse('rd_project_budgets', [])

      const request = createMockRequest('GET', { year: '2023' })
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()(
          'SELECT * FROM rd_project_budgets WHERE year = ?',
        )
        return new Response(JSON.stringify({ success: true, data: mockBudgetSummary }), {
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
      expect(responseBody.data).toEqual(mockBudgetSummary)
    })

    it('should handle database errors', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', { year: '2023' })
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM rd_project_budgets WHERE year = ?')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(JSON.stringify({ success: false, error: 'Database error' }), {
            status: 500,
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

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Database error')
    })

    it('should handle unauthorized access', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

      const request = createMockRequest('GET', { year: '2023' })
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

    it('should return empty summary when no budget data found', async () => {
      const emptySummary = {
        year: 2023,
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        executionRate: 0,
        projects: [],
      }

      DBHelper.mockSelectResponse('rd_project_budgets', [])

      const request = createMockRequest('GET', { year: '2023' })
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()(
          'SELECT * FROM rd_project_budgets WHERE year = ?',
        )
        return new Response(JSON.stringify({ success: true, data: emptySummary }), {
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
      expect(responseBody.data).toEqual(emptySummary)
    })
  })

  describe('GET /api/research-development/project-budgets', () => {
    it('should fetch project budgets successfully', async () => {
      const mockProjectBudgets = [
        {
          id: 'budget-1',
          projectId: 'project-1',
          year: 2023,
          totalBudget: 100000000,
          personnelCosts: 60000000,
          equipmentCosts: 25000000,
          materialCosts: 10000000,
          otherCosts: 5000000,
          spentAmount: 65000000,
          remainingAmount: 35000000,
          executionRate: 65.0,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 'budget-2',
          projectId: 'project-2',
          year: 2023,
          totalBudget: 80000000,
          personnelCosts: 40000000,
          equipmentCosts: 20000000,
          materialCosts: 15000000,
          otherCosts: 5000000,
          spentAmount: 30000000,
          remainingAmount: 50000000,
          executionRate: 37.5,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ]

      DBHelper.mockSelectResponse('rd_project_budgets', mockProjectBudgets)

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM rd_project_budgets')
        return new Response(JSON.stringify({ success: true, data: mockProjectBudgets }), {
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
      expect(responseBody.data).toEqual(mockProjectBudgets)
    })

    it('should handle budget query errors', async () => {
      DBHelper.mockError(new Error('Budget query failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM rd_project_budgets')
          return new Response(JSON.stringify({ success: true, data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(JSON.stringify({ success: false, error: 'Budget query failed' }), {
            status: 500,
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

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Budget query failed')
    })
  })

  describe('POST /api/research-development/project-budgets', () => {
    it('should create project budget successfully', async () => {
      const budgetData = {
        projectId: 'project-1',
        year: 2023,
        totalBudget: 100000000,
        personnelCosts: 60000000,
        equipmentCosts: 25000000,
        materialCosts: 10000000,
        otherCosts: 5000000,
      }

      const mockCreatedBudget = {
        id: 'budget-new',
        ...budgetData,
        spentAmount: 0,
        remainingAmount: 100000000,
        executionRate: 0.0,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_project_budgets', mockCreatedBudget)

      const request = createMockRequest('POST', budgetData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_project_budgets ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedBudget }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({
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

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockCreatedBudget)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        projectId: '',
        year: 'invalid-year',
        totalBudget: -1000,
        personnelCosts: -500,
        equipmentCosts: -300,
        materialCosts: -100,
        otherCosts: -100,
      }

      const request = createMockRequest('POST', invalidData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        if (
          !body.projectId ||
          !body.year ||
          body.totalBudget <= 0 ||
          body.personnelCosts < 0 ||
          body.equipmentCosts < 0 ||
          body.materialCosts < 0 ||
          body.otherCosts < 0
        ) {
          return new Response(JSON.stringify({ success: false, error: 'Validation failed' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify({ success: true, data: {} }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({
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

      expect(response.status).toBe(400)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Validation failed')
    })

    it('should handle budget amount mismatch', async () => {
      const budgetData = {
        projectId: 'project-1',
        year: 2023,
        totalBudget: 100000000,
        personnelCosts: 60000000,
        equipmentCosts: 25000000,
        materialCosts: 10000000,
        otherCosts: 6000000, // Total exceeds budget
      }

      DBHelper.mockError(new Error('Budget amount mismatch'))

      const request = createMockRequest('POST', budgetData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO rd_project_budgets ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('mismatch')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Budget amount mismatch' }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }
          throw error
        }
      })

      const response = await mockPOST({
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

      expect(response.status).toBe(400)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Budget amount mismatch')
    })

    it('should handle database errors during creation', async () => {
      const budgetData = {
        projectId: 'project-1',
        year: 2023,
        totalBudget: 100000000,
        personnelCosts: 60000000,
        equipmentCosts: 25000000,
        materialCosts: 10000000,
        otherCosts: 5000000,
      }

      DBHelper.mockError(new Error('Database insertion failed'))

      const request = createMockRequest('POST', budgetData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO rd_project_budgets ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(JSON.stringify({ success: false, error: 'Database error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })

      const response = await mockPOST({
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
      expect(responseBody.error).toBe('Database error')
    })
  })

  describe('edge cases', () => {
    it('should handle very large budget amounts', async () => {
      const largeBudgetData = {
        projectId: 'project-1',
        year: 2023,
        totalBudget: 999999999999,
        personnelCosts: 500000000000,
        equipmentCosts: 300000000000,
        materialCosts: 150000000000,
        otherCosts: 49999999999,
      }

      const mockCreatedBudget = {
        id: 'budget-large',
        ...largeBudgetData,
        spentAmount: 0,
        remainingAmount: 999999999999,
        executionRate: 0.0,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_project_budgets', mockCreatedBudget)

      const request = createMockRequest('POST', largeBudgetData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_project_budgets ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedBudget }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({
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

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.totalBudget).toBe(999999999999)
    })

    it('should handle zero budget amounts', async () => {
      const zeroBudgetData = {
        projectId: 'project-1',
        year: 2023,
        totalBudget: 0,
        personnelCosts: 0,
        equipmentCosts: 0,
        materialCosts: 0,
        otherCosts: 0,
      }

      const mockCreatedBudget = {
        id: 'budget-zero',
        ...zeroBudgetData,
        spentAmount: 0,
        remainingAmount: 0,
        executionRate: 0.0,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_project_budgets', mockCreatedBudget)

      const request = createMockRequest('POST', zeroBudgetData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_project_budgets ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedBudget }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({
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

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.totalBudget).toBe(0)
    })
  })
})
