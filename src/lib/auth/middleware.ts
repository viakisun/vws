import { UserService } from '$lib/auth/user-service'
import { logger } from '$lib/utils/logger'
import type { RequestEvent } from '@sveltejs/kit'
import { error } from '@sveltejs/kit'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

/**
 * JWT 토큰을 검증하고 사용자 정보를 반환하는 미들웨어
 */
export async function authenticate(event: RequestEvent): Promise<{ user: any; payload: JWTPayload } | null> {
  try {
    const token = event.cookies.get('auth_token')

      if (!token) {
      return null
    }

    const userService = UserService.getInstance()
    const payload = userService.verifyToken(token) as JWTPayload
    const user = await userService.getUserById(payload.userId)
    
    if (!user || !user.is_active) {
      return null
    }

    return { user, payload }
  } catch (error) {
    logger.error('Authentication error:', error)
    return null
  }
}

/**
 * API 엔드포인트에서 사용할 인증 미들웨어
 */
export async function requireAuth(event: RequestEvent): Promise<{ user: any; payload: JWTPayload }> {
  const authResult = await authenticate(event)
  
  if (!authResult) {
    throw error(401, { message: 'Authentication required' })
  }
  
  return authResult
}

/**
 * 특정 역할이 필요한 API 엔드포인트에서 사용할 인증 미들웨어
 */
export async function requireRole(event: RequestEvent, allowedRoles: string[]): Promise<{ user: any; payload: JWTPayload }> {
  const authResult = await requireAuth(event)
  
  if (!allowedRoles.includes(authResult.user.role)) {
    throw error(403, { message: 'Insufficient permissions' })
  }
  
  return authResult
}