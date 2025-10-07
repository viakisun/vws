import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 미분류 카테고리 제거 및 기타수입/기타지출로 통합
export const POST: RequestHandler = async () => {
  try {
    logger.info('🔥🔥🔥 미분류 카테고리 제거 시작 🔥🔥🔥')

    // 미분류 카테고리 ID 조회
    const uncategorizedResult = await query(`
      SELECT id FROM finance_categories 
      WHERE name = '미분류' AND is_active = true
      LIMIT 1
    `)

    if (!uncategorizedResult.rows || uncategorizedResult.rows.length === 0) {
      return json({
        success: false,
        message: '미분류 카테고리를 찾을 수 없습니다.',
      })
    }

    const uncategorizedCategoryId = uncategorizedResult.rows[0].id
    logger.info('🔥 미분류 카테고리 ID:', uncategorizedCategoryId)

    // 기타수입/기타지출 카테고리 ID 조회
    const otherCategoriesResult = await query(`
      SELECT id, name, type FROM finance_categories 
      WHERE name IN ('기타수입', '기타지출') AND is_active = true
    `)

    if (!otherCategoriesResult.rows || otherCategoriesResult.rows.length === 0) {
      return json({
        success: false,
        message: '기타수입/기타지출 카테고리를 찾을 수 없습니다.',
      })
    }

    const otherCategories = otherCategoriesResult.rows
    const 기타수입CategoryId = otherCategories.find((c) => c.name === '기타수입')?.id
    const 기타지출CategoryId = otherCategories.find((c) => c.name === '기타지출')?.id

    logger.info('🔥 기타수입 카테고리 ID:', 기타수입CategoryId)
    logger.info('🔥 기타지출 카테고리 ID:', 기타지출CategoryId)

    // 미분류 거래들을 거래 유형에 따라 기타수입/기타지출로 분류
    const updateResult = await query(
      `
      UPDATE finance_transactions 
      SET category_id = CASE 
        WHEN deposits > 0 THEN $1::uuid  -- 입금이 있으면 기타수입
        WHEN withdrawals > 0 THEN $2::uuid  -- 출금이 있으면 기타지출
        ELSE $2::uuid  -- 기본값은 기타지출
      END
      WHERE category_id = $3::uuid
      RETURNING id, deposits, withdrawals, category_id
    `,
      [기타수입CategoryId, 기타지출CategoryId, uncategorizedCategoryId],
    )

    const updatedTransactions = updateResult.rows || []
    const 기타수입으로이동 = updatedTransactions.filter(
      (t) => t.category_id === 기타수입CategoryId,
    ).length
    const 기타지출로이동 = updatedTransactions.filter(
      (t) => t.category_id === 기타지출CategoryId,
    ).length

    logger.info(`✅ 기타수입으로 이동: ${기타수입으로이동}건`)
    logger.info(`✅ 기타지출로 이동: ${기타지출로이동}건`)

    // 미분류 카테고리 비활성화 (삭제 대신 비활성화)
    await query(
      `
      UPDATE finance_categories 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1::uuid
    `,
      [uncategorizedCategoryId],
    )

    logger.info('✅ 미분류 카테고리 비활성화 완료')

    return json({
      success: true,
      message: `미분류 카테고리를 제거하고 거래들을 기타수입/기타지출로 이동했습니다.`,
      details: {
        totalMoved: updatedTransactions.length,
        to기타수입: 기타수입으로이동,
        to기타지출: 기타지출로이동,
      },
    })
  } catch (error: any) {
    logger.error('🔥🔥🔥 미분류 카테고리 제거 실패:', error)
    return json(
      {
        success: false,
        message: `미분류 카테고리 제거 중 오류가 발생했습니다: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
