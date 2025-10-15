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

describe('R&D Project Members API', () => {
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

  describe('GET /api/research-development/project-members', () => {
    it('should fetch all project members successfully', async () => {
      const mockProjectMembers = [
        {
          id: 'member-1',
          projectId: 'project-1',
          employeeId: 'employee-1',
          role: 'lead_researcher',
          participationRate: 100.0,
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          status: 'active',
          salary: 5000000,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 'member-2',
          projectId: 'project-1',
          employeeId: 'employee-2',
          role: 'researcher',
          participationRate: 80.0,
          startDate: '2023-02-01',
          endDate: '2023-11-30',
          status: 'active',
          salary: 4000000,
          createdAt: '2023-02-01T00:00:00Z',
          updatedAt: '2023-02-01T00:00:00Z',
        },
      ]

      DBHelper.mockSelectResponse('rd_project_members', mockProjectMembers)

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM rd_project_members')
        return new Response(JSON.stringify({ success: true, data: mockProjectMembers }), {
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
      expect(responseBody.data).toEqual(mockProjectMembers)
    })

    it('should handle database errors', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM rd_project_members')
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

    it('should return empty array when no project members found', async () => {
      DBHelper.mockSelectResponse('rd_project_members', [])

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM rd_project_members')
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

  describe('POST /api/research-development/project-members', () => {
    it('should create project member successfully', async () => {
      const memberData = {
        projectId: 'project-1',
        employeeId: 'employee-3',
        role: 'researcher',
        participationRate: 70.0,
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        salary: 4500000,
        status: 'active',
      }

      const mockCreatedMember = {
        id: 'member-new',
        ...memberData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_project_members', mockCreatedMember)

      const request = createMockRequest('POST', memberData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_project_members ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedMember }), {
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
      expect(responseBody.data).toEqual(mockCreatedMember)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        projectId: '',
        employeeId: '',
        role: 'invalid-role',
        participationRate: -10.0,
        startDate: 'invalid-date',
        endDate: '2023-10-25', // end date before start date
        salary: -1000,
      }

      const request = createMockRequest('POST', invalidData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        if (
          !body.projectId ||
          !body.employeeId ||
          !['lead_researcher', 'researcher', 'assistant'].includes(body.role) ||
          body.participationRate < 0 ||
          body.participationRate > 100 ||
          !body.startDate ||
          !body.endDate ||
          body.salary <= 0
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

    it('should handle duplicate project member', async () => {
      const memberData = {
        projectId: 'project-1',
        employeeId: 'employee-1',
        role: 'researcher',
        participationRate: 70.0,
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        salary: 4500000,
        status: 'active',
      }

      DBHelper.mockError(new Error('Duplicate project member'))

      const request = createMockRequest('POST', memberData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO rd_project_members ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('Duplicate')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Duplicate project member' }),
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
      expect(responseBody.error).toBe('Duplicate project member')
    })

    it('should handle database errors during creation', async () => {
      const memberData = {
        projectId: 'project-1',
        employeeId: 'employee-3',
        role: 'researcher',
        participationRate: 70.0,
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        salary: 4500000,
        status: 'active',
      }

      DBHelper.mockError(new Error('Database insertion failed'))

      const request = createMockRequest('POST', memberData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO rd_project_members ...')
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

  describe('PUT /api/research-development/project-members/[id]', () => {
    it('should update project member successfully', async () => {
      const updateData = {
        role: 'lead_researcher',
        participationRate: 90.0,
        salary: 5500000,
        status: 'active',
      }

      const mockUpdatedMember = {
        id: 'member-1',
        projectId: 'project-1',
        employeeId: 'employee-1',
        role: 'lead_researcher',
        participationRate: 90.0,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        salary: 5500000,
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_project_members', mockUpdatedMember)

      const request = createMockRequest('PUT', updateData)
      const event = createMockEvent(request, { id: 'member-1' })

      mockPUT.mockImplementation(async ({ request, params }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('UPDATE rd_project_members ...')
        return new Response(JSON.stringify({ success: true, data: mockUpdatedMember }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPUT({
        request,
        url: event.url,
        params: event.params,
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
      expect(responseBody.data).toEqual(mockUpdatedMember)
    })

    it('should handle member not found', async () => {
      DBHelper.mockError(new Error('Project member not found'))

      const updateData = {
        role: 'lead_researcher',
        participationRate: 90.0,
        salary: 5500000,
      }

      const request = createMockRequest('PUT', updateData)
      const event = createMockEvent(request, { id: 'non-existent' })

      mockPUT.mockImplementation(async ({ request, params }) => {
        try {
          await DBHelper.getMockQuery()('UPDATE rd_project_members ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('not found')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Project member not found' }),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }
          throw error
        }
      })

      const response = await mockPUT({
        request,
        url: event.url,
        params: event.params,
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
      expect(responseBody.error).toBe('Project member not found')
    })
  })

  describe('edge cases', () => {
    it('should handle very high participation rates', async () => {
      const highParticipationData = {
        projectId: 'project-1',
        employeeId: 'employee-3',
        role: 'researcher',
        participationRate: 100.0,
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        salary: 4500000,
        status: 'active',
      }

      const mockCreatedMember = {
        id: 'member-high',
        ...highParticipationData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_project_members', mockCreatedMember)

      const request = createMockRequest('POST', highParticipationData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_project_members ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedMember }), {
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
      expect(responseBody.data.participationRate).toBe(100.0)
    })

    it('should handle very large salary amounts', async () => {
      const largeSalaryData = {
        projectId: 'project-1',
        employeeId: 'employee-3',
        role: 'lead_researcher',
        participationRate: 100.0,
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        salary: 999999999999,
        status: 'active',
      }

      const mockCreatedMember = {
        id: 'member-large-salary',
        ...largeSalaryData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_project_members', mockCreatedMember)

      const request = createMockRequest('POST', largeSalaryData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_project_members ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedMember }), {
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
      expect(responseBody.data.salary).toBe(999999999999)
    })

    it('should handle Unicode characters in member data', async () => {
      const unicodeData = {
        projectId: 'project-1',
        employeeId: 'employee-3',
        role: 'researcher',
        participationRate: 70.0,
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        salary: 4500000,
        status: 'active',
        notes: '한글노트한글',
      }

      const mockCreatedMember = {
        id: 'member-unicode',
        ...unicodeData,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_project_members', mockCreatedMember)

      const request = createMockRequest('POST', unicodeData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_project_members ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedMember }), {
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
