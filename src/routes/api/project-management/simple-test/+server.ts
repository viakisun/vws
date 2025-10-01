import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  try {
    logger.log('Simple project members query test...')

    const projectId = url.searchParams.get('projectId')

    if (!projectId) {
      return json(
        {
          success: false,
          message: 'projectId is required',
        },
        { status: 400 },
      )
    }

    // 가장 간단한 쿼리로 테스트
    const result = await query('SELECT * FROM project_members WHERE project_id = $1 LIMIT 5', [
      projectId,
    ])

    logger.log('Query executed successfully, rows:', result.rows.length)

    return json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    logger.error('Simple query failed:', error)
    return json(
      {
        success: false,
        message: 'Query failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
