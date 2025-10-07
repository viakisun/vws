/**
 * Account Tags API
 * 계좌 태그 관리 API
 */

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import type { AccountTag, CreateAccountTagRequest } from '$lib/finance/types'

/**
 * GET: 태그 목록 조회
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const isActive = url.searchParams.get('isActive')
    const search = url.searchParams.get('search')

    let queryText = `
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
			WHERE 1=1
		`
    const params: any[] = []
    let paramCount = 1

    if (isActive !== null) {
      queryText += ` AND is_active = $${paramCount}`
      params.push(isActive === 'true')
      paramCount++
    }

    if (search) {
      queryText += ` AND name ILIKE $${paramCount}`
      params.push(`%${search}%`)
      paramCount++
    }

    queryText += ' ORDER BY name ASC'

    const result = await query(queryText, params)
    const tags: AccountTag[] = result.rows

    return json({
      success: true,
      data: tags,
      message: '태그 목록을 조회했습니다.',
    })
  } catch (error) {
    logger.error('태그 목록 조회 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '태그 목록 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

/**
 * POST: 새 태그 생성
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateAccountTagRequest = await request.json()

    const result = await query(
      `
			INSERT INTO finance_account_tags (name, color, description, tag_type, is_system)
			VALUES ($1, $2, $3, 'custom', false)
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
      [data.name, data.color, data.description || null],
    )

    const tag: AccountTag = result.rows[0]

    return json({
      success: true,
      data: tag,
      message: '태그가 생성되었습니다.',
    })
  } catch (error) {
    logger.error('태그 생성 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '태그 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
