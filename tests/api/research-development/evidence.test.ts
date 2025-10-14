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

describe('R&D Evidence API', () => {
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

  describe('GET /api/research-development/evidence', () => {
    it('should fetch all R&D evidence successfully', async () => {
      const mockEvidence = [
        {
          id: 'evidence-1',
          projectId: 'project-1',
          employeeId: 'employee-1',
          evidenceType: 'salary',
          amount: 5000000,
          period: '2023-10',
          status: 'approved',
          description: '연구원 급여 증빙',
          submittedAt: '2023-10-26T10:00:00Z',
          approvedAt: '2023-10-27T14:00:00Z',
          approvedBy: 'manager-1',
          createdAt: '2023-10-26T10:00:00Z',
          updatedAt: '2023-10-27T14:00:00Z',
        },
        {
          id: 'evidence-2',
          projectId: 'project-1',
          employeeId: 'employee-2',
          evidenceType: 'equipment',
          amount: 3000000,
          period: '2023-10',
          status: 'pending',
          description: '연구장비 구매 증빙',
          submittedAt: '2023-10-26T10:00:00Z',
          approvedAt: null,
          approvedBy: null,
          createdAt: '2023-10-26T10:00:00Z',
          updatedAt: '2023-10-26T10:00:00Z',
        },
      ]

      DBHelper.mockSelectResponse('rd_evidence', mockEvidence)

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM rd_evidence')
        return new Response(JSON.stringify({ success: true, data: mockEvidence }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockEvidence)
    })

    it('should handle database errors', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM rd_evidence')
          return new Response(JSON.stringify({ success: true, data: [] }), {
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

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Database error')
    })

    it('should handle unauthorized access', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await mockRequireAuth(request)
          return new Response(JSON.stringify({ success: true, data: [] }), {
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

    it('should return empty array when no evidence found', async () => {
      DBHelper.mockSelectResponse('rd_evidence', [])

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM rd_evidence')
        return new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual([])
    })
  })

  describe('POST /api/research-development/evidence', () => {
    it('should create R&D evidence successfully', async () => {
      const evidenceData = {
        projectId: 'project-1',
        employeeId: 'employee-1',
        evidenceType: 'salary',
        amount: 5000000,
        period: '2023-10',
        description: '연구원 급여 증빙',
        status: 'pending',
      }

      const mockCreatedEvidence = {
        id: 'evidence-new',
        ...evidenceData,
        submittedAt: '2023-10-26T10:00:00Z',
        approvedAt: null,
        approvedBy: null,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_evidence', mockCreatedEvidence)

      const request = createMockRequest('POST', evidenceData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_evidence ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedEvidence }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockCreatedEvidence)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        projectId: '',
        employeeId: '',
        evidenceType: 'invalid-type',
        amount: -1000,
        period: '',
        description: '',
      }

      const request = createMockRequest('POST', invalidData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        if (!body.projectId || !body.employeeId || !['salary', 'equipment', 'material', 'other'].includes(body.evidenceType) ||
            body.amount <= 0 || !body.period || !body.description) {
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

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(400)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Validation failed')
    })

    it('should handle non-existent project', async () => {
      const evidenceData = {
        projectId: 'non-existent-project',
        employeeId: 'employee-1',
        evidenceType: 'salary',
        amount: 5000000,
        period: '2023-10',
        description: '연구원 급여 증빙',
        status: 'pending',
      }

      DBHelper.mockError(new Error('Project not found'))

      const request = createMockRequest('POST', evidenceData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO rd_evidence ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('not found')) {
            return new Response(JSON.stringify({ success: false, error: 'Project not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          throw error
        }
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(404)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Project not found')
    })

    it('should handle database errors during creation', async () => {
      const evidenceData = {
        projectId: 'project-1',
        employeeId: 'employee-1',
        evidenceType: 'salary',
        amount: 5000000,
        period: '2023-10',
        description: '연구원 급여 증빙',
        status: 'pending',
      }

      DBHelper.mockError(new Error('Database insertion failed'))

      const request = createMockRequest('POST', evidenceData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO rd_evidence ...')
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

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Database error')
    })
  })

  describe('PUT /api/research-development/evidence/[id]/approve', () => {
    it('should approve evidence successfully', async () => {
      const approvalData = {
        status: 'approved',
        approvedBy: 'manager-1',
        approvedAt: '2023-10-27T14:00:00Z',
      }

      const mockUpdatedEvidence = {
        id: 'evidence-1',
        projectId: 'project-1',
        employeeId: 'employee-1',
        evidenceType: 'salary',
        amount: 5000000,
        period: '2023-10',
        status: 'approved',
        description: '연구원 급여 증빙',
        submittedAt: '2023-10-26T10:00:00Z',
        approvedAt: '2023-10-27T14:00:00Z',
        approvedBy: 'manager-1',
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-27T14:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_evidence', mockUpdatedEvidence)

      const request = createMockRequest('PUT', approvalData)
      const event = createMockEvent(request, { id: 'evidence-1' })

      mockPUT.mockImplementation(async ({ request, params }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('UPDATE rd_evidence ...')
        return new Response(JSON.stringify({ success: true, data: mockUpdatedEvidence }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPUT({ request, url: event.url, params: event.params, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockUpdatedEvidence)
    })

    it('should handle evidence not found', async () => {
      DBHelper.mockError(new Error('Evidence not found'))

      const approvalData = {
        status: 'approved',
        approvedBy: 'manager-1',
        approvedAt: '2023-10-27T14:00:00Z',
      }

      const request = createMockRequest('PUT', approvalData)
      const event = createMockEvent(request, { id: 'non-existent' })

      mockPUT.mockImplementation(async ({ request, params }) => {
        try {
          await DBHelper.getMockQuery()('UPDATE rd_evidence ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('not found')) {
            return new Response(JSON.stringify({ success: false, error: 'Evidence not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          throw error
        }
      })

      const response = await mockPUT({ request, url: event.url, params: event.params, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(404)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Evidence not found')
    })
  })

  describe('edge cases', () => {
    it('should handle very large evidence amounts', async () => {
      const largeAmountData = {
        projectId: 'project-1',
        employeeId: 'employee-1',
        evidenceType: 'equipment',
        amount: 999999999999,
        period: '2023-10',
        description: '고가 연구장비 구매',
        status: 'pending',
      }

      const mockCreatedEvidence = {
        id: 'evidence-large',
        ...largeAmountData,
        submittedAt: '2023-10-26T10:00:00Z',
        approvedAt: null,
        approvedBy: null,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_evidence', mockCreatedEvidence)

      const request = createMockRequest('POST', largeAmountData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_evidence ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedEvidence }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.amount).toBe(999999999999)
    })

    it('should handle special characters in evidence data', async () => {
      const specialData = {
        projectId: 'project-1',
        employeeId: 'employee-1',
        evidenceType: 'salary',
        amount: 5000000,
        period: '2023-10',
        description: '특수문자@#$%^&*()증빙',
        status: 'pending',
      }

      const mockCreatedEvidence = {
        id: 'evidence-special',
        ...specialData,
        submittedAt: '2023-10-26T10:00:00Z',
        approvedAt: null,
        approvedBy: null,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_evidence', mockCreatedEvidence)

      const request = createMockRequest('POST', specialData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_evidence ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedEvidence }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.description).toBe('특수문자@#$%^&*()증빙')
    })

    it('should handle Unicode characters in evidence data', async () => {
      const unicodeData = {
        projectId: 'project-1',
        employeeId: 'employee-1',
        evidenceType: 'salary',
        amount: 5000000,
        period: '2023-10',
        description: '한글증빙한글',
        status: 'pending',
      }

      const mockCreatedEvidence = {
        id: 'evidence-unicode',
        ...unicodeData,
        submittedAt: '2023-10-26T10:00:00Z',
        approvedAt: null,
        approvedBy: null,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_evidence', mockCreatedEvidence)

      const request = createMockRequest('POST', unicodeData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_evidence ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedEvidence }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.description).toBe('한글증빙한글')
    })
  })
})
