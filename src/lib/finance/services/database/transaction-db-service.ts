import { query } from '$lib/database/connection'
import type { Transaction, UpdateTransactionRequest } from '$lib/finance/types'

export class TransactionDbService {
  // 거래 수정
  async updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    try {
      const result = await query(
        `UPDATE finance_transactions
         SET account_id = $1, category_id = $2, amount = $3, type = $4,
             description = $5, transaction_date = $6, counterparty = $7,
             deposits = $8, withdrawals = $9, balance = $10,
             reference_number = $11, notes = $12, tags = $13, updated_at = NOW()
         WHERE id = $14
         RETURNING *`,
        [
          data.accountId,
          data.categoryId,
          data.amount,
          data.type,
          data.description,
          data.transactionDate,
          data.counterparty || null,
          data.deposits || null,
          data.withdrawals || null,
          data.balance || null,
          data.referenceNumber || null,
          data.notes || null,
          data.tags ? `{${data.tags.map((tag) => `"${tag}"`).join(',')}}` : null,
          id,
        ],
      )

      if (!result.rows[0]) {
        throw new Error('거래를 찾을 수 없습니다.')
      }

      return await this.enrichTransaction(result.rows[0])
    } catch (error) {
      console.error('거래 수정 실패:', error)
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
      console.error('거래 삭제 실패:', error)
      throw error
    }
  }

  // 거래 정보를 계좌와 카테고리 정보로 풍부하게 만들기
  private async enrichTransaction(transaction: any): Promise<Transaction> {
    try {
      // 계좌 정보 조회
      const accountResult = await query(
        `SELECT a.*, b.name as bank_name
         FROM finance_accounts a
         JOIN finance_banks b ON a.bank_id = b.id
         WHERE a.id = $1`,
        [transaction.account_id],
      )

      // 카테고리 정보 조회
      const categoryResult = await query('SELECT * FROM finance_categories WHERE id = $1', [
        transaction.category_id,
      ])

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
        referenceNumber: transaction.reference_number,
        notes: transaction.notes,
        tags: transaction.tags || [],
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
