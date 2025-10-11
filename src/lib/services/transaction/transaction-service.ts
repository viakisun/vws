/**
 * Transaction Service
 * 거래 내역 관리 비즈니스 로직
 */

import type { DatabaseTransaction } from '$lib/database/connection'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

export interface TransactionFilters {
  bank_account_id?: string
  category_id?: string
  type?: string
  date_from?: Date
  date_to?: Date
  limit?: number
  offset?: number
}

export interface CreateTransactionDto {
  bank_account_id: string
  category_id: string
  amount: number
  type: string // 'income' | 'expense' | 'transfer'
  description?: string
  reference?: string
  date: Date
  created_by: string
}

export class TransactionService {
  /**
   * 거래 생성
   */
  async create(data: CreateTransactionDto): Promise<DatabaseTransaction> {
    try {
      const result = await query<DatabaseTransaction>(
        `INSERT INTO transactions (bank_account_id, category_id, amount, type, description, reference, date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, bank_account_id, category_id, amount, type, description, reference,
                   date::text as date, created_by,
                   created_at::text as created_at, updated_at::text as updated_at`,
        [
          data.bank_account_id,
          data.category_id,
          data.amount,
          data.type,
          data.description || null,
          data.reference || null,
          data.date,
          data.created_by,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('거래 생성에 실패했습니다.')
      }

      logger.info(`Transaction created: ${result.rows[0].id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create transaction:', error)
      throw error
    }
  }

  /**
   * 거래 ID로 조회
   */
  async getById(id: string): Promise<DatabaseTransaction | null> {
    try {
      const result = await query<DatabaseTransaction>(
        `SELECT id, bank_account_id, category_id, amount, type, description, reference,
                date::text as date, created_by,
                created_at::text as created_at, updated_at::text as updated_at
         FROM transactions 
         WHERE id = $1`,
        [id],
      )
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to get transaction by id:', error)
      throw error
    }
  }

  /**
   * 거래 목록 조회 (필터링 지원)
   */
  async list(filters?: TransactionFilters): Promise<DatabaseTransaction[]> {
    try {
      let queryText = `
        SELECT id, bank_account_id, category_id, amount, type, description, reference,
               date::text as date, created_by,
               created_at::text as created_at, updated_at::text as updated_at
        FROM transactions 
        WHERE 1=1`

      const params: unknown[] = []
      let paramCount = 0

      if (filters?.bank_account_id) {
        paramCount++
        queryText += ` AND bank_account_id = $${paramCount}`
        params.push(filters.bank_account_id)
      }

      if (filters?.category_id) {
        paramCount++
        queryText += ` AND category_id = $${paramCount}`
        params.push(filters.category_id)
      }

      if (filters?.type) {
        paramCount++
        queryText += ` AND type = $${paramCount}`
        params.push(filters.type)
      }

      if (filters?.date_from) {
        paramCount++
        queryText += ` AND date >= $${paramCount}`
        params.push(filters.date_from)
      }

      if (filters?.date_to) {
        paramCount++
        queryText += ` AND date <= $${paramCount}`
        params.push(filters.date_to)
      }

      queryText += ' ORDER BY date DESC, created_at DESC'

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

      const result = await query<DatabaseTransaction>(queryText, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to list transactions:', error)
      throw error
    }
  }

  /**
   * 거래 업데이트
   */
  async update(id: string, data: Partial<CreateTransactionDto>): Promise<DatabaseTransaction> {
    try {
      const updates: string[] = []
      const params: unknown[] = [id]
      let paramCount = 1

      if (data.amount !== undefined) {
        paramCount++
        updates.push(`amount = $${paramCount}`)
        params.push(data.amount)
      }
      if (data.type !== undefined) {
        paramCount++
        updates.push(`type = $${paramCount}`)
        params.push(data.type)
      }
      if (data.description !== undefined) {
        paramCount++
        updates.push(`description = $${paramCount}`)
        params.push(data.description)
      }
      if (data.reference !== undefined) {
        paramCount++
        updates.push(`reference = $${paramCount}`)
        params.push(data.reference)
      }
      if (data.date !== undefined) {
        paramCount++
        updates.push(`date = $${paramCount}`)
        params.push(data.date)
      }
      if (data.category_id !== undefined) {
        paramCount++
        updates.push(`category_id = $${paramCount}`)
        params.push(data.category_id)
      }

      if (updates.length === 0) {
        throw new Error('업데이트할 데이터가 없습니다.')
      }

      updates.push(`updated_at = now()`)

      const result = await query<DatabaseTransaction>(
        `UPDATE transactions 
         SET ${updates.join(', ')}
         WHERE id = $1
         RETURNING id, bank_account_id, category_id, amount, type, description, reference,
                   date::text as date, created_by,
                   created_at::text as created_at, updated_at::text as updated_at`,
        params,
      )

      if (!result.rows[0]) {
        throw new Error('거래를 찾을 수 없습니다.')
      }

      logger.info(`Transaction updated: ${id}`)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update transaction:', error)
      throw error
    }
  }

  /**
   * 거래 삭제
   */
  async delete(id: string): Promise<void> {
    try {
      await query('DELETE FROM transactions WHERE id = $1', [id])
      logger.info(`Transaction deleted: ${id}`)
    } catch (error) {
      logger.error('Failed to delete transaction:', error)
      throw error
    }
  }

  /**
   * 계좌별 거래 통계
   */
  async getAccountSummary(accountId: string, dateFrom?: Date, dateTo?: Date) {
    try {
      let queryText = `
        SELECT 
          type,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM transactions
        WHERE bank_account_id = $1`

      const params: unknown[] = [accountId]
      let paramCount = 1

      if (dateFrom) {
        paramCount++
        queryText += ` AND date >= $${paramCount}`
        params.push(dateFrom)
      }

      if (dateTo) {
        paramCount++
        queryText += ` AND date <= $${paramCount}`
        params.push(dateTo)
      }

      queryText += ' GROUP BY type'

      const result = await query(queryText, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to get account summary:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const transactionService = new TransactionService()

