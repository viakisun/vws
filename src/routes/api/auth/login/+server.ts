import { DatabaseService } from '$lib/database/connection'
import { config } from '$lib/utils/config'
import { logger } from '$lib/utils/logger'
import { toUTC } from '$lib/utils/date-handler'
import { error, json } from '@sveltejs/kit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { RequestHandler } from './$types'

// JWT 토큰 페이로드 타입 정의
interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

// 사용자 타입 정의 (비밀번호 제외)
interface UserResponse {
  id: string
  email: string
  name: string
  role: string
  department?: string
  position?: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const { email, password } = body

    // 입력값 검증
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials', { email: !!email, password: !!password })
      return error(400, '이메일과 비밀번호를 입력해주세요.')
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      logger.warn('Login attempt with invalid email format', { email })
      return error(400, '올바른 이메일 형식을 입력해주세요.')
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      logger.warn('Login attempt with short password', { email })
      return error(400, '비밀번호는 최소 6자 이상이어야 합니다.')
    }

    // 데이터베이스에서 사용자 조회
    const user = await DatabaseService.getUserByEmail(email)
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email })
      return error(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
    }

    // 사용자 활성 상태 확인
    if (!user.is_active) {
      logger.warn('Login attempt with deactivated account', { email, userId: user.id })
      return error(401, '비활성화된 계정입니다. 관리자에게 문의하세요.')
    }

    // 비밀번호 검증
    const passwordHash = (user as any).password_hash
    if (!passwordHash) {
      logger.error('User found without password hash', { email, userId: user.id })
      return error(500, '계정 설정에 문제가 있습니다. 관리자에게 문의하세요.')
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash)
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { email, userId: user.id })
      return error(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
    }

    // JWT 토큰 페이로드 생성
    const now = Math.floor(Date.now() / 1000)
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + (24 * 60 * 60), // 24시간 후 만료
    }

    // JWT 토큰 생성
    const token = jwt.sign(payload, config.jwt.secret, {
      algorithm: 'HS256',
      expiresIn: '24h',
      issuer: 'vws-system',
      audience: 'vws-client',
    })

    // 마지막 로그인 시간 업데이트
    try {
      const { query } = await import('$lib/database/connection')
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      )
      logger.info('User login successful', { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      })
    } catch (dbError) {
      logger.error('Failed to update last login time', { 
        userId: user.id, 
        error: dbError 
      })
      // 로그인 시간 업데이트 실패는 로그인을 막지 않음
    }

    // 응답용 사용자 데이터 생성 (비밀번호 제외)
    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role,
      department: user.department,
      position: user.position,
      is_active: user.is_active,
      created_at: user.created_at instanceof Date ? toUTC(user.created_at) : toUTC(String(user.created_at)),
      updated_at: user.updated_at instanceof Date ? toUTC(user.updated_at) : toUTC(String(user.updated_at)),
      last_login: user.last_login instanceof Date ? toUTC(user.last_login) : (user.last_login ? toUTC(String(user.last_login)) : undefined),
    }

    // 성공 응답 반환
    return json({
      success: true,
      message: '로그인에 성공했습니다.',
      user: userResponse,
      token,
      expiresIn: 24 * 60 * 60, // 초 단위
    })

  } catch (err) {
    logger.error('Login error:', err)
    
    // 에러 타입에 따른 구체적인 응답
    if (err instanceof SyntaxError) {
      return error(400, '잘못된 요청 형식입니다.')
    }
    
    if (err instanceof Error && err.message.includes('database')) {
      return error(503, '데이터베이스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.')
    }

    return error(500, '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
  }
}
