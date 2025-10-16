import { UserService } from '$lib/auth/user-service'
import { config } from '$lib/utils/config'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ success: false, error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    try {
      // 토큰 검증 (만료된 토큰도 허용)
      const decoded = jwt.verify(token, config.jwt.secret, { ignoreExpiration: true }) as any

      // 사용자 정보 확인
      const userService = UserService.getInstance()
      const user = await userService.getUserById(decoded.userId)

      if (!user || !user.is_active) {
        return json({ success: false, error: 'User not found or inactive' }, { status: 401 })
      }

      // 새 토큰 생성
      const newToken = userService.generateToken(user)

      // 쿠키 설정
      cookies.set('auth_token', newToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7일
      })

      return json({
        success: true,
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          picture: user.picture,
        },
      })
    } catch (tokenError) {
      logger.error('Token verification error:', tokenError)
      return json({ success: false, error: 'Invalid token' }, { status: 401 })
    }
  } catch (error) {
    logger.error('Refresh token error:', error)
    return json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
