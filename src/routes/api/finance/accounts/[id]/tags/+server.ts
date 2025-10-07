/**
 * Account Tags Relation API
 * 계좌-태그 연결 관리 API
 */

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

/**
 * GET: 계좌의 태그 목록 조회
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query(
      `
			SELECT
				t.id,
				t.name,
				t.color,
				t.description,
				t.tag_type as "tagType",
				t.is_system as "isSystem",
				t.is_active as "isActive",
				t.created_at as "createdAt",
				t.updated_at as "updatedAt"
			FROM finance_account_tags t
			INNER JOIN finance_account_tag_relations r ON r.tag_id = t.id
			WHERE r.account_id = $1
			ORDER BY t.is_system DESC, t.name ASC
		`,
      [params.id],
    )

    return json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    logger.error('계좌 태그 조회 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '계좌 태그 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

/**
 * POST: 계좌에 태그 추가
 */
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const { tagIds } = await request.json()

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return json(
        {
          success: false,
          error: '태그 ID 목록이 필요합니다.',
        },
        { status: 400 },
      )
    }

    // 기존 태그 삭제
    await query(
      `
			DELETE FROM finance_account_tag_relations
			WHERE account_id = $1
		`,
      [params.id],
    )

    // 새 태그 추가
    const values = tagIds.map((tagId, index) => `($1, $${index + 2})`).join(', ')
    const queryParams = [params.id, ...tagIds]

    await query(
      `
			INSERT INTO finance_account_tag_relations (account_id, tag_id)
			VALUES ${values}
			ON CONFLICT (account_id, tag_id) DO NOTHING
		`,
      queryParams,
    )

    // 업데이트된 태그 목록 조회
    const result = await query(
      `
			SELECT
				t.id,
				t.name,
				t.color,
				t.description,
				t.tag_type as "tagType",
				t.is_system as "isSystem",
				t.is_active as "isActive",
				t.created_at as "createdAt",
				t.updated_at as "updatedAt"
			FROM finance_account_tags t
			INNER JOIN finance_account_tag_relations r ON r.tag_id = t.id
			WHERE r.account_id = $1
			ORDER BY t.is_system DESC, t.name ASC
		`,
      [params.id],
    )

    return json({
      success: true,
      data: result.rows,
      message: '계좌 태그가 업데이트되었습니다.',
    })
  } catch (error) {
    logger.error('계좌 태그 추가 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '계좌 태그 추가에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE: 계좌의 특정 태그 제거
 */
export const DELETE: RequestHandler = async ({ params, url }) => {
  try {
    const tagId = url.searchParams.get('tagId')

    if (!tagId) {
      return json(
        {
          success: false,
          error: '태그 ID가 필요합니다.',
        },
        { status: 400 },
      )
    }

    const result = await query(
      `
			DELETE FROM finance_account_tag_relations
			WHERE account_id = $1 AND tag_id = $2
			RETURNING account_id
		`,
      [params.id, tagId],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '연결을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    return json({
      success: true,
      message: '계좌에서 태그가 제거되었습니다.',
    })
  } catch (error) {
    logger.error('계좌 태그 제거 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '계좌 태그 제거에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
