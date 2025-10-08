import { DatabaseService } from '$lib/database/connection'
import type { ApiResponse, DatabaseEmployee } from '$lib/types/database'
import { config } from '$lib/utils/config'
import { toUTC } from '$lib/utils/date-handler'
import { logger } from '$lib/utils/logger'
import { formatKoreanNameStandard } from '$lib/utils/korean-name'
import { json } from '@sveltejs/kit'
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

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  user: UserResponse
  token: string
  expiresIn: number
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    // 요청 본문 파싱 및 검증
    const { email, password } = (await request.json()) as LoginRequest

    // 입력값 검증
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials', {
        email: !!email,
        password: !!password,
      })
      const response: ApiResponse<null> = {
        success: false,
        error: '이메일과 비밀번호를 입력해주세요.',
      }
      return json(response, { status: 400 })
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      logger.warn('Login attempt with invalid email format', { email })
      const response: ApiResponse<null> = {
        success: false,
        error: '올바른 이메일 형식을 입력해주세요.',
      }
      return json(response, { status: 400 })
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      logger.warn('Login attempt with short password', { email })
      const response: ApiResponse<null> = {
        success: false,
        error: '비밀번호는 최소 6자 이상이어야 합니다.',
      }
      return json(response, { status: 400 })
    }

    // 1. 먼저 시스템 계정인지 확인
    const systemAccountResult = await DatabaseService.query(
      `
      SELECT
        u.id, u.email, u.password_hash, u.name, u.role, u.is_active,
        sa.account_type
      FROM users u
      INNER JOIN system_accounts sa ON sa.user_id = u.id
      WHERE u.email = $1 AND u.is_active = true
    `,
      [email],
    )

    if (systemAccountResult.rows.length > 0) {
      const systemUser = systemAccountResult.rows[0]

      // 비밀번호 검증
      const isValidPassword = await bcrypt.compare(password, systemUser.password_hash)
      if (!isValidPassword) {
        logger.warn('System account login attempt with invalid password', { email })
        const response: ApiResponse<null> = {
          success: false,
          error: '이메일 또는 비밀번호가 올바르지 않습니다.',
        }
        return json(response, { status: 401 })
      }

      // JWT 토큰 생성
      const now = Math.floor(Date.now() / 1000)
      const payload: JWTPayload = {
        userId: systemUser.id,
        email: systemUser.email,
        role: systemUser.role,
        iat: now,
        exp: now + 24 * 60 * 60,
      }

      const token = jwt.sign(payload, config.jwt.secret, {
        algorithm: 'HS256',
        expiresIn: '24h',
        issuer: 'vws-system',
        audience: 'vws-client',
      })

      // 마지막 로그인 시간 업데이트
      await DatabaseService.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [
        systemUser.id,
      ])
      logger.info('System account login successful', {
        userId: systemUser.id,
        email: systemUser.email,
        accountType: systemUser.account_type,
      })

      // 시스템 계정 응답
      const userResponse: UserResponse = {
        id: systemUser.id,
        email: systemUser.email,
        name: systemUser.name,
        role: systemUser.role,
        is_active: systemUser.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const response: ApiResponse<LoginResponse> = {
        success: true,
        message: '로그인에 성공했습니다.',
        data: {
          user: userResponse,
          token,
          expiresIn: 24 * 60 * 60,
        },
      }

      return json(response)
    }

    // 2. 시스템 계정이 아니면 직원 계정인지 확인
    const user = await DatabaseService.getUserByEmail(email)
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email })
      const response: ApiResponse<null> = {
        success: false,
        error: '이 시스템에 접근할 권한이 없습니다.',
      }
      return json(response, { status: 403 })
    }

    // 사용자 활성 상태 확인
    if (!user.is_active) {
      logger.warn('Login attempt with deactivated account', { email, userId: user.id })
      const response: ApiResponse<null> = {
        success: false,
        error: '비활성화된 계정입니다. 관리자에게 문의하세요.',
      }
      return json(response, { status: 401 })
    }

    // 비밀번호 검증
    const userWithPassword = user as unknown as DatabaseEmployee & { password_hash: string }
    const passwordHash = userWithPassword.password_hash
    if (!passwordHash) {
      logger.error('User found without password hash', { email, userId: user.id })
      const response: ApiResponse<null> = {
        success: false,
        error: '계정 설정에 문제가 있습니다. 관리자에게 문의하세요.',
      }
      return json(response, { status: 500 })
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash)
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { email, userId: user.id })
      const response: ApiResponse<null> = {
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
      }
      return json(response, { status: 401 })
    }

    // JWT 토큰 페이로드 생성
    const now = Math.floor(Date.now() / 1000)
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + 24 * 60 * 60, // 24시간 후 만료
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
      await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id])
      logger.info('User login successful', {
        userId: user.id,
        email: user.email,
        role: user.role,
      })
    } catch (dbError) {
      logger.error('Failed to update last login time', {
        userId: user.id,
        error: dbError as unknown,
      })
      // 로그인 시간 업데이트 실패는 로그인을 막지 않음
    }

    // 응답용 사용자 데이터 생성 (비밀번호 제외)
    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      name:
        user.first_name && user.last_name
          ? formatKoreanNameStandard(
              String(user.first_name).concat(' ').concat(String(user.last_name)),
            )
          : user.email.split('@')[0],
      role: user.role,
      department: user.department,
      position: user.position,
      is_active: user.status === 'active',
      created_at:
        user.created_at instanceof Date ? toUTC(user.created_at) : toUTC(String(user.created_at)),
      updated_at:
        user.updated_at instanceof Date ? toUTC(user.updated_at) : toUTC(String(user.updated_at)),
      last_login: undefined, // last_login 필드는 DatabaseEmployee에 없음
    }

    // 성공 응답 반환
    const response: ApiResponse<LoginResponse> = {
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        user: userResponse,
        token,
        expiresIn: 24 * 60 * 60, // 초 단위
      },
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Login error:', error)

    // 에러 타입에 따른 구체적인 응답
    if (error instanceof SyntaxError) {
      const response: ApiResponse<null> = {
        success: false,
        error: '잘못된 요청 형식입니다.',
      }
      return json(response, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('database')) {
      const response: ApiResponse<null> = {
        success: false,
        error: '데이터베이스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
      }
      return json(response, { status: 503 })
    }

    const response: ApiResponse<null> = {
      success: false,
      error: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    }
    return json(response, { status: 500 })
  }
}
