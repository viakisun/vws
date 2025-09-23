import { json } from '@sveltejs/kit'
import { DatabaseService } from '$lib/database/connection'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const department = url.searchParams.get('department') || undefined
    const status = url.searchParams.get('status') || undefined

    const employees = await DatabaseService.getEmployees({
      department,
      status,
      limit,
      offset
    })

    return json({
      success: true,
      data: employees,
      pagination: {
        limit,
        offset,
        total: employees.length
      }
    })
  } catch (error) {
    logger.error('Get employees error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const employeeData = await request.json()

    const newEmployee = await DatabaseService.createEmployee(employeeData)

    return json(
      {
        success: true,
        data: newEmployee,
        message: 'Employee created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Create employee error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
