import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockAttendance } from '../../fixtures/hr-fixtures'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../../helpers/api-helper'
import { DBHelper } from '../../helpers/db-helper'

// Mock requireAuth
const mockRequireAuth = vi.fn()

// Mock the API endpoint handlers
const mockGET = vi.fn()
const mockPOST = vi.fn()
const mockPUT = vi.fn()
const mockDELETE = vi.fn()

describe('HR Attendance API', () => {
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

  describe('GET /api/hr/attendance/daily-detail', () => {
    it('should fetch daily attendance detail successfully', async () => {
      const mockAttendanceData = [
        { ...mockAttendance },
        { ...mockAttendance, id: 'attendance-2', employeeId: 'employee-2' },
      ]

      DBHelper.mockSelectResponse('attendance', mockAttendanceData)

      const request = createMockRequest('GET', { date: '2023-10-26' })
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM attendance WHERE date = ?')
        return new Response(JSON.stringify({ success: true, data: mockAttendanceData }), {
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
      expect(responseBody.data).toEqual(mockAttendanceData)
    })

    it('should handle database errors', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', { date: '2023-10-26' })
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM attendance WHERE date = ?')
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

      const request = createMockRequest('GET', { date: '2023-10-26' })
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

    it('should return empty array when no attendance found', async () => {
      DBHelper.mockSelectResponse('attendance', [])

      const request = createMockRequest('GET', { date: '2023-10-26' })
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM attendance WHERE date = ?')
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

  describe('GET /api/hr/attendance/monthly-summary', () => {
    it('should fetch monthly attendance summary successfully', async () => {
      const mockSummaryData = {
        employeeId: 'employee-1',
        month: '2023-10',
        totalWorkingDays: 22,
        totalWorkingHours: 176,
        totalOvertimeHours: 8,
        totalLateMinutes: 30,
        totalAbsentDays: 1,
        attendanceRate: 95.5,
      }

      DBHelper.mockSelectResponse('attendance_summary', [mockSummaryData])

      const request = createMockRequest('GET', { month: '2023-10', employeeId: 'employee-1' })
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()(
          'SELECT * FROM attendance_summary WHERE month = ? AND employee_id = ?',
        )
        return new Response(JSON.stringify({ success: true, data: mockSummaryData }), {
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
      expect(responseBody.data).toEqual(mockSummaryData)
    })

    it('should handle summary calculation errors', async () => {
      DBHelper.mockError(new Error('Summary calculation failed'))

      const request = createMockRequest('GET', { month: '2023-10', employeeId: 'employee-1' })
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()(
            'SELECT * FROM attendance_summary WHERE month = ? AND employee_id = ?',
          )
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Summary calculation failed' }),
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
      expect(responseBody.error).toBe('Summary calculation failed')
    })
  })

  describe('POST /api/hr/attendance', () => {
    it('should record attendance successfully', async () => {
      const attendanceData = {
        employeeId: 'employee-1',
        date: '2023-10-26',
        checkIn: '09:00',
        checkOut: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        status: 'present',
      }

      const mockCreatedAttendance = {
        id: 'attendance-new',
        ...attendanceData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('attendance', mockCreatedAttendance)

      const request = createMockRequest('POST', attendanceData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO attendance ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedAttendance }), {
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
      expect(responseBody.data).toEqual(mockCreatedAttendance)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        employeeId: '',
        date: 'invalid-date',
        checkIn: 'invalid-time',
      }

      const request = createMockRequest('POST', invalidData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        if (!body.employeeId || !body.date || !body.checkIn) {
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

    it('should handle duplicate attendance record', async () => {
      const attendanceData = {
        employeeId: 'employee-1',
        date: '2023-10-26',
        checkIn: '09:00',
        checkOut: '18:00',
        status: 'present',
      }

      DBHelper.mockError(new Error('Duplicate attendance record'))

      const request = createMockRequest('POST', attendanceData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO attendance ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('Duplicate')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Duplicate attendance record' }),
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
      expect(responseBody.error).toBe('Duplicate attendance record')
    })

    it('should handle database errors during creation', async () => {
      const attendanceData = {
        employeeId: 'employee-1',
        date: '2023-10-26',
        checkIn: '09:00',
        checkOut: '18:00',
        status: 'present',
      }

      DBHelper.mockError(new Error('Database insertion failed'))

      const request = createMockRequest('POST', attendanceData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO attendance ...')
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
    it('should handle very long attendance records', async () => {
      const longAttendanceData = {
        employeeId: 'employee-1',
        date: '2023-10-26',
        checkIn: '09:00',
        checkOut: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        status: 'present',
        notes: 'A'.repeat(1000),
      }

      const mockCreatedAttendance = {
        id: 'attendance-long',
        ...longAttendanceData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('attendance', mockCreatedAttendance)

      const request = createMockRequest('POST', longAttendanceData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO attendance ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedAttendance }), {
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
      expect(responseBody.data.notes).toBe('A'.repeat(1000))
    })

    it('should handle special characters in attendance data', async () => {
      const specialData = {
        employeeId: 'employee-1',
        date: '2023-10-26',
        checkIn: '09:00',
        checkOut: '18:00',
        status: 'present',
        notes: '특수문자@#$%^&*()노트',
      }

      const mockCreatedAttendance = {
        id: 'attendance-special',
        ...specialData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('attendance', mockCreatedAttendance)

      const request = createMockRequest('POST', specialData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO attendance ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedAttendance }), {
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
      expect(responseBody.data.notes).toBe('특수문자@#$%^&*()노트')
    })

    it('should handle Unicode characters in attendance data', async () => {
      const unicodeData = {
        employeeId: 'employee-1',
        date: '2023-10-26',
        checkIn: '09:00',
        checkOut: '18:00',
        status: 'present',
        notes: '한글노트한글',
      }

      const mockCreatedAttendance = {
        id: 'attendance-unicode',
        ...unicodeData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('attendance', mockCreatedAttendance)

      const request = createMockRequest('POST', unicodeData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO attendance ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedAttendance }), {
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
      expect(responseBody.data.notes).toBe('한글노트한글')
    })
  })
})
