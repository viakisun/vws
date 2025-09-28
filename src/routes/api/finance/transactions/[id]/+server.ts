import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { transactionDbService } from '$lib/finance/services/database/transaction-db-service'
import type { UpdateTransactionRequest } from '$lib/finance/types'

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params
    const data: UpdateTransactionRequest = await request.json()

    // 필수 필드 검증
    if (
      !data.accountId ||
      !data.categoryId ||
      !data.amount ||
      !data.type ||
      !data.description ||
      !data.transactionDate
    ) {
      return json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 금액 검증
    if (data.amount <= 0) {
      return json(
        {
          success: false,
          error: '금액은 0보다 커야 합니다.',
        },
        { status: 400 },
      )
    }

    // 거래 타입 검증
    if (!['income', 'expense', 'transfer', 'adjustment'].includes(data.type)) {
      return json(
        {
          success: false,
          error: '유효하지 않은 거래 타입입니다.',
        },
        { status: 400 },
      )
    }

    const updatedTransaction = await transactionDbService.updateTransaction(id, data)

    return json({
      success: true,
      data: updatedTransaction,
    })
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

    await transactionDbService.deleteTransaction(id)

    return json({
      success: true,
      message: '거래가 삭제되었습니다.',
    })
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
