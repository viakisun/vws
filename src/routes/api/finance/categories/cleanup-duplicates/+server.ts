import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

export const POST: RequestHandler = async () => {
  try {
    logger.info('🧹 중복 카테고리 정리 시작...')

    // 1. 중복 카테고리 확인
    const duplicateQuery = `
      SELECT name, type, COUNT(*) as count
      FROM finance_categories 
      WHERE is_active = true
      GROUP BY name, type
      HAVING COUNT(*) > 1
      ORDER BY name, type
    `

    const duplicates = await query(duplicateQuery)
    logger.info('📊 중복 카테고리:', duplicates.rows)

    if (duplicates.rows.length === 0) {
      return json({
        success: true,
        message: '중복 카테고리가 없습니다.',
        cleanedCount: 0,
      })
    }

    let cleanedCount = 0
    const cleanedCategories: Array<{
      removed: any
      kept: any
      name: any
      type: any
      transactionCount: number
    }> = []

    // 2. 각 중복 카테고리 그룹에 대해 처리
    for (const duplicate of duplicates.rows) {
      const { name, type, count } = duplicate

      // 해당 카테고리의 모든 ID 조회 (생성일 순으로 정렬)
      const categoryIdsQuery = `
        SELECT id, created_at
        FROM finance_categories 
        WHERE name = $1 AND type = $2 AND is_active = true
        ORDER BY created_at ASC
      `

      const categoryIds = await query(categoryIdsQuery, [name, type])
      logger.info(`🔍 ${name}(${type}) 카테고리 ${categoryIds.rows.length}개 발견`)

      if (categoryIds.rows.length > 1) {
        // 가장 오래된 카테고리(첫 번째)는 유지하고, 나머지는 비활성화
        const keepCategory = categoryIds.rows[0]
        const removeCategories = categoryIds.rows.slice(1)

        logger.info(`✅ 유지할 카테고리: ${keepCategory.id} (${keepCategory.created_at})`)

        for (const removeCategory of removeCategories) {
          // 해당 카테고리를 사용하는 거래가 있는지 확인
          const transactionCheck = await query(
            'SELECT COUNT(*) as count FROM finance_transactions WHERE category_id = $1',
            [removeCategory.id],
          )

          const transactionCount = parseInt(transactionCheck.rows[0]?.count || '0')

          if (transactionCount > 0) {
            // 거래가 있으면 유지할 카테고리로 변경
            await query('UPDATE finance_transactions SET category_id = $1 WHERE category_id = $2', [
              keepCategory.id,
              removeCategory.id,
            ])
            logger.info(`🔄 ${transactionCount}개 거래를 카테고리 ${keepCategory.id}로 변경`)
          }

          // 중복 카테고리 비활성화
          await query(
            'UPDATE finance_categories SET is_active = false, updated_at = NOW() WHERE id = $1',
            [removeCategory.id],
          )

          cleanedCategories.push({
            removed: removeCategory.id,
            kept: keepCategory.id,
            name,
            type,
            transactionCount,
          })

          cleanedCount++
          logger.info(`🗑️ 카테고리 ${removeCategory.id} 제거 (${removeCategory.created_at})`)
        }
      }
    }

    // 3. 최종 결과 확인
    const finalCheck = await query(duplicateQuery)

    return json({
      success: true,
      message: `${cleanedCount}개의 중복 카테고리를 정리했습니다.`,
      cleanedCount,
      cleanedCategories,
      remainingDuplicates: finalCheck.rows.length,
    })
  } catch (error) {
    logger.error('❌ 중복 카테고리 정리 실패:', error)
    return json(
      {
        success: false,
        message: '중복 카테고리 정리에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
