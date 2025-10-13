import { DatabaseService } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// TODO: 실제 ExpenseService로 교체 필요
declare module '$lib/database/connection' {
  namespace DatabaseService {
    function getExpenseItems(params: any): Promise<any>
    function createExpenseItem(data: any): Promise<any>
  }
}

interface ExpenseItem {
  id: string
  project_id: string
  category_code: string
  amount: number
  requester_id: string
  status: string
  description?: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

interface CreateExpenseRequest {
  project_id: string
  category_code: string
  amount: number
  requester_id: string
  description?: string
  status?: string
}

// GET /api/expenses - Get all expense items
export const GET: RequestHandler = async ({ url }) => {
  try {
    const project_id = url.searchParams.get('project_id')
    const status = url.searchParams.get('status')
    const requester_id = url.searchParams.get('requester_id')
    const limit = url.searchParams.get('limit')
    const offset = url.searchParams.get('offset')

    const expenses = await DatabaseService.getExpenseItems({
      project_id: project_id || undefined,
      status: status || undefined,
      requester_id: requester_id || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })

    const response: ApiResponse<ExpenseItem[]> = {
      success: true,
      data: expenses as unknown as ExpenseItem[],
      count: expenses.length,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Get expenses error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '경비 목록 조회 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// POST /api/expenses - Create new expense item
export const POST: RequestHandler = async ({ request }) => {
  try {
    const expenseData = (await request.json()) as CreateExpenseRequest

    // Validate required fields
    if (
      !expenseData.project_id ||
      !expenseData.category_code ||
      !expenseData.amount ||
      !expenseData.requester_id
    ) {
      const response: ApiResponse<null> = {
        success: false,
        error: '프로젝트 ID, 카테고리 코드, 금액, 요청자 ID는 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    // Validate amount
    if (expenseData.amount <= 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: '금액은 0보다 커야 합니다.',
      }
      return json(response, { status: 400 })
    }

    // Check if project exists
    const project = await DatabaseService.getProjectById(expenseData.project_id)
    if (!project) {
      const response: ApiResponse<null> = {
        success: false,
        error: '프로젝트를 찾을 수 없습니다.',
      }
      return json(response, { status: 400 })
    }

    const expense = await DatabaseService.createExpenseItem(
      expenseData as unknown as Partial<import('$lib/database/connection').DatabaseExpenseItem>,
    )

    const response: ApiResponse<ExpenseItem> = {
      success: true,
      data: expense as unknown as ExpenseItem,
    }

    return json(response, { status: 201 })
  } catch (error: unknown) {
    logger.error('Create expense error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '경비 항목 생성 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}
