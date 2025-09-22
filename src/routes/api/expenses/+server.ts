import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { DatabaseService } from '$lib/database/connection'

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
      offset: offset ? parseInt(offset) : undefined
    })

    return json({
      success: true,
      data: expenses,
      count: expenses.length
    })
  } catch (err) {
    console.error('Get expenses error:', err)
    return error(500, { message: 'Internal server error' })
  }
}

// POST /api/expenses - Create new expense item
export const POST: RequestHandler = async ({ request }) => {
  try {
    const expenseData = await request.json()

    // Validate required fields
    if (
      !expenseData.project_id ||
      !expenseData.category_code ||
      !expenseData.amount ||
      !expenseData.requester_id
    ) {
      return error(400, {
        message: 'Project ID, category code, amount, and requester ID are required'
      })
    }

    // Validate amount
    if (expenseData.amount <= 0) {
      return error(400, { message: 'Amount must be greater than 0' })
    }

    // Check if project exists
    const project = await DatabaseService.getProjectById(expenseData.project_id)
    if (!project) {
      return error(400, { message: 'Project not found' })
    }

    const expense = await DatabaseService.createExpenseItem(expenseData)

    return json(
      {
        success: true,
        data: expense
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Create expense error:', err)
    return error(500, { message: 'Internal server error' })
  }
}
