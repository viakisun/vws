/**
 * Project Service
 * 프로젝트 관리 비즈니스 로직
 */

import { query } from '$lib/database/connection'
import type { DatabaseProject } from '$lib/types'
import { logger } from '$lib/utils/logger'

export interface ProjectFilters {
  status?: string
  manager_id?: string
  limit?: number
  offset?: number
}

export interface CreateProjectDto {
  code: string
  title: string
  description?: string
  sponsor?: string
  sponsor_type?: string
  start_date?: string
  end_date?: string
  manager_id?: string
  status?: string
  budget_total?: number
}

export class ProjectService {
  /**
   * 프로젝트 생성
   */
  async create(data: CreateProjectDto): Promise<DatabaseProject> {
    try {
      const result = await query<DatabaseProject>(
        `INSERT INTO projects (code, title, description, sponsor, sponsor_type, start_date, end_date, manager_employee_id, status, budget_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, code, title, description, sponsor, sponsor_type,
                   start_date::text as start_date, end_date::text as end_date,
                   manager_employee_id, status, budget_total,
                   created_at::text as created_at, updated_at::text as updated_at`,
        [
          data.code,
          data.title,
          data.description || null,
          data.sponsor || null,
          data.sponsor_type || null,
          data.start_date || null,
          data.end_date || null,
          data.manager_id || null,
          data.status || 'planning',
          data.budget_total || 0,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('프로젝트 생성에 실패했습니다.')
      }

      logger.info(`Project created: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create project:', error)
      throw error
    }
  }

  /**
   * 프로젝트 ID로 조회
   */
  async getById(id: string): Promise<DatabaseProject | null> {
    try {
      const result = await query<DatabaseProject>(
        `SELECT id, code, title, description, sponsor, sponsor_type,
                start_date::text as start_date, end_date::text as end_date,
                manager_employee_id, status, budget_total,
                created_at::text as created_at, updated_at::text as updated_at
         FROM projects 
         WHERE id = $1`,
        [id],
      )
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to get project by id:', error)
      throw error
    }
  }

  /**
   * 프로젝트 코드로 조회
   */
  async getByCode(code: string): Promise<DatabaseProject | null> {
    try {
      const result = await query<DatabaseProject>(
        `SELECT id, code, title, description, sponsor, sponsor_type,
                start_date::text as start_date, end_date::text as end_date,
                manager_employee_id, status, budget_total,
                created_at::text as created_at, updated_at::text as updated_at
         FROM projects 
         WHERE code = $1`,
        [code],
      )
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to get project by code:', error)
      throw error
    }
  }

  /**
   * 프로젝트 목록 조회 (필터링 지원)
   */
  async list(filters?: ProjectFilters): Promise<DatabaseProject[]> {
    try {
      let queryText = `
        SELECT id, code, title, description, sponsor, sponsor_type,
               start_date::text as start_date, end_date::text as end_date,
               manager_employee_id, status, budget_total,
               created_at::text as created_at, updated_at::text as updated_at
        FROM projects 
        WHERE 1=1`

      const params: unknown[] = []
      let paramCount = 0

      if (filters?.status) {
        paramCount++
        queryText += ` AND status = $${paramCount}`
        params.push(filters.status)
      }

      if (filters?.manager_id) {
        paramCount++
        queryText += ` AND manager_employee_id = $${paramCount}`
        params.push(filters.manager_id)
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

      const result = await query<DatabaseProject>(queryText, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to list projects:', error)
      throw error
    }
  }

  /**
   * 프로젝트 업데이트
   */
  async update(id: string, data: Partial<CreateProjectDto>): Promise<DatabaseProject> {
    try {
      const updates: string[] = []
      const params: unknown[] = [id]
      let paramCount = 1

      if (data.code !== undefined) {
        paramCount++
        updates.push(`code = $${paramCount}`)
        params.push(data.code)
      }
      if (data.title !== undefined) {
        paramCount++
        updates.push(`title = $${paramCount}`)
        params.push(data.title)
      }
      if (data.description !== undefined) {
        paramCount++
        updates.push(`description = $${paramCount}`)
        params.push(data.description)
      }
      if (data.sponsor !== undefined) {
        paramCount++
        updates.push(`sponsor = $${paramCount}`)
        params.push(data.sponsor)
      }
      if (data.sponsor_type !== undefined) {
        paramCount++
        updates.push(`sponsor_type = $${paramCount}`)
        params.push(data.sponsor_type)
      }
      if (data.start_date !== undefined) {
        paramCount++
        updates.push(`start_date = $${paramCount}`)
        params.push(data.start_date)
      }
      if (data.end_date !== undefined) {
        paramCount++
        updates.push(`end_date = $${paramCount}`)
        params.push(data.end_date)
      }
      if (data.manager_id !== undefined) {
        paramCount++
        updates.push(`manager_employee_id = $${paramCount}`)
        params.push(data.manager_id)
      }
      if (data.status !== undefined) {
        paramCount++
        updates.push(`status = $${paramCount}`)
        params.push(data.status)
      }
      if (data.budget_total !== undefined) {
        paramCount++
        updates.push(`budget_total = $${paramCount}`)
        params.push(data.budget_total)
      }

      if (updates.length === 0) {
        throw new Error('업데이트할 데이터가 없습니다.')
      }

      updates.push(`updated_at = now()`)

      const result = await query<DatabaseProject>(
        `UPDATE projects 
         SET ${updates.join(', ')}
         WHERE id = $1
         RETURNING id, code, title, description, sponsor, sponsor_type,
                   start_date::text as start_date, end_date::text as end_date,
                   manager_employee_id, status, budget_total,
                   created_at::text as created_at, updated_at::text as updated_at`,
        params,
      )

      if (!result.rows[0]) {
        throw new Error('프로젝트를 찾을 수 없습니다.')
      }

      logger.info(`Project updated: ${id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update project:', error)
      throw error
    }
  }

  /**
   * 프로젝트 삭제
   */
  async delete(id: string): Promise<void> {
    try {
      await query('DELETE FROM projects WHERE id = $1', [id])
      logger.info(`Project deleted: ${id}`)
    } catch (error) {
      logger.error('Failed to delete project:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const projectService = new ProjectService()
