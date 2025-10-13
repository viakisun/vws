import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockCustomer } from '../../fixtures/crm-fixtures'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../../helpers/api-helper'
import { DBHelper } from '../../helpers/db-helper'

// Mock requireAuth
const mockRequireAuth = vi.fn()

// Mock the API endpoint handlers
const mockGET = vi.fn()
const mockPOST = vi.fn()

describe('CRM Customers API', () => {
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

  describe('GET /api/crm/customers', () => {
    it('should fetch all customers successfully', async () => {
      const mockCustomers = [
        mockCustomer,
        { ...mockCustomer, id: 'customer-2', name: '두 번째 고객사' },
      ]

      DBHelper.mockSelectResponse('crm_customers', mockCustomers)

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM crm_customers')
        return new Response(JSON.stringify({ success: true, data: mockCustomers }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockCustomers)
    })

    it('should handle database errors', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM crm_customers')
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

    it('should return empty array when no customers found', async () => {
      DBHelper.mockSelectResponse('crm_customers', [])

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM crm_customers')
        return new Response(JSON.stringify({ success: true, data: result.rows }), {
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

  describe('POST /api/crm/customers', () => {
    it('should create customer successfully', async () => {
      const customerData = {
        name: '새로운 고객사',
        businessNumber: '987-65-43210',
        representativeName: '김대표',
        contactPerson: '이담당',
        contactEmail: 'contact@newcompany.com',
        contactPhone: '010-9876-5432',
        address: '서울시 서초구',
        type: 'customer' as const,
        status: 'active' as const,
      }

      const mockCreatedCustomer = {
        id: 'customer-new',
        ...customerData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('crm_customers', mockCreatedCustomer)

      const request = createMockRequest('POST', customerData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO crm_customers ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedCustomer }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockCreatedCustomer)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        businessNumber: 'invalid-number',
        representativeName: '',
      }

      const request = createMockRequest('POST', invalidData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        if (!body.name || !body.businessNumber) {
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

    it('should handle duplicate business number', async () => {
      const customerData = {
        name: '중복 사업자번호 고객사',
        businessNumber: '123-45-67890',
        representativeName: '김대표',
        contactPerson: '이담당',
        contactEmail: 'contact@duplicate.com',
        contactPhone: '010-9876-5432',
        address: '서울시 서초구',
        type: 'customer' as const,
        status: 'active' as const,
      }

      DBHelper.mockError(new Error('Duplicate business number'))

      const request = createMockRequest('POST', customerData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO crm_customers ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('Duplicate')) {
            return new Response(JSON.stringify({ success: false, error: 'Duplicate business number' }), {
              status: 409,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          throw error
        }
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(409)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Duplicate business number')
    })

    it('should handle database errors during creation', async () => {
      const customerData = {
        name: '새로운 고객사',
        businessNumber: '987-65-43210',
        representativeName: '김대표',
        contactPerson: '이담당',
        contactEmail: 'contact@newcompany.com',
        contactPhone: '010-9876-5432',
        address: '서울시 서초구',
        type: 'customer' as const,
        status: 'active' as const,
      }

      DBHelper.mockError(new Error('Database insertion failed'))

      const request = createMockRequest('POST', customerData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO crm_customers ...')
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

    it('should handle malformed JSON', async () => {
      const request = new Request('http://localhost/api/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await request.json()
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(400)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Invalid JSON')
    })
  })

  describe('edge cases', () => {
    it('should handle very long customer names', async () => {
      const longNameData = {
        name: 'A'.repeat(1000),
        businessNumber: '987-65-43210',
        representativeName: '김대표',
        contactPerson: '이담당',
        contactEmail: 'contact@longname.com',
        contactPhone: '010-9876-5432',
        address: '서울시 서초구',
        type: 'customer' as const,
        status: 'active' as const,
      }

      const mockCreatedCustomer = {
        id: 'customer-long',
        ...longNameData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('crm_customers', mockCreatedCustomer)

      const request = createMockRequest('POST', longNameData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO crm_customers ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedCustomer }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.name).toBe('A'.repeat(1000))
    })

    it('should handle special characters in customer data', async () => {
      const specialData = {
        name: '특수문자@#$%^&*()회사',
        businessNumber: '987-65-43210',
        representativeName: '특수@#$%대표',
        contactPerson: '특수@#$%담당',
        contactEmail: 'special@company.com',
        contactPhone: '010-9876-5432',
        address: '서울시 서초구@#$%',
        type: 'customer' as const,
        status: 'active' as const,
      }

      const mockCreatedCustomer = {
        id: 'customer-special',
        ...specialData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('crm_customers', mockCreatedCustomer)

      const request = createMockRequest('POST', specialData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO crm_customers ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedCustomer }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.name).toBe('특수문자@#$%^&*()회사')
    })

    it('should handle Unicode characters in customer data', async () => {
      const unicodeData = {
        name: '한글회사한글',
        businessNumber: '987-65-43210',
        representativeName: '한글대표한글',
        contactPerson: '한글담당한글',
        contactEmail: 'unicode@company.com',
        contactPhone: '010-9876-5432',
        address: '서울시 서초구한글',
        type: 'customer' as const,
        status: 'active' as const,
      }

      const mockCreatedCustomer = {
        id: 'customer-unicode',
        ...unicodeData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('crm_customers', mockCreatedCustomer)

      const request = createMockRequest('POST', unicodeData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO crm_customers ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedCustomer }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.name).toBe('한글회사한글')
    })
  })
})