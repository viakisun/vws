import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 직원 테이블에 직책 필드 추가
export const POST: RequestHandler = async () => {
  try {
    // 직책 필드가 이미 존재하는지 확인
    const checkColumn = await query(`
			SELECT column_name 
			FROM information_schema.columns 
			WHERE table_name = 'employees' AND column_name = 'job_title_id'
		`)

    if (checkColumn.rows.length === 0) {
      // 직책 필드 추가
      await query(`
				ALTER TABLE employees 
				ADD COLUMN job_title_id UUID REFERENCES job_titles(id)
			`)

      logger.log('job_title_id column added to employees table')
    } else {
      logger.log('job_title_id column already exists in employees table')
    }

    const response: ApiResponse<null> = {
      success: true,
      message: '직책 필드가 성공적으로 추가되었습니다.',
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('Error adding job_title_id field:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '직책 필드 추가에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
