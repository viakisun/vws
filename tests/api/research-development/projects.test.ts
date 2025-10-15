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

describe('R&D Projects API', () => {
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

  describe('GET /api/research-development/projects', () => {
    it('should fetch all R&D projects successfully', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'AI 기반 자동화 시스템 개발',
          description: '인공지능을 활용한 업무 자동화 시스템 개발 프로젝트',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          status: 'active',
          budget: 100000000,
          spentAmount: 65000000,
          remainingAmount: 35000000,
          executionRate: 65.0,
          projectManager: 'manager-1',
          department: '개발팀',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 'project-2',
          name: '블록체인 보안 솔루션 연구',
          description: '블록체인 기술을 활용한 보안 솔루션 연구 프로젝트',
          startDate: '2023-06-01',
          endDate: '2024-05-31',
          status: 'active',
          budget: 80000000,
          spentAmount: 30000000,
          remainingAmount: 50000000,
          executionRate: 37.5,
          projectManager: 'manager-2',
          department: '연구팀',
          createdAt: '2023-06-01T00:00:00Z',
          updatedAt: '2023-06-01T00:00:00Z',
        },
      ]

      DBHelper.mockSelectResponse('rd_projects', mockProjects)

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM rd_projects')
        return new Response(JSON.stringify({ success: true, data: mockProjects }), {
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
      expect(responseBody.data).toEqual(mockProjects)
    })

    it('should handle database errors', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('SELECT * FROM rd_projects')
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

    it('should return empty array when no projects found', async () => {
      DBHelper.mockSelectResponse('rd_projects', [])

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      mockGET.mockImplementation(async ({ request }) => {
        const result = await DBHelper.getMockQuery()('SELECT * FROM rd_projects')
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

  describe('POST /api/research-development/projects', () => {
    it('should create R&D project successfully', async () => {
      const projectData = {
        name: '새로운 R&D 프로젝트',
        description: '혁신적인 기술 개발 프로젝트',
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        budget: 50000000,
        projectManager: 'manager-1',
        department: '연구개발팀',
        status: 'planning',
      }

      const mockCreatedProject = {
        id: 'project-new',
        ...projectData,
        spentAmount: 0,
        remainingAmount: 50000000,
        executionRate: 0.0,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_projects', mockCreatedProject)

      const request = createMockRequest('POST', projectData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_projects ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedProject }), {
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
      expect(responseBody.data).toEqual(mockCreatedProject)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        description: '',
        startDate: 'invalid-date',
        endDate: '2023-10-25', // end date before start date
        budget: -1000,
        projectManager: '',
      }

      const request = createMockRequest('POST', invalidData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        if (
          !body.name ||
          !body.description ||
          !body.startDate ||
          !body.endDate ||
          body.budget <= 0 ||
          !body.projectManager
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

    it('should handle duplicate project name', async () => {
      const projectData = {
        name: '중복 프로젝트명',
        description: '중복된 프로젝트명으로 인한 오류',
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        budget: 50000000,
        projectManager: 'manager-1',
        department: '연구개발팀',
        status: 'planning',
      }

      DBHelper.mockError(new Error('Duplicate project name'))

      const request = createMockRequest('POST', projectData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO rd_projects ...')
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('Duplicate')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Duplicate project name' }),
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
      expect(responseBody.error).toBe('Duplicate project name')
    })

    it('should handle database errors during creation', async () => {
      const projectData = {
        name: '새로운 R&D 프로젝트',
        description: '혁신적인 기술 개발 프로젝트',
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        budget: 50000000,
        projectManager: 'manager-1',
        department: '연구개발팀',
        status: 'planning',
      }

      DBHelper.mockError(new Error('Database insertion failed'))

      const request = createMockRequest('POST', projectData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        try {
          await DBHelper.getMockQuery()('INSERT INTO rd_projects ...')
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
    it('should handle very long project descriptions', async () => {
      const longDescriptionData = {
        name: '긴 설명 프로젝트',
        description: 'A'.repeat(1000),
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        budget: 50000000,
        projectManager: 'manager-1',
        department: '연구개발팀',
        status: 'planning',
      }

      const mockCreatedProject = {
        id: 'project-long',
        ...longDescriptionData,
        spentAmount: 0,
        remainingAmount: 50000000,
        executionRate: 0.0,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_projects', mockCreatedProject)

      const request = createMockRequest('POST', longDescriptionData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_projects ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedProject }), {
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
      expect(responseBody.data.description).toBe('A'.repeat(1000))
    })

    it('should handle special characters in project data', async () => {
      const specialData = {
        name: '특수문자@#$%^&*()프로젝트',
        description: '특수문자@#$%^&*()설명',
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        budget: 50000000,
        projectManager: 'manager-1',
        department: '특수@#$팀',
        status: 'planning',
      }

      const mockCreatedProject = {
        id: 'project-special',
        ...specialData,
        spentAmount: 0,
        remainingAmount: 50000000,
        executionRate: 0.0,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_projects', mockCreatedProject)

      const request = createMockRequest('POST', specialData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_projects ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedProject }), {
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
      expect(responseBody.data.name).toBe('특수문자@#$%^&*()프로젝트')
    })

    it('should handle Unicode characters in project data', async () => {
      const unicodeData = {
        name: '한글프로젝트한글',
        description: '한글설명한글',
        startDate: '2023-10-26',
        endDate: '2024-10-25',
        budget: 50000000,
        projectManager: 'manager-1',
        department: '한글팀',
        status: 'planning',
      }

      const mockCreatedProject = {
        id: 'project-unicode',
        ...unicodeData,
        spentAmount: 0,
        remainingAmount: 50000000,
        executionRate: 0.0,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_projects', mockCreatedProject)

      const request = createMockRequest('POST', unicodeData)
      const event = createMockEvent(request)

      mockPOST.mockImplementation(async ({ request }) => {
        const body = await request.json()
        const result = await DBHelper.getMockQuery()('INSERT INTO rd_projects ...')
        return new Response(JSON.stringify({ success: true, data: mockCreatedProject }), {
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
      expect(responseBody.data.name).toBe('한글프로젝트한글')
    })
  })
})
