/**
 * Account Tag Detail API
 * 개별 태그 조회/수정/삭제 API
 */

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import type { AccountTag, UpdateAccountTagRequest } from '$lib/finance/types'

/**
 * GET: 태그 상세 조회
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query(
      `
			SELECT
				id,
				name,
				color,
				description,
				tag_type as "tagType",
				is_system as "isSystem",
				is_active as "isActive",
				created_at as "createdAt",
				updated_at as "updatedAt"
			FROM finance_account_tags
			WHERE id = $1
		`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '태그를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const tag: AccountTag = result.rows[0]

    return json({
      success: true,
      data: tag,
    })
  } catch (error) {
    logger.error('태그 조회 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '태그 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

/**
 * PUT: 태그 수정
 */
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data: UpdateAccountTagRequest = await request.json()

    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount}`)
      values.push(data.name)
      paramCount++
    }

    if (data.color !== undefined) {
      updates.push(`color = $${paramCount}`)
      values.push(data.color)
      paramCount++
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramCount}`)
      values.push(data.description)
      paramCount++
    }

    updates.push(`updated_at = NOW()`)
    values.push(params.id)

    const result = await query(
      `
			UPDATE finance_account_tags
			SET ${updates.join(', ')}
			WHERE id = $${paramCount}
			RETURNING
				id,
				name,
				color,
				description,
				tag_type as "tagType",
				is_system as "isSystem",
				is_active as "isActive",
				created_at as "createdAt",
				updated_at as "updatedAt"
		`,
      values,
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '태그를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const tag: AccountTag = result.rows[0]

    return json({
      success: true,
      data: tag,
      message: '태그가 수정되었습니다.',
    })
  } catch (error) {
    logger.error('태그 수정 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '태그 수정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE: 태그 삭제
 */
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    // 태그를 사용 중인 계좌가 있는지 확인
    const usageCheck = await query(
      `
			SELECT COUNT(*) as count
			FROM finance_account_tag_relations
			WHERE tag_id = $1
		`,
      [params.id],
    )

    const usageCount = parseInt(usageCheck.rows[0].count)

    if (usageCount > 0) {
      // 사용 중이면 비활성화만
      await query(
        `
				UPDATE finance_account_tags
				SET is_active = false, updated_at = NOW()
				WHERE id = $1
			`,
        [params.id],
      )

      return json({
        success: true,
        message: `태그가 ${usageCount}개 계좌에서 사용 중이므로 비활성화되었습니다.`,
      })
    } else {
      // 사용 중이 아니면 완전 삭제
      const result = await query(
        `
				DELETE FROM finance_account_tags
				WHERE id = $1
				RETURNING id
			`,
        [params.id],
      )

      if (result.rows.length === 0) {
        return json(
          {
            success: false,
            error: '태그를 찾을 수 없습니다.',
          },
          { status: 404 },
        )
      }

      return json({
        success: true,
        message: '태그가 삭제되었습니다.',
      })
    }
  } catch (error) {
    logger.error('태그 삭제 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '태그 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
