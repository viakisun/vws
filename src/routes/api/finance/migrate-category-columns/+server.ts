import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// finance_categories 테이블에 새로운 컬럼들 추가
export const POST: RequestHandler = async () => {
  try {
    // 새로운 컬럼들 추가
    await query(`
      ALTER TABLE finance_categories 
      ADD COLUMN IF NOT EXISTS accounting_code VARCHAR(10)
    `)

    await query(`
      ALTER TABLE finance_categories 
      ADD COLUMN IF NOT EXISTS tax_code VARCHAR(10)
    `)

    await query(`
      ALTER TABLE finance_categories 
      ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false
    `)

    return json({
      success: true,
      message: '카테고리 테이블 컬럼이 성공적으로 추가되었습니다.',
    })
  } catch (error) {
    console.error('카테고리 테이블 컬럼 추가 실패:', error)
    return json(
      {
        success: false,
        error: `카테고리 테이블 컬럼 추가에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}
