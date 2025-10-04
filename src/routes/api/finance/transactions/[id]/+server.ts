import { query } from '$lib/database/connection'
import { transactionDbService } from '$lib/finance/services/database/transaction-db-service'
import type { UpdateTransactionRequest } from '$lib/finance/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params
    const data: UpdateTransactionRequest = await request.json()

    // 부분 업데이트를 위한 검증 - 최소한 하나의 필드는 업데이트되어야 함
    if (!data.description && !data.categoryId) {
      return json(
        {
          success: false,
          error: '업데이트할 필드가 없습니다.',
        },
        { status: 400 },
      )
    }

    // 트랜잭션 시작
    await query('BEGIN')

    try {
      // 기존 거래 정보 조회 (잔액 되돌리기 위해)
      const existingTransaction = await query(
        'SELECT account_id, amount, type FROM finance_transactions WHERE id = $1',
        [id],
      )

      if (existingTransaction.rows.length === 0) {
        await query('ROLLBACK')
        return json(
          {
            success: false,
            error: '거래를 찾을 수 없습니다.',
          },
          { status: 404 },
        )
      }

      const existing = existingTransaction.rows[0]

      // 거래 수정
      const updatedTransaction = await transactionDbService.updateTransaction(id, data)

      // 트랜잭션 커밋
      await query('COMMIT')

      return json({
        success: true,
        data: updatedTransaction,
      })
    } catch (error) {
      // 트랜잭션 롤백
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('거래 수정 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '거래 수정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    // ID 유효성 검증
    if (!id || typeof id !== 'string') {
      return json(
        {
          success: false,
          error: '유효하지 않은 거래 ID입니다.',
        },
        { status: 400 },
      )
    }

    // UUID 형식 검증 (더 유연한 패턴)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return json(
        {
          success: false,
          error: '올바르지 않은 거래 ID 형식입니다.',
        },
        { status: 400 },
      )
    }

    // 트랜잭션 시작
    await query('BEGIN')

    try {
      // 삭제 전 거래 정보 조회 (존재 여부 및 잔액 되돌리기 위해)
      const existingTransaction = await query(
        'SELECT account_id, amount, type, description FROM finance_transactions WHERE id = $1',
        [id],
      )

      if (existingTransaction.rows.length === 0) {
        await query('ROLLBACK')
        return json(
          {
            success: false,
            error: '거래를 찾을 수 없습니다.',
          },
          { status: 404 },
        )
      }

      const existing = existingTransaction.rows[0]

      // 거래 삭제 (ID로 정확히 하나만 삭제)
      const deleteResult = await query('DELETE FROM finance_transactions WHERE id = $1', [id])

      // 삭제된 행이 없는 경우 (이미 삭제되었거나 존재하지 않음)
      if (deleteResult.rowCount === 0) {
        await query('ROLLBACK')
        return json(
          {
            success: false,
            error: '거래가 이미 삭제되었거나 존재하지 않습니다.',
          },
          { status: 404 },
        )
      }

      // 트랜잭션 커밋
      await query('COMMIT')

      return json({
        success: true,
        message: `거래 "${existing.description}"이 삭제되었습니다.`,
        deletedTransaction: {
          id,
          description: existing.description,
          amount: existing.amount,
          type: existing.type,
        },
      })
    } catch (error) {
      // 트랜잭션 롤백
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('거래 삭제 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '거래 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
