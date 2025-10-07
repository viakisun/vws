import { query } from '$lib/database/connection'
import type { Transaction, UpdateTransactionRequest } from '$lib/finance/types'
import { logger } from '$lib/utils/logger'

interface TransactionRow {
  id: string
  account_id: string
  category_id: string
  amount: string | number
  type: string
  status?: string
  description?: string
  transaction_date: string
  counterparty?: string
  deposits?: string | number
  withdrawals?: string | number
  balance?: string | number
  notes?: string
  is_recurring?: boolean
  recurring_pattern?: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

interface AccountRow {
  id: string
  name: string
  account_number: string
  bank_id: string
  bank_name: string
  bank_code?: string
  bank_color?: string
  account_type: string
  balance: string | number
  status: string
  description?: string
  is_primary: boolean
  alert_threshold?: string | number
  created_at: string
  updated_at: string
  [key: string]: unknown
}

interface CategoryRow {
  id: string
  name: string
  type: string
  [key: string]: unknown
}

export class TransactionDbService {
  // 거래 수정
  async updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    try {
      // 업데이트할 필드들을 동적으로 구성
      const updateFields: string[] = []
      const updateValues: unknown[] = []
      let paramIndex = 1

      // 각 필드가 존재하는 경우에만 업데이트에 포함
      if (data.accountId !== undefined) {
        updateFields.push(`account_id = $${paramIndex}`)
        updateValues.push(data.accountId)
        paramIndex++
      }
      if (data.categoryId !== undefined) {
        updateFields.push(`category_id = $${paramIndex}`)
        updateValues.push(data.categoryId)
        paramIndex++
      }
      if (data.amount !== undefined) {
        updateFields.push(`amount = $${paramIndex}`)
        updateValues.push(data.amount)
        paramIndex++
      }
      if (data.type !== undefined) {
        updateFields.push(`type = $${paramIndex}`)
        updateValues.push(data.type)
        paramIndex++
      }
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`)
        updateValues.push(data.description)
        paramIndex++
      }
      if (data.transactionDate !== undefined) {
        updateFields.push(`transaction_date = $${paramIndex}`)
        updateValues.push(data.transactionDate)
        paramIndex++
      }
      if (data.counterparty !== undefined) {
        updateFields.push(`counterparty = $${paramIndex}`)
        updateValues.push(data.counterparty)
        paramIndex++
      }
      if (data.deposits !== undefined) {
        updateFields.push(`deposits = $${paramIndex}`)
        updateValues.push(data.deposits)
        paramIndex++
      }
      if (data.withdrawals !== undefined) {
        updateFields.push(`withdrawals = $${paramIndex}`)
        updateValues.push(data.withdrawals)
        paramIndex++
      }
      if (data.balance !== undefined) {
        updateFields.push(`balance = $${paramIndex}`)
        updateValues.push(data.balance)
        paramIndex++
      }
      if (data.referenceNumber !== undefined) {
        updateFields.push(`reference_number = $${paramIndex}`)
        updateValues.push(data.referenceNumber)
        paramIndex++
      }
      if (data.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex}`)
        updateValues.push(data.notes)
        paramIndex++
      }
      if (data.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex}`)
        updateValues.push(data.tags ? `{${data.tags.map((tag) => `"${tag}"`).join(',')}}` : null)
        paramIndex++
      }

      // updated_at은 항상 포함
      updateFields.push(`updated_at = NOW()`)

      // 업데이트할 필드가 없는 경우
      if (updateFields.length === 1) {
        // updated_at만 있는 경우
        throw new Error('업데이트할 필드가 없습니다.')
      }

      // ID를 마지막 파라미터로 추가
      updateValues.push(id)

      const queryText = `
        UPDATE finance_transactions
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `

      const result = await query<TransactionRow>(queryText, updateValues)

      if (!result.rows[0]) {
        throw new Error('거래를 찾을 수 없습니다.')
      }

      return await this.enrichTransaction(result.rows[0])
    } catch (error) {
      logger.error('거래 수정 실패:', error)
      throw error
    }
  }

  // 거래 삭제
  async deleteTransaction(id: string): Promise<void> {
    try {
      const result = await query('DELETE FROM finance_transactions WHERE id = $1', [id])

      if (result.rowCount === 0) {
        throw new Error('거래를 찾을 수 없습니다.')
      }
    } catch (error) {
      logger.error('거래 삭제 실패:', error)
      throw error
    }
  }

  // 거래 정보를 계좌와 카테고리 정보로 풍부하게 만들기
  private async enrichTransaction(transaction: TransactionRow): Promise<Transaction> {
    try {
      // 계좌 정보 조회
      const accountResult = await query<AccountRow>(
        `SELECT a.*, b.name as bank_name
         FROM finance_accounts a
         JOIN finance_banks b ON a.bank_id = b.id
         WHERE a.id = $1`,
        [transaction.account_id],
      )

      // 카테고리 정보 조회
      const categoryResult = await query<CategoryRow>(
        'SELECT * FROM finance_categories WHERE id = $1',
        [transaction.category_id],
      )

      return {
        id: transaction.id,
        accountId: transaction.account_id,
        categoryId: transaction.category_id,
        amount: parseFloat(transaction.amount),
        type: transaction.type,
        status: transaction.status || 'completed',
        description: transaction.description,
        transactionDate: transaction.transaction_date,
        counterparty: transaction.counterparty,
        deposits: transaction.deposits ? parseFloat(transaction.deposits) : undefined,
        withdrawals: transaction.withdrawals ? parseFloat(transaction.withdrawals) : undefined,
        balance: transaction.balance ? parseFloat(transaction.balance) : undefined,
        notes: transaction.notes,
        isRecurring: transaction.is_recurring || false,
        recurringPattern: transaction.recurring_pattern
          ? JSON.parse(transaction.recurring_pattern)
          : null,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        account: accountResult.rows[0]
          ? {
              id: accountResult.rows[0].id,
              name: accountResult.rows[0].name,
              accountNumber: accountResult.rows[0].account_number,
              bankId: accountResult.rows[0].bank_id,
              bank: {
                id: accountResult.rows[0].bank_id,
                name: accountResult.rows[0].bank_name,
                code: accountResult.rows[0].bank_code || '',
                color: accountResult.rows[0].bank_color || '#3B82F6',
                isActive: true,
                createdAt: accountResult.rows[0].created_at,
                updatedAt: accountResult.rows[0].updated_at,
              },
              accountType: accountResult.rows[0].account_type,
              balance: parseFloat(accountResult.rows[0].balance),
              status: accountResult.rows[0].status,
              description: accountResult.rows[0].description,
              isPrimary: accountResult.rows[0].is_primary,
              alertThreshold: accountResult.rows[0].alert_threshold
                ? parseFloat(accountResult.rows[0].alert_threshold)
                : undefined,
              createdAt: accountResult.rows[0].created_at,
              updatedAt: accountResult.rows[0].updated_at,
            }
          : undefined,
        category: categoryResult.rows[0]
          ? {
              id: categoryResult.rows[0].id,
              name: categoryResult.rows[0].name,
              type: categoryResult.rows[0].type,
              parentId: categoryResult.rows[0].parent_id,
              color: categoryResult.rows[0].color,
              description: categoryResult.rows[0].description,
              isActive: categoryResult.rows[0].is_active,
              isSystem: categoryResult.rows[0].is_system,
              isDefault: categoryResult.rows[0].is_default || false,
              createdAt: categoryResult.rows[0].created_at,
              updatedAt: categoryResult.rows[0].updated_at,
            }
          : undefined,
      }
    } catch (error) {
      console.error('거래 정보 풍부화 실패:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스
export const transactionDbService = new TransactionDbService()
