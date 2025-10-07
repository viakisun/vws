import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 카테고리 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params
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

    // 카테고리 존재 확인
    const categoryCheck = await query(
      'SELECT id, is_system FROM finance_categories WHERE id = $1',
      [id],
    )

    if (categoryCheck.rows.length === 0) {
      return json(
        {
          success: false,
          error: '카테고리를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const category = categoryCheck.rows[0]

    // 시스템 카테고리는 수정 불가
    if (category.is_system) {
      return json(
        {
          success: false,
          error: '시스템 카테고리는 수정할 수 없습니다.',
        },
        { status: 400 },
      )
    }

    // 중복 카테고리명 확인 (자신 제외)
    const duplicateCheck = await query(
      'SELECT id FROM finance_categories WHERE name = $1 AND id != $2 AND is_active = true',
      [name, id],
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
      `UPDATE finance_categories 
       SET name = $1, type = $2, color = $3, description = $4, updated_at = NOW()
       WHERE id = $5
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
      [name, type, color || '#3B82F6', description || '', id],
    )

    return json({
      success: true,
      data: result.rows[0],
      message: '카테고리가 성공적으로 수정되었습니다.',
    })
  } catch (error) {
    logger.error('카테고리 수정 실패:', error)
    return json(
      {
        success: false,
        error: '카테고리 수정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 카테고리 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    // 카테고리 존재 및 시스템 카테고리 확인
    const categoryCheck = await query(
      'SELECT id, name, is_system FROM finance_categories WHERE id = $1',
      [id],
    )

    if (categoryCheck.rows.length === 0) {
      return json(
        {
          success: false,
          error: '카테고리를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const category = categoryCheck.rows[0]

    // 시스템 카테고리는 삭제 불가
    if (category.is_system) {
      return json(
        {
          success: false,
          error: '시스템 카테고리는 삭제할 수 없습니다.',
        },
        { status: 400 },
      )
    }

    // 해당 카테고리를 사용하는 거래가 있는지 확인
    const transactionCheck = await query(
      'SELECT COUNT(*) as count FROM finance_transactions WHERE category_id = $1',
      [id],
    )

    const transactionCount = parseInt(transactionCheck.rows[0]?.count || '0')

    if (transactionCount > 0) {
      return json(
        {
          success: false,
          error: `이 카테고리를 사용하는 거래가 ${transactionCount}건 있습니다. 거래를 다른 카테고리로 변경한 후 삭제해주세요.`,
        },
        { status: 400 },
      )
    }

    // 카테고리 삭제 (soft delete)
    await query(
      'UPDATE finance_categories SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id],
    )

    return json({
      success: true,
      message: `'${category.name}' 카테고리가 성공적으로 삭제되었습니다.`,
    })
  } catch (error) {
    logger.error('카테고리 삭제 실패:', error)
    return json(
      {
        success: false,
        error: '카테고리 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
