import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 카테고리 목록 조회
export const GET: RequestHandler = async () => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        type,
        color,
        description,
        code,
        account_code as "accountCode",
        is_active as "isActive",
        is_system as "isSystem",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM finance_categories 
      WHERE is_active = true
      ORDER BY code ASC, name ASC
    `)

    return json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    logger.error('카테고리 조회 실패:', error)
    return json(
      {
        success: false,
        error: '카테고리를 조회할 수 없습니다.',
      },
      { status: 500 },
    )
  }
}

// 새 카테고리 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()
    const { name, type, color, description } = body

    if (!name || !type) {
      return json(
        {
          success: false,
          error: '카테고리명과 타입은 필수입니다.',
        },
        { status: 400 },
      )
    }

    // 중복 카테고리명 확인
    const duplicateCheck = await query(
      'SELECT id FROM finance_categories WHERE name = $1 AND is_active = true',
      [name],
    )

    if (duplicateCheck.rows.length > 0) {
      return json(
        {
          success: false,
          error: '이미 존재하는 카테고리명입니다.',
        },
        { status: 400 },
      )
    }

    const result = await query(
      `INSERT INTO finance_categories (name, type, color, description, is_active, is_system, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, false, NOW(), NOW())
       RETURNING 
         id,
         name,
         type,
         color,
         description,
         is_active as "isActive",
         is_system as "isSystem",
         created_at as "createdAt",
         updated_at as "updatedAt"`,
      [name, type, color || '#3B82F6', description || ''],
    )

    return json({
      success: true,
      data: result.rows[0],
      message: '카테고리가 성공적으로 생성되었습니다.',
    })
  } catch (error) {
    logger.error('카테고리 생성 실패:', error)
    return json(
      {
        success: false,
        error: '카테고리 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
