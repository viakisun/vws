import { json } from '@sveltejs/kit'
import { DatabaseService } from '$lib/database/connection'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

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

    return json({
      success: true,
      data: users,
      pagination: {
        limit,
        offset,
        total: users.length,
      },
    })
  } catch (error) {
    logger.error('Get users error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const userData = await request.json()

    const newUser = await DatabaseService.createUser(userData)

    return json(
      {
        success: true,
        data: newUser,
        message: 'User created successfully',
      },
      { status: 201 },
    )
  } catch (error) {
    logger.error('Create user error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
