import { DatabaseService } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// TODO: 실제 EmployeeService로 교체 필요
declare module '$lib/database/connection' {
  namespace DatabaseService {
    function getEmployees(params: any): Promise<any>
    function createEmployee(data: any): Promise<any>
  }
}

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
      offset,
    })

    const response: ApiResponse<typeof employees> = {
      success: true,
      data: employees,
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('Get employees error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return json(response, { status: 500 })
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const employeeData = (await request.json()) as Record<string, unknown>

    const newEmployee = await DatabaseService.createEmployee(employeeData)

    const response: ApiResponse<typeof newEmployee> = {
      success: true,
      data: newEmployee,
      message: 'Employee created successfully',
    }
    return json(response, { status: 201 })
  } catch (error: unknown) {
    logger.error('Create employee error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return json(response, { status: 500 })
  }
}
