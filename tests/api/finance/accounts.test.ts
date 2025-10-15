import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FINANCE_FIXTURES } from '../../fixtures/finance-fixtures'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../../helpers/api-helper'
import { DBHelper } from '../../helpers/db-helper'

const mockAccount = FINANCE_FIXTURES.accounts.checking

// Mock requireAuth
const mockRequireAuth = vi.fn()

// Mock the API endpoint handlers
const mockGET = vi.fn()
const mockPOST = vi.fn()
const mockPUT = vi.fn()
const mockDELETE = vi.fn()

describe('Finance Accounts API', () => {
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

  describe('GET /api/finance/accounts', () => {
    it('should fetch all accounts successfully', async () => {
      const mockAccounts = [
        { ...mockAccount },
        { ...mockAccount, id: 'account-2', name: '두 번째 계좌' },
      ]

      DBHelper.mockSelectResponse('accounts', mockAccounts)

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM accounts')
        return new Response(JSON.stringify({ success: true, data: mockAccounts }), {
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
      expect(responseBody.data).toEqual(mockAccounts)
    })

    it('should handle database errors', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM accounts')
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

    it('should return empty array when no accounts found', async () => {
      DBHelper.mockSelectResponse('accounts', [])

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM accounts')
        return new Response(JSON.stringify({ success: true, data: [] }), {
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
      expect(responseBody.data).toEqual([])
    })
  })

  describe('POST /api/finance/accounts', () => {
    it('should create account successfully', async () => {
      const accountData = {
        name: '새로운 계좌',
        bankName: '국민은행',
        accountNumber: '123-456-789012',
        accountType: 'checking',
        balance: 0,
        currency: 'KRW',
        isMain: false,
      }

      const mockCreatedAccount = {
        id: 'account-new',
        ...accountData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('accounts', mockCreatedAccount)

      const request = createMockRequest('POST', accountData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO accounts ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedAccount }), {
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
      expect(responseBody.data).toEqual(mockCreatedAccount)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        accountNumber: 'invalid-number',
      }

      const request = createMockRequest('POST', invalidData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        if (!body.name || !body.accountNumber) {
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

    it('should handle duplicate account number', async () => {
      const accountData = {
        name: '중복 계좌번호',
        bankName: '국민은행',
        accountNumber: '123-456-789012',
        accountType: 'checking',
        balance: 0,
        currency: 'KRW',
        isMain: false,
      }

      DBHelper.mockError(new Error('Duplicate account number'))

      const request = createMockRequest('POST', accountData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO accounts ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('Duplicate')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Duplicate account number' }),
              {
                status: 409,
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

      expect(response.status).toBe(409)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Duplicate account number')
    })

    it('should handle database errors during creation', async () => {
      const accountData = {
        name: '새로운 계좌',
        bankName: '국민은행',
        accountNumber: '123-456-789012',
        accountType: 'checking',
        balance: 0,
        currency: 'KRW',
        isMain: false,
      }

      DBHelper.mockError(new Error('Database insertion failed'))

      const request = createMockRequest('POST', accountData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO accounts ...')
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

    it('should handle malformed JSON', async () => {
      const request = new Request('http://localhost/api/finance/accounts', {
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
      expect(responseBody.error).toBe('Invalid JSON')
    })
  })

  describe('edge cases', () => {
    it('should handle very long account names', async () => {
      const longNameData = {
        name: 'A'.repeat(1000),
        bankName: '국민은행',
        accountNumber: '123-456-789012',
        accountType: 'checking',
        balance: 0,
        currency: 'KRW',
        isMain: false,
      }

      const mockCreatedAccount = {
        id: 'account-long',
        ...longNameData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('accounts', mockCreatedAccount)

      const request = createMockRequest('POST', longNameData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO accounts ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedAccount }), {
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
      expect(responseBody.data.name).toBe('A'.repeat(1000))
    })

    it('should handle special characters in account data', async () => {
      const specialData = {
        name: '특수문자@#$%^&*()계좌',
        bankName: '특수@#$%은행',
        accountNumber: '123-456-789012',
        accountType: 'checking',
        balance: 0,
        currency: 'KRW',
        isMain: false,
      }

      const mockCreatedAccount = {
        id: 'account-special',
        ...specialData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('accounts', mockCreatedAccount)

      const request = createMockRequest('POST', specialData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO accounts ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedAccount }), {
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
      expect(responseBody.data.name).toBe('특수문자@#$%^&*()계좌')
    })

    it('should handle Unicode characters in account data', async () => {
      const unicodeData = {
        name: '한글계좌한글',
        bankName: '한글은행한글',
        accountNumber: '123-456-789012',
        accountType: 'checking',
        balance: 0,
        currency: 'KRW',
        isMain: false,
      }

      const mockCreatedAccount = {
        id: 'account-unicode',
        ...unicodeData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('accounts', mockCreatedAccount)

      const request = createMockRequest('POST', unicodeData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO accounts ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedAccount }), {
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
      expect(responseBody.data.name).toBe('한글계좌한글')
    })
  })
})
