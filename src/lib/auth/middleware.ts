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
export async function authenticate(
  event: RequestEvent,
): Promise<{ user: any; payload: JWTPayload } | null> {
  try {
    const token = event.cookies.get('auth_token')
    logger.info('🔐 authenticate 시작:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      url: event.url.toString(),
    })

    if (!token) {
      logger.warn('🔐 토큰 없음 - 인증 실패')
      return null
    }

    const userService = UserService.getInstance()

    // 개발 환경에서 토큰 검증 완화
    let payload: JWTPayload
    try {
      logger.info('🔐 토큰 검증 시도...')
      payload = userService.verifyToken(token) as JWTPayload
      logger.info('🔐 토큰 검증 성공:', { userId: payload.userId, role: payload.role })
    } catch (error) {
      logger.warn('🔐 토큰 검증 실패:', error)
      // 개발 환경에서 만료된 토큰도 허용 (ignoreExpiration)
      if (process.env.NODE_ENV === 'development') {
        try {
          logger.info('🔐 개발 모드에서 만료된 토큰 허용 시도...')
          const jwt = await import('jsonwebtoken')
          payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', {
            ignoreExpiration: true,
          }) as JWTPayload
          logger.info('🔐 개발 모드 토큰 검증 성공:', {
            userId: payload.userId,
            role: payload.role,
          })
        } catch (devError) {
          logger.error('🔐 개발 모드 토큰 검증 실패:', devError)
          return null
        }
      } else {
        logger.error('🔐 프로덕션 모드 토큰 검증 실패:', error)
        return null
      }
    }

    const user = await userService.getUserById(payload.userId)
    logger.info('🔐 사용자 조회 결과:', {
      userId: payload.userId,
      userFound: !!user,
      isActive: user?.is_active,
    })

    if (!user?.is_active) {
      logger.warn('🔐 비활성 사용자 - 인증 실패')
      return null
    }

    logger.info('🔐 authenticate 성공:', { userId: user.id, email: user.email, role: user.role })
    return { user, payload }
  } catch (error) {
    logger.error('Authentication error:', error)
    return null
  }
}

/**
 * API 엔드포인트에서 사용할 인증 미들웨어
 */
export async function requireAuth(
  event: RequestEvent,
): Promise<{ user: any; payload: JWTPayload }> {
  const authResult = await authenticate(event)

  if (!authResult) {
    throw error(401, { message: 'Authentication required' })
  }

  return authResult
}

/**
 * 특정 역할이 필요한 API 엔드포인트에서 사용할 인증 미들웨어
 */
export async function requireRole(
  event: RequestEvent,
  allowedRoles: string[],
): Promise<{ user: any; payload: JWTPayload }> {
  logger.info('🔐 requireRole 시작:', { allowedRoles, url: event.url.toString() })

  const authResult = await requireAuth(event)
  logger.info('🔐 requireAuth 결과:', {
    success: !!authResult,
    userId: authResult?.user?.id,
    userRole: authResult?.user?.role,
  })

  if (!allowedRoles.includes(authResult.user.role)) {
    logger.error('🔐 권한 부족:', {
      userRole: authResult.user.role,
      allowedRoles,
    })
    throw error(403, { message: 'Insufficient permissions' })
  }

  logger.info('🔐 requireRole 성공:', { userId: authResult.user.id, role: authResult.user.role })
  return authResult
}
