import { DatabaseService } from '$lib/database/connection'
import { config } from '$lib/utils/config'
import { logger } from '$lib/utils/logger'
import jwt from 'jsonwebtoken'

export interface User {
  id: string
  email: string
  name: string
  role: string
  account_type: 'employee' | 'system'
  is_active: boolean
  picture?: string
  employee_id?: string
  department?: string
  position?: string
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
   * 구글 로그인 처리 (system_accounts → employees 순서로 확인)
   */
  public async createOrUpdateUser(userData: {
    email: string
    name: string
    role: string
    picture?: string
  }): Promise<User> {
    try {
      // 1. 먼저 system_accounts에서 확인
      const systemAccountResult = await DatabaseService.query(
        'SELECT id, email, name, picture, account_type, created_at, updated_at FROM system_accounts WHERE email = $1',
        [userData.email],
      )

      if (systemAccountResult.rows.length > 0) {
        const systemAccount = systemAccountResult.rows[0]

        // picture 업데이트
        await DatabaseService.query(
          'UPDATE system_accounts SET picture = $1, updated_at = NOW() WHERE id = $2',
          [userData.picture, systemAccount.id],
        )

        return {
          id: systemAccount.id,
          email: systemAccount.email,
          name: systemAccount.name,
          role: 'ADMIN', // 시스템 계정은 ADMIN 역할
          account_type: 'system',
          is_active: true,
          picture: userData.picture,
          created_at: systemAccount.created_at,
          updated_at: new Date().toISOString(),
        }
      }

      // 2. employees에서 확인
      const employeeResult = await DatabaseService.query(
        'SELECT id, employee_id, first_name, last_name, email, department, position, picture, created_at, updated_at FROM employees WHERE email = $1 AND status = $2',
        [userData.email, 'active'],
      )

      if (employeeResult.rows.length === 0) {
        throw new Error(`등록되지 않은 이메일입니다: ${userData.email}`)
      }

      const employee = employeeResult.rows[0]

      // picture 업데이트
      await DatabaseService.query(
        'UPDATE employees SET picture = $1, updated_at = NOW() WHERE id = $2',
        [userData.picture, employee.id],
      )

      return {
        id: employee.id,
        email: employee.email,
        name: `${employee.last_name}${employee.first_name}`,
        role: userData.role || 'EMPLOYEE',
        account_type: 'employee',
        is_active: true,
        picture: userData.picture,
        employee_id: employee.employee_id,
        department: employee.department,
        position: employee.position,
        created_at: employee.created_at,
        updated_at: new Date().toISOString(),
      }
    } catch (error) {
      logger.error('Error creating/updating user:', error)
      throw error
    }
  }

  /**
   * 이메일로 사용자 조회 (system_accounts → employees)
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    try {
      // 1. 시스템 계정 확인
      const systemResult = await DatabaseService.query(
        'SELECT id, email, name, picture, account_type FROM system_accounts WHERE email = $1',
        [email],
      )
      if (systemResult.rows.length > 0) {
        const sa = systemResult.rows[0]
        return {
          id: sa.id,
          email: sa.email,
          name: sa.name,
          role: 'ADMIN',
          account_type: 'system',
          is_active: true,
          picture: sa.picture,
          created_at: '',
          updated_at: '',
        }
      }

      // 2. 직원 확인
      const empResult = await DatabaseService.query(
        'SELECT id, email, employee_id, first_name, last_name, department, position, picture FROM employees WHERE email = $1 AND status = $2',
        [email, 'active'],
      )
      if (empResult.rows.length > 0) {
        const emp = empResult.rows[0]
        return {
          id: emp.id,
          email: emp.email,
          name: `${emp.last_name}${emp.first_name}`,
          role: 'EMPLOYEE',
          account_type: 'employee',
          is_active: true,
          picture: emp.picture,
          employee_id: emp.employee_id,
          department: emp.department,
          position: emp.position,
          created_at: '',
          updated_at: '',
        }
      }

      return null
    } catch (error) {
      logger.error('Error getting user by email:', error)
      return null
    }
  }

  /**
   * ID로 사용자 조회 (system_accounts → employees)
   */
  public async getUserById(id: string): Promise<User | null> {
    try {
      // 1. 시스템 계정 확인
      const systemResult = await DatabaseService.query(
        'SELECT id, email, name, picture, account_type FROM system_accounts WHERE id = $1',
        [id],
      )
      if (systemResult.rows.length > 0) {
        const sa = systemResult.rows[0]
        return {
          id: sa.id,
          email: sa.email,
          name: sa.name,
          role: 'ADMIN',
          account_type: 'system',
          is_active: true,
          picture: sa.picture,
          created_at: '',
          updated_at: '',
        }
      }

      // 2. 직원 확인
      const empResult = await DatabaseService.query(
        'SELECT id, email, employee_id, first_name, last_name, department, position, picture FROM employees WHERE id = $1 AND status = $2',
        [id, 'active'],
      )
      if (empResult.rows.length > 0) {
        const emp = empResult.rows[0]
        return {
          id: emp.id,
          email: emp.email,
          name: `${emp.last_name}${emp.first_name}`,
          role: 'EMPLOYEE',
          account_type: 'employee',
          is_active: true,
          picture: emp.picture,
          employee_id: emp.employee_id,
          department: emp.department,
          position: emp.position,
          created_at: '',
          updated_at: '',
        }
      }

      return null
    } catch (error) {
      logger.error('Error getting user by id:', error)
      return null
    }
  }

  /**
   * 마지막 로그인 시간 업데이트 (삭제 - 필요 없음)
   */
  public async updateLastLogin(userId: string): Promise<void> {
    // 구글 로그인이므로 last_login 추적 불필요
  }

  /**
   * JWT 토큰 생성
   */
  public generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    }

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
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
