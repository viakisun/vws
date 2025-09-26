import { DatabaseService, query } from '$lib/database/connection'
import { config } from '$lib/utils/config'
import type { RequestEvent, RequestHandler } from '@sveltejs/kit'
import { error, redirect } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'
import { logger } from '$lib/utils/logger'
import { checkRateLimit, validateCSRFToken } from '$lib/utils/security'

// JWT token interface
export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

// Authentication middleware
export function authenticate(requiredRoles?: string[]): RequestHandler {
  return async (event: RequestEvent): Promise<Response> => {
    const { request, cookies, url } = event
    try {
      // Get token from Authorization header or cookies
      let token: string | null = null

      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      } else {
        token = cookies.get('auth_token') || null
      }

      if (!token) {
        if (url.pathname.startsWith('/api/')) {
          return error(401, { message: 'Authentication required' })
        } else {
          throw redirect(302, '/login')
        }
      }

      // Verify JWT token
      const payload = jwt.verify(token, config.jwt.secret) as JWTPayload

      // Get user from database
      const user = await DatabaseService.getUserById(payload.userId)
      if (!user || !user.is_active) {
        if (url.pathname.startsWith('/api/')) {
          return error(401, { message: 'Invalid or inactive user' })
        } else {
          throw redirect(302, '/login')
        }
      }

      // Check role permissions
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        if (url.pathname.startsWith('/api/')) {
          return error(403, { message: 'Insufficient permissions' })
        } else {
          throw redirect(302, '/unauthorized')
        }
      }

      // Add user to request context
      event.locals.user = user

      return new Response() // Continue to the next handler
    } catch {
      // logger.error('Authentication error:', err)

      if (url.pathname.startsWith('/api/')) {
        return error(401, { message: 'Invalid token' })
      } else {
        throw redirect(302, '/login')
      }
    }
  }
}

// Role-based access control
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  VIEWER: 'VIEWER',
} as const

export const PERMISSIONS = {
  // User management
  CREATE_USER: 'CREATE_USER',
  READ_USER: 'READ_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',

  // Project management
  CREATE_PROJECT: 'CREATE_PROJECT',
  READ_PROJECT: 'READ_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',

  // Expense management
  CREATE_EXPENSE: 'CREATE_EXPENSE',
  READ_EXPENSE: 'READ_EXPENSE',
  UPDATE_EXPENSE: 'UPDATE_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE',
  APPROVE_EXPENSE: 'APPROVE_EXPENSE',

  // Company management
  CREATE_COMPANY: 'CREATE_COMPANY',
  READ_COMPANY: 'READ_COMPANY',
  UPDATE_COMPANY: 'UPDATE_COMPANY',
  DELETE_COMPANY: 'DELETE_COMPANY',

  // Financial data
  READ_FINANCIAL: 'READ_FINANCIAL',
  UPDATE_FINANCIAL: 'UPDATE_FINANCIAL',

  // Reports
  READ_REPORTS: 'READ_REPORTS',
  CREATE_REPORTS: 'CREATE_REPORTS',

  // Audit
  READ_AUDIT: 'READ_AUDIT',
} as const

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.READ_USER,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.READ_PROJECT,
    PERMISSIONS.UPDATE_PROJECT,
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.READ_EXPENSE,
    PERMISSIONS.UPDATE_EXPENSE,
    PERMISSIONS.APPROVE_EXPENSE,
    PERMISSIONS.CREATE_COMPANY,
    PERMISSIONS.READ_COMPANY,
    PERMISSIONS.UPDATE_COMPANY,
    PERMISSIONS.READ_FINANCIAL,
    PERMISSIONS.READ_REPORTS,
    PERMISSIONS.CREATE_REPORTS,
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.READ_PROJECT,
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.READ_EXPENSE,
    PERMISSIONS.UPDATE_EXPENSE,
    PERMISSIONS.READ_COMPANY,
    PERMISSIONS.READ_REPORTS,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.READ_PROJECT,
    PERMISSIONS.READ_EXPENSE,
    PERMISSIONS.READ_COMPANY,
    PERMISSIONS.READ_REPORTS,
  ],
}

// Check if user has specific permission
export function hasPermission(userRole: string, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.includes(permission)
}

// Permission middleware
export function requirePermission(permission: string): RequestHandler {
  return async (event: RequestEvent): Promise<Response> => {
    const { request: _request } = event
    const user = event.locals.user

    if (!user) {
      return error(401, { message: 'Authentication required' })
    }

    if (!hasPermission(user.role, permission)) {
      return error(403, { message: 'Insufficient permissions' })
    }

    return new Response()
  }
}

// 기존 rateLimit 함수는 제거하고 새로운 보안 강화 버전 사용

// Rate limiting middleware
export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): RequestHandler {
  return async (event: RequestEvent): Promise<Response> => {
    const clientIP = event.getClientAddress()
    const rateLimitResult = checkRateLimit(clientIP, maxRequests, windowMs)
    
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { 
        clientIP, 
        limit: maxRequests, 
        window: windowMs 
      })
      return error(429, { 
        message: 'Too many requests. Please try again later.'
      })
    }
    
    // Rate limit headers 추가
    event.setHeaders({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
    })
    
    return new Response()
  }
}

// CSRF protection middleware
export function csrfProtection(): RequestHandler {
  return async (event: RequestEvent): Promise<Response> => {
    if (event.request.method === 'GET' || event.request.method === 'HEAD') {
      return new Response()
    }
    
    const token = event.request.headers.get('x-csrf-token')
    const sessionToken = event.cookies.get('csrf-token')
    
    if (!validateCSRFToken(token || '', sessionToken || '')) {
      logger.warn('CSRF token validation failed', {
        url: event.url.pathname,
        method: event.request.method,
        clientIP: event.getClientAddress()
      })
      return error(403, { message: 'Invalid CSRF token' })
    }
    
    return new Response()
  }
}

// CORS middleware
export function cors(origins: string[] = ['*']): RequestHandler {
  return async (event: RequestEvent): Promise<Response> => {
    const { request } = event
    const origin = request.headers.get('origin')

    if (origins.includes('*') || (origin && origins.includes(origin))) {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    return new Response()
  }
}

// Security headers
export function securityHeaders(): RequestHandler {
  return async (_event: RequestEvent): Promise<Response> => {
    return new Response(null, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
      },
    })
  }
}

// Audit logging
export function auditLog(action: string, entity: string): RequestHandler {
  return async (event: RequestEvent): Promise<Response> => {
    const { request } = event
    const user = event.locals.user
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (user) {
      try {
        await query(
          `INSERT INTO audit_logs (actor_id, action, entity, entity_id, ip_address, user_agent)
					 VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, action, entity, 'unknown', clientIP, userAgent],
        )
      } catch {
        // logger.error('Audit log error:', err)
      }
    }

    return new Response()
  }
}
