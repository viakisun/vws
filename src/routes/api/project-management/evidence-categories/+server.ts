// 증빙 카테고리 API
// Evidence Categories API

import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 증빙 카테고리 목록 조회
export const GET: RequestHandler = async () => {
  try {
    const result = await query(
      `
			SELECT
				ec.*,
				COUNT(ei.id) as item_count,
				COUNT(CASE WHEN ei.status = 'completed' THEN 1 END) as completed_count,
				COUNT(CASE WHEN ei.status = 'in_progress' THEN 1 END) as in_progress_count,
				COUNT(CASE WHEN ei.status = 'planned' THEN 1 END) as planned_count
			FROM evidence_categories ec
			LEFT JOIN evidence_items ei ON ec.id = ei.category_id
			GROUP BY ec.id, ec.name, ec.description, ec.created_at, ec.updated_at
			ORDER BY ec.name
		`,
    )

    const response: ApiResponse<typeof result.rows> = {
      success: true,
      data: result.rows,
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('증빙 카테고리 조회 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      message: '증빙 카테고리 조회에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
    return json(response, { status: 500 })
  }
}

// 증빙 카테고리 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = (await request.json()) as Record<string, unknown>
    const { name, description } = data

    // 필수 필드 검증
    if (!name) {
      const response: ApiResponse<null> = {
        success: false,
        message: '카테고리 이름은 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    // 중복 이름 확인
    const duplicateCheck = await query('SELECT id FROM evidence_categories WHERE name = $1', [name])
    if (duplicateCheck.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        message: '이미 존재하는 카테고리 이름입니다.',
      }
      return json(response, { status: 400 })
    }

    // 증빙 카테고리 생성
    const result = await query(
      `
			INSERT INTO evidence_categories (name, description)
			VALUES ($1, $2)
			RETURNING id, name, description, created_at::text, updated_at::text
		`,
      [name, description],
    )

    const response: ApiResponse<Record<string, unknown>> = {
      success: true,
      data: result.rows[0] as Record<string, unknown>,
      message: '증빙 카테고리가 성공적으로 생성되었습니다.',
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('증빙 카테고리 생성 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      message: '증빙 카테고리 생성에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
    return json(response, { status: 500 })
  }
}
