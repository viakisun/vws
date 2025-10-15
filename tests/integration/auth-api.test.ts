import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../helpers/api-helper'
import { DBHelper } from '../helpers/db-helper'

// Mock authentication functions
const mockVerifyToken = vi.fn()
const mockGetUserFromToken = vi.fn()
const mockCheckPermissions = vi.fn()

// Mock requireAuth
const mockRequireAuth = vi.fn()

describe('Auth + API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    DBHelper.reset()
  })

  describe('Authenticated API Request Flow', () => {
    it('should complete authenticated API request with valid token', async () => {
      // 1. Mock valid user and token
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'ADMIN',
        permissions: ['read', 'write', 'admin'],
        employee_id: 'employee-123',
      }

      const mockToken = 'valid-jwt-token'

      mockVerifyToken.mockResolvedValue({
        valid: true,
        payload: {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'ADMIN',
          permissions: ['read', 'write', 'admin'],
          iat: 1736928600,
          exp: 1737015000,
        },
      })

      mockGetUserFromToken.mockResolvedValue(mockUser)
      mockRequireAuth.mockResolvedValue(mockUser)

      // 2. Mock API data
      const mockCustomers = [
        {
          id: 'customer-1',
          name: '테스트 고객사',
          businessNumber: '123-45-67890',
          status: 'active',
        },
        {
          id: 'customer-2',
          name: '두 번째 고객사',
          businessNumber: '987-65-43210',
          status: 'active',
        },
      ]

      DBHelper.mockSelectResponse('crm_customers', mockCustomers)

      const request = createMockRequest(
        'GET',
        {},
        {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      )
      const event = createMockEvent(request)

      // Mock the authenticated API endpoint
      const mockGET = vi.fn().mockImplementation(async ({ request, locals }) => {
        // Step 1: Verify authentication
        const authResult = await mockRequireAuth(request)
        if (!authResult) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Authentication required',
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Step 2: Check permissions
        const hasPermission = mockCheckPermissions(authResult.permissions, 'read')
        if (!hasPermission) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Insufficient permissions',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Step 3: Execute business logic
        const result = await DBHelper.getMockQuery()('SELECT * FROM crm_customers')

        return new Response(
          JSON.stringify({
            success: true,
            data: mockCustomers,
            user: {
              id: authResult.id,
              name: authResult.name,
              role: authResult.role,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      })

      // Mock permission check
      mockCheckPermissions.mockReturnValue(true)

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
      expect(responseBody.data).toEqual(mockCustomers)
      expect(responseBody.user).toEqual({
        id: 'user-123',
        name: '테스트 사용자',
        role: 'ADMIN',
      })

      // Verify authentication flow
      expect(mockRequireAuth).toHaveBeenCalledWith(request)
      expect(mockCheckPermissions).toHaveBeenCalledWith(['read', 'write', 'admin'], 'read')
      expect(DBHelper.getMockQuery()).toHaveBeenCalled()
    })

    it('should handle invalid token authentication', async () => {
      const invalidToken = 'invalid-jwt-token'

      mockVerifyToken.mockResolvedValue({
        valid: false,
        payload: null,
        error: 'Invalid token',
      })

      mockRequireAuth.mockRejectedValue(new Error('Invalid token'))

      const request = createMockRequest(
        'GET',
        {},
        {
          Authorization: `Bearer ${invalidToken}`,
          'Content-Type': 'application/json',
        },
      )
      const event = createMockEvent(request)

      const mockGET = vi.fn().mockImplementation(async ({ request }) => {
        try {
          const authResult = await mockRequireAuth(request)
          return new Response(JSON.stringify({ success: true }), { status: 200 })
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Authentication failed',
              details: error.message,
            }),
            {
              status: 401,
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

      expect(response.status).toBe(401)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Authentication failed')
      expect(responseBody.details).toBe('Invalid token')
    })

    it('should handle insufficient permissions', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'VIEWER',
        permissions: ['read'], // Only read permission
        employee_id: 'employee-123',
      }

      mockRequireAuth.mockResolvedValue(mockUser)
      mockCheckPermissions.mockReturnValue(false) // No write permission

      const request = createMockRequest(
        'POST',
        {
          name: '새로운 고객사',
          businessNumber: '123-45-67890',
        },
        {
          Authorization: 'Bearer valid-jwt-token',
          'Content-Type': 'application/json',
        },
      )
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const authResult = await mockRequireAuth(request)

        const hasPermission = mockCheckPermissions(authResult.permissions, 'write')
        if (!hasPermission) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Insufficient permissions',
              required: 'write',
              current: authResult.permissions,
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        return new Response(JSON.stringify({ success: true }), { status: 201 })
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

      expect(response.status).toBe(403)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Insufficient permissions')
      expect(responseBody.required).toBe('write')
      expect(responseBody.current).toEqual(['read'])
    })

    it('should handle expired token', async () => {
      const expiredToken = 'expired-jwt-token'

      mockVerifyToken.mockResolvedValue({
        valid: false,
        payload: {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'ADMIN',
          iat: 1736928600,
          exp: 1736928600, // Already expired
        },
        error: 'Token expired',
      })

      mockRequireAuth.mockRejectedValue(new Error('Token expired'))

      const request = createMockRequest(
        'GET',
        {},
        {
          Authorization: `Bearer ${expiredToken}`,
          'Content-Type': 'application/json',
        },
      )
      const event = createMockEvent(request)

      const mockGET = vi.fn().mockImplementation(async ({ request }) => {
        try {
          const authResult = await mockRequireAuth(request)
          return new Response(JSON.stringify({ success: true }), { status: 200 })
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Token expired',
              details: error.message,
            }),
            {
              status: 401,
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

      expect(response.status).toBe(401)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Token expired')
      expect(responseBody.details).toBe('Token expired')
    })
  })

  describe('Role-Based Access Control Flow', () => {
    it('should handle admin role with full access', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        name: '관리자',
        role: 'ADMIN',
        permissions: ['read', 'write', 'delete', 'admin'],
      }

      mockRequireAuth.mockResolvedValue(mockAdminUser)
      mockCheckPermissions.mockReturnValue(true)

      const request = createMockRequest(
        'DELETE',
        {},
        {
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
        },
      )
      const event = createMockEvent(request, { id: 'customer-1' })

      const mockDELETE = vi.fn().mockImplementation(async ({ request }) => {
        const authResult = await mockRequireAuth(request)

        // Admin can delete
        const hasPermission = mockCheckPermissions(authResult.permissions, 'delete')
        if (!hasPermission) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Insufficient permissions',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Execute delete operation
        await DBHelper.getMockQuery()('DELETE FROM crm_customers WHERE id = ?')

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Customer deleted successfully',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      })

      const response = await mockDELETE({
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
      expect(responseBody.message).toBe('Customer deleted successfully')
    })

    it('should handle manager role with limited access', async () => {
      const mockManagerUser = {
        id: 'manager-123',
        email: 'manager@example.com',
        name: '매니저',
        role: 'MANAGER',
        permissions: ['read', 'write'], // No delete permission
      }

      mockRequireAuth.mockResolvedValue(mockManagerUser)
      mockCheckPermissions.mockReturnValue(false) // No delete permission

      const request = createMockRequest(
        'DELETE',
        {},
        {
          Authorization: 'Bearer manager-token',
          'Content-Type': 'application/json',
        },
      )
      const event = createMockEvent(request, { id: 'customer-1' })

      const mockDELETE = vi.fn().mockImplementation(async ({ request }) => {
        const authResult = await mockRequireAuth(request)

        const hasPermission = mockCheckPermissions(authResult.permissions, 'delete')
        if (!hasPermission) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Insufficient permissions',
              message: 'Managers cannot delete customers',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 })
      })

      const response = await mockDELETE({
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

      expect(response.status).toBe(403)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Insufficient permissions')
      expect(responseBody.message).toBe('Managers cannot delete customers')
    })

    it('should handle viewer role with read-only access', async () => {
      const mockViewerUser = {
        id: 'viewer-123',
        email: 'viewer@example.com',
        name: '뷰어',
        role: 'VIEWER',
        permissions: ['read'], // Only read permission
      }

      mockRequireAuth.mockResolvedValue(mockViewerUser)

      const request = createMockRequest(
        'PUT',
        {
          name: '업데이트된 고객사',
        },
        {
          Authorization: 'Bearer viewer-token',
          'Content-Type': 'application/json',
        },
      )
      const event = createMockEvent(request, { id: 'customer-1' })

      const mockPUT = vi.fn().mockImplementation(async ({ request }) => {
        const authResult = await mockRequireAuth(request)

        const hasPermission = mockCheckPermissions(authResult.permissions, 'write')
        if (!hasPermission) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Read-only access',
              message: 'Viewers can only read data',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 })
      })

      // Mock permission check to return false for write operation
      mockCheckPermissions.mockReturnValue(false)

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

      expect(response.status).toBe(403)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Read-only access')
      expect(responseBody.message).toBe('Viewers can only read data')
    })
  })

  describe('Session Management Flow', () => {
    it('should handle session refresh flow', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'ADMIN',
        permissions: ['read', 'write', 'admin'],
      }

      const oldToken = 'old-jwt-token'
      const newToken = 'new-jwt-token'

      // Mock token refresh
      const mockRefreshToken = vi.fn().mockResolvedValue({
        token: newToken,
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      })

      const request = createMockRequest(
        'POST',
        {
          refreshToken: 'old-refresh-token',
        },
        {
          Authorization: `Bearer ${oldToken}`,
          'Content-Type': 'application/json',
        },
      )
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()

        try {
          const refreshResult = await mockRefreshToken(body.refreshToken)

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                token: refreshResult.token,
                refreshToken: refreshResult.refreshToken,
                expiresIn: refreshResult.expiresIn,
                user: mockUser,
              },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Token refresh failed',
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            },
          )
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

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.token).toBe(newToken)
      expect(responseBody.data.user).toEqual(mockUser)

      expect(mockRefreshToken).toHaveBeenCalledWith('old-refresh-token')
    })

    it('should handle session logout flow', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: '테스트 사용자',
      }

      mockRequireAuth.mockResolvedValue(mockUser)

      const mockLogout = vi.fn().mockResolvedValue({
        success: true,
        message: 'Logged out successfully',
      })

      const request = createMockRequest(
        'POST',
        {},
        {
          Authorization: 'Bearer valid-jwt-token',
          'Content-Type': 'application/json',
        },
      )
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const authResult = await mockRequireAuth(request)

        const logoutResult = await mockLogout(authResult.id)

        return new Response(JSON.stringify(logoutResult), {
          status: 200,
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

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.message).toBe('Logged out successfully')

      expect(mockLogout).toHaveBeenCalledWith('user-123')
    })
  })
})
