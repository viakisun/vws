/**
 * Company Service
 * 회사 정보 관리 비즈니스 로직
 */

import { query } from '$lib/database/connection'
import type { DatabaseCompany } from '$lib/types'
import { logger } from '$lib/utils/logger'

export interface CompanyFilters {
  business_type?: string
  limit?: number
  offset?: number
}

export interface CreateCompanyDto {
  name: string
  establishment_date?: string
  ceo_name?: string
  business_type?: string
  address?: string
  phone?: string
  fax?: string
  email?: string
  website?: string
  registration_number?: string
}

export class CompanyService {
  /**
   * 회사 생성
   */
  async create(data: CreateCompanyDto): Promise<DatabaseCompany> {
    try {
      const result = await query<DatabaseCompany>(
        `INSERT INTO companies (name, establishment_date, ceo_name, business_type, address, phone, fax, email, website, registration_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, name, establishment_date::text as establishment_date, ceo_name, business_type,
                   address, phone, fax, email, website, registration_number,
                   created_at::text as created_at, updated_at::text as updated_at`,
        [
          data.name,
          data.establishment_date || null,
          data.ceo_name || null,
          data.business_type || null,
          data.address || null,
          data.phone || null,
          data.fax || null,
          data.email || null,
          data.website || null,
          data.registration_number || null,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('회사 생성에 실패했습니다.')
      }

      logger.info(`Company created: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create company:', error)
      throw error
    }
  }

  /**
   * 회사 ID로 조회
   */
  async getById(id: string): Promise<DatabaseCompany | null> {
    try {
      const result = await query<DatabaseCompany>(
        `SELECT id, name, establishment_date::text as establishment_date, ceo_name, business_type,
                address, phone, fax, email, website, registration_number,
                created_at::text as created_at, updated_at::text as updated_at
         FROM companies 
         WHERE id = $1`,
        [id],
      )
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to get company by id:', error)
      throw error
    }
  }

  /**
   * 회사 이름으로 조회
   */
  async getByName(name: string): Promise<DatabaseCompany | null> {
    try {
      const result = await query<DatabaseCompany>(
        `SELECT id, name, establishment_date::text as establishment_date, ceo_name, business_type,
                address, phone, fax, email, website, registration_number,
                created_at::text as created_at, updated_at::text as updated_at
         FROM companies 
         WHERE name = $1`,
        [name],
      )
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to get company by name:', error)
      throw error
    }
  }

  /**
   * 회사 목록 조회 (필터링 지원)
   */
  async list(filters?: CompanyFilters): Promise<DatabaseCompany[]> {
    try {
      let queryText = `
        SELECT id, name, establishment_date::text as establishment_date, ceo_name, business_type,
               address, phone, fax, email, website, registration_number,
               created_at::text as created_at, updated_at::text as updated_at
        FROM companies 
        WHERE 1=1`

      const params: unknown[] = []
      let paramCount = 0

      if (filters?.business_type) {
        paramCount++
        queryText += ` AND business_type = $${paramCount}`
        params.push(filters.business_type)
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

      const result = await query<DatabaseCompany>(queryText, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to list companies:', error)
      throw error
    }
  }

  /**
   * 회사 정보 업데이트
   */
  async update(id: string, data: Partial<CreateCompanyDto>): Promise<DatabaseCompany> {
    try {
      const updates: string[] = []
      const params: unknown[] = [id]
      let paramCount = 1

      if (data.name !== undefined) {
        paramCount++
        updates.push(`name = $${paramCount}`)
        params.push(data.name)
      }
      if (data.establishment_date !== undefined) {
        paramCount++
        updates.push(`establishment_date = $${paramCount}`)
        params.push(data.establishment_date)
      }
      if (data.ceo_name !== undefined) {
        paramCount++
        updates.push(`ceo_name = $${paramCount}`)
        params.push(data.ceo_name)
      }
      if (data.business_type !== undefined) {
        paramCount++
        updates.push(`business_type = $${paramCount}`)
        params.push(data.business_type)
      }
      if (data.address !== undefined) {
        paramCount++
        updates.push(`address = $${paramCount}`)
        params.push(data.address)
      }
      if (data.phone !== undefined) {
        paramCount++
        updates.push(`phone = $${paramCount}`)
        params.push(data.phone)
      }
      if (data.fax !== undefined) {
        paramCount++
        updates.push(`fax = $${paramCount}`)
        params.push(data.fax)
      }
      if (data.email !== undefined) {
        paramCount++
        updates.push(`email = $${paramCount}`)
        params.push(data.email)
      }
      if (data.website !== undefined) {
        paramCount++
        updates.push(`website = $${paramCount}`)
        params.push(data.website)
      }
      if (data.registration_number !== undefined) {
        paramCount++
        updates.push(`registration_number = $${paramCount}`)
        params.push(data.registration_number)
      }

      if (updates.length === 0) {
        throw new Error('업데이트할 데이터가 없습니다.')
      }

      updates.push(`updated_at = now()`)

      const result = await query<DatabaseCompany>(
        `UPDATE companies 
         SET ${updates.join(', ')}
         WHERE id = $1
         RETURNING id, name, establishment_date::text as establishment_date, ceo_name, business_type,
                   address, phone, fax, email, website, registration_number,
                   created_at::text as created_at, updated_at::text as updated_at`,
        params,
      )

      if (!result.rows[0]) {
        throw new Error('회사를 찾을 수 없습니다.')
      }

      logger.info(`Company updated: ${id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update company:', error)
      throw error
    }
  }

  /**
   * 회사 삭제 (soft delete는 별도 구현 필요)
   */
  async delete(id: string): Promise<void> {
    try {
      await query('DELETE FROM companies WHERE id = $1', [id])
      logger.info(`Company deleted: ${id}`)
    } catch (error) {
      logger.error('Failed to delete company:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const companyService = new CompanyService()

