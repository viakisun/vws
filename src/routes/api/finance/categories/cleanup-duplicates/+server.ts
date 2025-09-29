import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async () => {
  try {
    // 1. 중복된 카테고리들을 찾아서 정리
    console.log('🔍 중복된 카테고리 정리 시작...')

    // 각 카테고리 이름과 타입별로 그룹화하여 중복 확인
    const categories = await query(`
      SELECT name, type, COUNT(*) as count, 
             ARRAY_AGG(id ORDER BY created_at) as ids,
             ARRAY_AGG(accounting_code ORDER BY created_at) as codes,
             ARRAY_AGG(is_active ORDER BY created_at) as active_status
      FROM finance_categories 
      GROUP BY name, type 
      HAVING COUNT(*) > 1
    `)

    console.log(`📊 중복된 카테고리 그룹: ${categories.rows.length}개`)

    for (const group of categories.rows) {
      const { name, type, ids, codes, active_status } = group
      console.log(`🔄 처리 중: ${name} (${type}) - ${ids.length}개 중복`)

      // 가장 최근에 생성된 카테고리를 유지하고 나머지는 삭제
      const keepId = ids[ids.length - 1] // 가장 최근 ID
      const deleteIds = ids.slice(0, -1) // 나머지 ID들

      // 삭제할 카테고리들에 연결된 거래들을 유지할 카테고리로 이동
      for (const deleteId of deleteIds) {
        await query('UPDATE finance_transactions SET category_id = $1 WHERE category_id = $2', [
          keepId,
          deleteId,
        ])

        // 중복 카테고리 삭제
        await query('DELETE FROM finance_categories WHERE id = $1', [deleteId])
        console.log(`  ✅ 삭제됨: ${deleteId}`)
      }
    }

    // 2. 비활성화된 카테고리들 정리
    const inactiveCategories = await query(`
      SELECT id FROM finance_categories WHERE is_active = false
    `)

    console.log(`🗑️ 비활성화된 카테고리 삭제: ${inactiveCategories.rows.length}개`)

    for (const category of inactiveCategories.rows) {
      // 비활성화된 카테고리에 연결된 거래가 있는지 확인
      const transactions = await query(
        'SELECT COUNT(*) as count FROM finance_transactions WHERE category_id = $1',
        [category.id],
      )

      if (parseInt(transactions.rows[0].count) === 0) {
        // 연결된 거래가 없으면 삭제
        await query('DELETE FROM finance_categories WHERE id = $1', [category.id])
        console.log(`  ✅ 삭제됨: ${category.id}`)
      } else {
        // 연결된 거래가 있으면 활성화
        await query('UPDATE finance_categories SET is_active = true WHERE id = $1', [category.id])
        console.log(`  🔄 활성화됨: ${category.id}`)
      }
    }

    // 3. 최종 카테고리 수 확인
    const finalCount = await query('SELECT COUNT(*) as count FROM finance_categories')
    const activeCount = await query(
      'SELECT COUNT(*) as count FROM finance_categories WHERE is_active = true',
    )

    return json({
      success: true,
      message: '중복된 카테고리가 성공적으로 정리되었습니다.',
      stats: {
        totalCategories: parseInt(finalCount.rows[0].count),
        activeCategories: parseInt(activeCount.rows[0].count),
        duplicatesRemoved: categories.rows.length,
        inactiveCleaned: inactiveCategories.rows.length,
      },
    })
  } catch (error) {
    console.error('카테고리 정리 실패:', error)
    return json(
      {
        success: false,
        error: `카테고리 정리에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}
