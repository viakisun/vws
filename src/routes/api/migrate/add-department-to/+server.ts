import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 부서 테이블에 T/O 컬럼 추가
export const POST: RequestHandler = async () => {
  try {
    // T/O 컬럼 추가
    await query(`
			ALTER TABLE departments 
			ADD COLUMN IF NOT EXISTS max_employees INTEGER DEFAULT 0
		`)

    // 기존 부서들의 T/O 설정
    await query(`
			UPDATE departments 
			SET max_employees = CASE 
				WHEN name = '개발팀' THEN 4
				WHEN name = '경영기획팀' THEN 1
				WHEN name = '경영지원팀' THEN 2
				ELSE 0
			END
			WHERE max_employees = 0 OR max_employees IS NULL
		`)

    const response: ApiResponse<null> = {
      success: true,
      message: '부서 테이블에 T/O 컬럼이 성공적으로 추가되었습니다.',
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('Error adding TO column to departments:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'T/O 컬럼 추가에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
