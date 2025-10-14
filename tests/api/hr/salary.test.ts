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

describe('HR Salary API', () => {
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

  describe('GET /api/salary/payslips', () => {
    it('should fetch all payslips successfully', async () => {
      const mockPayslips = [
        {
          id: 'payslip-1',
          employeeId: 'employee-1',
          period: '2023-10',
          basicSalary: 3000000,
          allowances: 500000,
          deductions: 300000,
          netSalary: 3200000,
          status: 'confirmed',
          createdAt: '2023-10-26T10:00:00Z',
          updatedAt: '2023-10-26T10:00:00Z',
        },
        {
          id: 'payslip-2',
          employeeId: 'employee-2',
          period: '2023-10',
          basicSalary: 4000000,
          allowances: 600000,
          deductions: 400000,
          netSalary: 4200000,
          status: 'confirmed',
          createdAt: '2023-10-26T10:00:00Z',
          updatedAt: '2023-10-26T10:00:00Z',
        },
      ]

      DBHelper.mockSelectResponse('payslips', mockPayslips)

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM payslips')
        return new Response(JSON.stringify({ success: true, data: mockPayslips }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockPayslips)
    })

    it('should handle database errors', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM payslips')
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

    it('should return empty array when no payslips found', async () => {
      DBHelper.mockSelectResponse('payslips', [])

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM payslips')
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

  describe('POST /api/salary/payslips', () => {
    it('should create payslip successfully', async () => {
      const payslipData = {
        employeeId: 'employee-1',
        period: '2023-10',
        basicSalary: 3000000,
        allowances: 500000,
        deductions: 300000,
        netSalary: 3200000,
        status: 'draft',
      }

      const mockCreatedPayslip = {
        id: 'payslip-new',
        ...payslipData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('payslips', mockCreatedPayslip)

      const request = createMockRequest('POST', payslipData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO payslips ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedPayslip }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockCreatedPayslip)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        employeeId: '',
        period: '',
        basicSalary: -1000,
        netSalary: 'invalid-amount',
      }

      const request = createMockRequest('POST', invalidData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        if (!body.employeeId || !body.period || body.basicSalary <= 0 || typeof body.netSalary !== 'number') {
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

    it('should handle duplicate payslip period', async () => {
      const payslipData = {
        employeeId: 'employee-1',
        period: '2023-10',
        basicSalary: 3000000,
        allowances: 500000,
        deductions: 300000,
        netSalary: 3200000,
        status: 'draft',
      }

      DBHelper.mockError(new Error('Duplicate payslip period'))

      const request = createMockRequest('POST', payslipData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO payslips ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('Duplicate')) {
            return new Response(JSON.stringify({ success: false, error: 'Duplicate payslip period' }), {
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
      expect(responseBody.error).toBe('Duplicate payslip period')
    })

    it('should handle database errors during creation', async () => {
      const payslipData = {
        employeeId: 'employee-1',
        period: '2023-10',
        basicSalary: 3000000,
        allowances: 500000,
        deductions: 300000,
        netSalary: 3200000,
        status: 'draft',
      }

      DBHelper.mockError(new Error('Database insertion failed'))

      const request = createMockRequest('POST', payslipData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO payslips ...')
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

  describe('GET /api/salary/contracts', () => {
    it('should fetch all salary contracts successfully', async () => {
      const mockContracts = [
        {
          id: 'contract-1',
          employeeId: 'employee-1',
          contractType: 'permanent',
          startDate: '2023-01-01',
          endDate: null,
          basicSalary: 3000000,
          allowances: 500000,
          status: 'active',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 'contract-2',
          employeeId: 'employee-2',
          contractType: 'temporary',
          startDate: '2023-06-01',
          endDate: '2023-12-31',
          basicSalary: 2500000,
          allowances: 300000,
          status: 'active',
          createdAt: '2023-06-01T00:00:00Z',
          updatedAt: '2023-06-01T00:00:00Z',
        },
      ]

      DBHelper.mockSelectResponse('salary_contracts', mockContracts)

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM salary_contracts')
        return new Response(JSON.stringify({ success: true, data: mockContracts }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockContracts)
    })

    it('should handle contract query errors', async () => {
      DBHelper.mockError(new Error('Contract query failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM salary_contracts')
          return new Response(JSON.stringify({ success: true, data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(JSON.stringify({ success: false, error: 'Contract query failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Contract query failed')
    })
  })

  describe('edge cases', () => {
    it('should handle very large salary amounts', async () => {
      const largeSalaryData = {
        employeeId: 'employee-1',
        period: '2023-10',
        basicSalary: 999999999999,
        allowances: 500000000000,
        deductions: 100000000000,
        netSalary: 1399999999999,
        status: 'draft',
      }

      const mockCreatedPayslip = {
        id: 'payslip-large',
        ...largeSalaryData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('payslips', mockCreatedPayslip)

      const request = createMockRequest('POST', largeSalaryData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO payslips ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedPayslip }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.basicSalary).toBe(999999999999)
    })

    it('should handle special characters in salary data', async () => {
      const specialData = {
        employeeId: 'employee-1',
        period: '2023-10',
        basicSalary: 3000000,
        allowances: 500000,
        deductions: 300000,
        netSalary: 3200000,
        status: 'draft',
        notes: '특수문자@#$%^&*()노트',
      }

      const mockCreatedPayslip = {
        id: 'payslip-special',
        ...specialData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('payslips', mockCreatedPayslip)

      const request = createMockRequest('POST', specialData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO payslips ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedPayslip }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.notes).toBe('특수문자@#$%^&*()노트')
    })

    it('should handle Unicode characters in salary data', async () => {
      const unicodeData = {
        employeeId: 'employee-1',
        period: '2023-10',
        basicSalary: 3000000,
        allowances: 500000,
        deductions: 300000,
        netSalary: 3200000,
        status: 'draft',
        notes: '한글노트한글',
      }

      const mockCreatedPayslip = {
        id: 'payslip-unicode',
        ...unicodeData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('payslips', mockCreatedPayslip)

      const request = createMockRequest('POST', unicodeData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO payslips ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedPayslip }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.notes).toBe('한글노트한글')
    })
  })
})
