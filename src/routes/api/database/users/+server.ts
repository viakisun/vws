import { DatabaseService } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const department = url.searchParams.get('department') || undefined

    const users = await DatabaseService.getUsers({
      department,
      limit,
      offset,
    })

    const response: ApiResponse<typeof users> = {
      success: true,
      data: users,
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('Get users error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return json(response, { status: 500 })
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const userData = (await request.json()) as Record<string, unknown>

    const newUser = await DatabaseService.createUser(userData)

    const response: ApiResponse<typeof newUser> = {
      success: true,
      data: newUser,
      message: 'User created successfully',
    }
    return json(response, { status: 201 })
  } catch (error: unknown) {
    logger.error('Create user error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return json(response, { status: 500 })
  }
}
