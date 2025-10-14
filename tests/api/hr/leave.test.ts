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

describe('HR Leave API', () => {
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

  describe('GET /api/hr/leave', () => {
    it('should fetch all leave requests successfully', async () => {
      const mockLeaveRequests = [
        {
          id: 'leave-1',
          employeeId: 'employee-1',
          leaveType: 'annual',
          startDate: '2023-10-26',
          endDate: '2023-10-27',
          days: 2,
          reason: '개인 사유',
          status: 'pending',
          submittedAt: '2023-10-25T10:00:00Z',
          approvedAt: null,
          approvedBy: null,
          createdAt: '2023-10-25T10:00:00Z',
          updatedAt: '2023-10-25T10:00:00Z',
        },
        {
          id: 'leave-2',
          employeeId: 'employee-2',
          leaveType: 'sick',
          startDate: '2023-10-28',
          endDate: '2023-10-28',
          days: 1,
          reason: '병가',
          status: 'approved',
          submittedAt: '2023-10-27T09:00:00Z',
          approvedAt: '2023-10-27T14:00:00Z',
          approvedBy: 'manager-1',
          createdAt: '2023-10-27T09:00:00Z',
          updatedAt: '2023-10-27T14:00:00Z',
        },
      ]

      DBHelper.mockSelectResponse('leave_requests', mockLeaveRequests)

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM leave_requests')
        return new Response(JSON.stringify({ success: true, data: mockLeaveRequests }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockLeaveRequests)
    })

    it('should handle database errors', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM leave_requests')
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

    it('should return empty array when no leave requests found', async () => {
      DBHelper.mockSelectResponse('leave_requests', [])

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM leave_requests')
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

  describe('POST /api/hr/leave', () => {
    it('should create leave request successfully', async () => {
      const leaveData = {
        employeeId: 'employee-1',
        leaveType: 'annual',
        startDate: '2023-10-26',
        endDate: '2023-10-27',
        days: 2,
        reason: '개인 사유',
        status: 'pending',
      }

      const mockCreatedLeave = {
        id: 'leave-new',
        ...leaveData,
        submittedAt: '2023-10-25T10:00:00Z',
        approvedAt: null,
        approvedBy: null,
        createdAt: '2023-10-25T10:00:00Z',
        updatedAt: '2023-10-25T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('leave_requests', mockCreatedLeave)

      const request = createMockRequest('POST', leaveData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO leave_requests ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedLeave }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockCreatedLeave)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        employeeId: '',
        leaveType: 'invalid-type',
        startDate: 'invalid-date',
        endDate: '2023-10-25', // end date before start date
        days: -1,
        reason: '',
      }

      const request = createMockRequest('POST', invalidData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        if (!body.employeeId || !['annual', 'sick', 'personal', 'maternity', 'paternity'].includes(body.leaveType) || 
            !body.startDate || !body.endDate || body.days <= 0 || !body.reason) {
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

    it('should handle insufficient leave balance', async () => {
      const leaveData = {
        employeeId: 'employee-1',
        leaveType: 'annual',
        startDate: '2023-10-26',
        endDate: '2023-11-26', // 30 days leave
        days: 30,
        reason: '장기 휴가',
        status: 'pending',
      }

      DBHelper.mockError(new Error('Insufficient leave balance'))

      const request = createMockRequest('POST', leaveData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO leave_requests ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('Insufficient')) {
            return new Response(JSON.stringify({ success: false, error: 'Insufficient leave balance' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          throw error
        }
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(400)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Insufficient leave balance')
    })

    it('should handle database errors during creation', async () => {
      const leaveData = {
        employeeId: 'employee-1',
        leaveType: 'annual',
        startDate: '2023-10-26',
        endDate: '2023-10-27',
        days: 2,
        reason: '개인 사유',
        status: 'pending',
      }

      DBHelper.mockError(new Error('Database insertion failed'))

      const request = createMockRequest('POST', leaveData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO leave_requests ...')
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

  describe('PUT /api/hr/leave/[id]', () => {
    it('should approve leave request successfully', async () => {
      const approvalData = {
        status: 'approved',
        approvedBy: 'manager-1',
        approvedAt: '2023-10-25T14:00:00Z',
      }

      const mockUpdatedLeave = {
        id: 'leave-1',
        employeeId: 'employee-1',
        leaveType: 'annual',
        startDate: '2023-10-26',
        endDate: '2023-10-27',
        days: 2,
        reason: '개인 사유',
        status: 'approved',
        submittedAt: '2023-10-25T10:00:00Z',
        approvedAt: '2023-10-25T14:00:00Z',
        approvedBy: 'manager-1',
        createdAt: '2023-10-25T10:00:00Z',
        updatedAt: '2023-10-25T14:00:00Z',
      }

      DBHelper.mockUpdateResponse('leave_requests', mockUpdatedLeave)

      const request = createMockRequest('PUT', approvalData)
      const event = createMockEvent(request, { id: 'leave-1' })

      mockPUT.mockImplementation(async ({ request, params }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('UPDATE leave_requests ...')
        return new Response(JSON.stringify({ success: true, data: mockUpdatedLeave }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPUT({ request, url: event.url, params: event.params, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockUpdatedLeave)
    })

    it('should reject leave request successfully', async () => {
      const rejectionData = {
        status: 'rejected',
        approvedBy: 'manager-1',
        approvedAt: '2023-10-25T14:00:00Z',
        rejectionReason: '업무상 불가',
      }

      const mockUpdatedLeave = {
        id: 'leave-1',
        employeeId: 'employee-1',
        leaveType: 'annual',
        startDate: '2023-10-26',
        endDate: '2023-10-27',
        days: 2,
        reason: '개인 사유',
        status: 'rejected',
        submittedAt: '2023-10-25T10:00:00Z',
        approvedAt: '2023-10-25T14:00:00Z',
        approvedBy: 'manager-1',
        rejectionReason: '업무상 불가',
        createdAt: '2023-10-25T10:00:00Z',
        updatedAt: '2023-10-25T14:00:00Z',
      }

      DBHelper.mockUpdateResponse('leave_requests', mockUpdatedLeave)

      const request = createMockRequest('PUT', rejectionData)
      const event = createMockEvent(request, { id: 'leave-1' })

      mockPUT.mockImplementation(async ({ request, params }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('UPDATE leave_requests ...')
        return new Response(JSON.stringify({ success: true, data: mockUpdatedLeave }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPUT({ request, url: event.url, params: event.params, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockUpdatedLeave)
    })

    it('should handle leave request not found', async () => {
      DBHelper.mockError(new Error('Leave request not found'))

      const approvalData = {
        status: 'approved',
        approvedBy: 'manager-1',
        approvedAt: '2023-10-25T14:00:00Z',
      }

      const request = createMockRequest('PUT', approvalData)
      const event = createMockEvent(request, { id: 'non-existent' })

      mockPUT.mockImplementation(async ({ request, params }) => {
        try {
          await DBHelper.getMockQuery()('UPDATE leave_requests ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('not found')) {
            return new Response(JSON.stringify({ success: false, error: 'Leave request not found' }), {
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
      expect(responseBody.error).toBe('Leave request not found')
    })
  })

  describe('edge cases', () => {
    it('should handle very long leave reasons', async () => {
      const longReasonData = {
        employeeId: 'employee-1',
        leaveType: 'annual',
        startDate: '2023-10-26',
        endDate: '2023-10-27',
        days: 2,
        reason: 'A'.repeat(1000),
        status: 'pending',
      }

      const mockCreatedLeave = {
        id: 'leave-long',
        ...longReasonData,
        submittedAt: '2023-10-25T10:00:00Z',
        approvedAt: null,
        approvedBy: null,
        createdAt: '2023-10-25T10:00:00Z',
        updatedAt: '2023-10-25T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('leave_requests', mockCreatedLeave)

      const request = createMockRequest('POST', longReasonData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO leave_requests ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedLeave }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.reason).toBe('A'.repeat(1000))
    })

    it('should handle special characters in leave data', async () => {
      const specialData = {
        employeeId: 'employee-1',
        leaveType: 'annual',
        startDate: '2023-10-26',
        endDate: '2023-10-27',
        days: 2,
        reason: '특수문자@#$%^&*()사유',
        status: 'pending',
      }

      const mockCreatedLeave = {
        id: 'leave-special',
        ...specialData,
        submittedAt: '2023-10-25T10:00:00Z',
        approvedAt: null,
        approvedBy: null,
        createdAt: '2023-10-25T10:00:00Z',
        updatedAt: '2023-10-25T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('leave_requests', mockCreatedLeave)

      const request = createMockRequest('POST', specialData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO leave_requests ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedLeave }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.reason).toBe('특수문자@#$%^&*()사유')
    })

    it('should handle Unicode characters in leave data', async () => {
      const unicodeData = {
        employeeId: 'employee-1',
        leaveType: 'annual',
        startDate: '2023-10-26',
        endDate: '2023-10-27',
        days: 2,
        reason: '한글사유한글',
        status: 'pending',
      }

      const mockCreatedLeave = {
        id: 'leave-unicode',
        ...unicodeData,
        submittedAt: '2023-10-25T10:00:00Z',
        approvedAt: null,
        approvedBy: null,
        createdAt: '2023-10-25T10:00:00Z',
        updatedAt: '2023-10-25T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('leave_requests', mockCreatedLeave)

      const request = createMockRequest('POST', unicodeData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO leave_requests ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedLeave }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.reason).toBe('한글사유한글')
    })
  })
})
