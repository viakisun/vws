import { DatabaseService } from '$lib/database/connection'
import { config } from '$lib/utils/config'
import { logger } from '$lib/utils/logger'
import jwt from 'jsonwebtoken'

export interface User {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  picture?: string
  created_at: string
  updated_at: string
  last_login?: string
}

export class UserService {
  private static instance: UserService

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  /**
   * 사용자 생성 또는 업데이트
   */
  public async createOrUpdateUser(userData: {
    email: string
    name: string
    role: string
    picture?: string
  }): Promise<User> {
    try {
      // 기존 사용자 확인
      const existingUser = await this.getUserByEmail(userData.email)

      if (existingUser) {
        // 기존 사용자 업데이트
        const result = await DatabaseService.query(
          'UPDATE users SET name = $1, role = $2, picture = $3, updated_at = NOW() WHERE email = $4 RETURNING *',
          [userData.name, userData.role, userData.picture, userData.email]
        )
        return result.rows[0]
      } else {
        // 새 사용자 생성
        const result = await DatabaseService.query(
          'INSERT INTO users (email, name, role, picture, is_active) VALUES ($1, $2, $3, $4, true) RETURNING *',
          [userData.email, userData.name, userData.role, userData.picture]
        )
        return result.rows[0]
      }
    } catch (error) {
      logger.error('Error creating/updating user:', error)
      throw error
    }
  }

  /**
   * 이메일로 사용자 조회
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await DatabaseService.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )
      return result.rows[0] || null
    } catch (error) {
      logger.error('Error getting user by email:', error)
      return null
    }
  }

  /**
   * ID로 사용자 조회
   */
  public async getUserById(id: string): Promise<User | null> {
    try {
      const result = await DatabaseService.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      )
      return result.rows[0] || null
    } catch (error) {
      logger.error('Error getting user by id:', error)
      return null
    }
  }

  /**
   * 마지막 로그인 시간 업데이트
   */
  public async updateLastLogin(userId: string): Promise<void> {
    try {
      await DatabaseService.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [userId]
      )
    } catch (error) {
      logger.error('Error updating last login:', error)
    }
  }

  /**
   * JWT 토큰 생성
   */
  public generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    }

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    })
  }

  /**
   * JWT 토큰 검증
   */
  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret)
    } catch (error) {
      logger.error('Error verifying token:', error)
      throw new Error('Invalid token')
    }
  }
}
