/**
 * Employee Service
 * 직원 관리 비즈니스 로직
 *
 * Note: 이 서비스는 connection.ts의 DatabaseEmployee 타입 기반입니다.
 * HR 모듈의 더 상세한 직원 관리는 services/hr/hr-service.ts를 사용하세요.
 */

import type { DatabaseEmployee } from '$lib/database/connection'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

export interface EmployeeFilters {
  department?: string
  status?: string
  limit?: number
  offset?: number
}

export interface CreateEmployeeDto {
  employee_id: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department?: string
  position?: string
  employment_type?: string
  hire_date?: Date
  salary?: number
  status?: string
  address?: string
  emergency_contact?: {
    name?: string
    phone?: string
    relationship?: string
  }
  manager_id?: string
}

export class EmployeeService {
  /**
   * 직원 생성
   */
  async create(data: CreateEmployeeDto): Promise<DatabaseEmployee> {
    try {
      const result = await query<DatabaseEmployee>(
        `INSERT INTO employees (employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date, salary, status, address, emergency_contact)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type,
                   hire_date::text as hire_date, salary, status, address, emergency_contact,
                   created_at::text as created_at, updated_at::text as updated_at`,
        [
          data.employee_id,
          data.user_id || null,
          data.first_name,
          data.last_name,
          data.email,
          data.phone || null,
          data.department || null,
          data.position || null,
          data.employment_type || 'full-time',
          data.hire_date || null,
          data.salary || null,
          data.status || 'active',
          data.address || null,
          JSON.stringify(data.emergency_contact || {}),
        ],
      )

      if (!result.rows[0]) {
        throw new Error('직원 생성에 실패했습니다.')
      }

      // 매니저가 지정된 경우 보고 관계 생성
      if (data.manager_id) {
        await query(
          `INSERT INTO reporting_relationships (employee_id, manager_id, report_type, start_date)
           VALUES ($1, $2, 'direct', $3)
           ON CONFLICT DO NOTHING`,
          [result.rows[0].id, data.manager_id, data.hire_date || new Date()],
        )
      }

      logger.info(`Employee created: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create employee:', error)
      throw error
    }
  }

  /**
   * 직원 ID로 조회
   */
  async getById(id: string): Promise<DatabaseEmployee | null> {
    try {
      const result = await query<DatabaseEmployee>(
        `SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type,
                hire_date::text as hire_date, salary, status, address, emergency_contact,
                created_at::text as created_at, updated_at::text as updated_at
         FROM employees 
         WHERE id = $1`,
        [id],
      )
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to get employee by id:', error)
      throw error
    }
  }

  /**
   * 직원 사번으로 조회
   */
  async getByEmployeeId(employeeId: string): Promise<DatabaseEmployee | null> {
    try {
      const result = await query<DatabaseEmployee>(
        `SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type,
                hire_date::text as hire_date, salary, status, address, emergency_contact,
                created_at::text as created_at, updated_at::text as updated_at
         FROM employees 
         WHERE employee_id = $1`,
        [employeeId],
      )
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to get employee by employee_id:', error)
      throw error
    }
  }

  /**
   * 직원 목록 조회 (필터링 지원)
   */
  async list(filters?: EmployeeFilters): Promise<DatabaseEmployee[]> {
    try {
      let queryText = `
        SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type,
               hire_date::text as hire_date, salary, status, address, emergency_contact,
               created_at::text as created_at, updated_at::text as updated_at
        FROM employees 
        WHERE 1=1`

      const params: unknown[] = []
      let paramCount = 0

      if (filters?.department) {
        paramCount++
        queryText += ` AND department = $${paramCount}`
        params.push(filters.department)
      }

      if (filters?.status) {
        paramCount++
        queryText += ` AND status = $${paramCount}`
        params.push(filters.status)
      }

      queryText += ' ORDER BY created_at DESC'

      if (filters?.limit) {
        paramCount++
        queryText += ` LIMIT $${paramCount}`
        params.push(filters.limit)
      }

      if (filters?.offset) {
        paramCount++
        queryText += ` OFFSET $${paramCount}`
        params.push(filters.offset)
      }

      const result = await query<DatabaseEmployee>(queryText, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to list employees:', error)
      throw error
    }
  }

  /**
   * 직원 업데이트
   */
  async update(id: string, data: Partial<CreateEmployeeDto>): Promise<DatabaseEmployee> {
    try {
      const updates: string[] = []
      const params: unknown[] = [id]
      let paramCount = 1

      if (data.first_name !== undefined) {
        paramCount++
        updates.push(`first_name = $${paramCount}`)
        params.push(data.first_name)
      }
      if (data.last_name !== undefined) {
        paramCount++
        updates.push(`last_name = $${paramCount}`)
        params.push(data.last_name)
      }
      if (data.email !== undefined) {
        paramCount++
        updates.push(`email = $${paramCount}`)
        params.push(data.email)
      }
      if (data.phone !== undefined) {
        paramCount++
        updates.push(`phone = $${paramCount}`)
        params.push(data.phone)
      }
      if (data.department !== undefined) {
        paramCount++
        updates.push(`department = $${paramCount}`)
        params.push(data.department)
      }
      if (data.position !== undefined) {
        paramCount++
        updates.push(`position = $${paramCount}`)
        params.push(data.position)
      }
      if (data.employment_type !== undefined) {
        paramCount++
        updates.push(`employment_type = $${paramCount}`)
        params.push(data.employment_type)
      }
      if (data.salary !== undefined) {
        paramCount++
        updates.push(`salary = $${paramCount}`)
        params.push(data.salary)
      }
      if (data.status !== undefined) {
        paramCount++
        updates.push(`status = $${paramCount}`)
        params.push(data.status)
      }
      if (data.address !== undefined) {
        paramCount++
        updates.push(`address = $${paramCount}`)
        params.push(data.address)
      }
      if (data.emergency_contact !== undefined) {
        paramCount++
        updates.push(`emergency_contact = $${paramCount}`)
        params.push(JSON.stringify(data.emergency_contact))
      }

      if (updates.length === 0) {
        throw new Error('업데이트할 데이터가 없습니다.')
      }

      updates.push(`updated_at = now()`)

      const result = await query<DatabaseEmployee>(
        `UPDATE employees 
         SET ${updates.join(', ')}
         WHERE id = $1
         RETURNING id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type,
                   hire_date::text as hire_date, salary, status, address, emergency_contact,
                   created_at::text as created_at, updated_at::text as updated_at`,
        params,
      )

      if (!result.rows[0]) {
        throw new Error('직원을 찾을 수 없습니다.')
      }

      logger.info(`Employee updated: ${id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update employee:', error)
      throw error
    }
  }

  /**
   * 직원 삭제 (실제로는 status를 'terminated'로 변경 권장)
   */
  async delete(id: string): Promise<void> {
    try {
      await query('DELETE FROM employees WHERE id = $1', [id])
      logger.info(`Employee deleted: ${id}`)
    } catch (error) {
      logger.error('Failed to delete employee:', error)
      throw error
    }
  }

  /**
   * 직원 퇴사 처리
   */
  async terminate(id: string): Promise<DatabaseEmployee> {
    return this.update(id, { status: 'terminated' })
  }
}

// 싱글톤 인스턴스 export
export const employeeService = new EmployeeService()
