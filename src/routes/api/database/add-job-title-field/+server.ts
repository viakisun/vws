import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger';

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

    return json({
      success: true,
      message: '직책 필드가 성공적으로 추가되었습니다.'
    })
  } catch (error: any) {
    logger.error('Error adding job_title_id field:', error)
    return json(
      {
        success: false,
        error: error.message || '직책 필드 추가에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}
