import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 모든 거래를 미분류 카테고리로 설정
export const POST: RequestHandler = async () => {
  try {
    // 미분류 카테고리 ID 조회
    const categoryResult = await query(`
      SELECT id FROM finance_categories 
      WHERE name = '미분류' AND is_active = true
      LIMIT 1
    `)

    if (!categoryResult.rows || categoryResult.rows.length === 0) {
      return json(
        {
          success: false,
          message: '미분류 카테고리를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const uncategorizedCategoryId = categoryResult.rows[0].id

    // 모든 거래를 미분류로 업데이트
    const updateResult = await query(
      `
      UPDATE finance_transactions 
      SET category_id = $1, updated_at = NOW()
      WHERE category_id IS NULL OR category_id != $1
    `,
      [uncategorizedCategoryId],
    )

    // 업데이트된 거래 수 확인
    const countResult = await query(
      `
      SELECT COUNT(*) as count FROM finance_transactions 
      WHERE category_id = $1
    `,
      [uncategorizedCategoryId],
    )

    const updatedCount = countResult.rows?.[0]?.count || 0

    logger.info(`🔥 미분류 카테고리로 설정 완료: ${updatedCount}건`)

    return json({
      success: true,
      message: `${updatedCount}건의 거래를 미분류 카테고리로 설정했습니다.`,
      updatedCount: parseInt(updatedCount),
    })
  } catch (error) {
    logger.error('거래 미분류 설정 실패:', error)
    return json(
      {
        success: false,
        message: '거래 미분류 설정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
