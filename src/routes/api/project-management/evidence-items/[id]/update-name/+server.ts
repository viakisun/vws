import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'


export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const evidenceId = params.id
    const data = await request.json() as Record<string, unknown>
    const { newName } = data

    if (!evidenceId || !newName) {
      const response: ApiResponse<null> = {
        success: false,
        error: '증빙 항목 ID와 새 이름이 필요합니다.',
      }
      return json(response, { status: 400 })
    }

    // 증빙 항목 이름 업데이트
    const result = await query(
      `
			UPDATE evidence_items 
			SET name = $1, updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
			RETURNING id, name, assignee_name, due_date
		`,
      [newName, evidenceId],
    )

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: '증빙 항목을 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    const response: ApiResponse<typeof result.rows[0]> = {
      success: true,
      message: '증빙 항목 이름이 업데이트되었습니다.',
      data: result.rows[0],
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('Evidence name update error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: '증빙 항목 이름 업데이트 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
    return json(response, { status: 500 })
  }
}
