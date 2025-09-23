import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger';

// 특정 이사 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query(
      `
			SELECT 
				e.id, e.executive_id, e.first_name, e.last_name, e.email, e.phone,
				e.department, e.appointment_date, e.term_end_date, e.status, e.bio, e.profile_image_url,
				e.created_at, e.updated_at,
				jt.name as job_title_name, jt.level as job_title_level, jt.category as job_title_category
			FROM executives e
			LEFT JOIN job_titles jt ON e.job_title_id = jt.id
			WHERE e.id = $1
		`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '이사를 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    return json({
      success: true,
      data: result.rows[0]
    })
  } catch (error: any) {
    logger.error('Error fetching executive:', error)
    return json(
      {
        success: false,
        error: error.message || '이사 정보를 가져오는데 실패했습니다.'
      },
      { status: 500 }
    )
  }
}

// 이사 정보 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json()

    // 필수 필드 검증
    if (!data.first_name || data.first_name.trim() === '') {
      return json(
        {
          success: false,
          error: '이름은 필수 입력 항목입니다.'
        },
        { status: 400 }
      )
    }

    if (!data.email || data.email.trim() === '') {
      return json(
        {
          success: false,
          error: '이메일은 필수 입력 항목입니다.'
        },
        { status: 400 }
      )
    }

    if (!data.job_title_id) {
      return json(
        {
          success: false,
          error: '직책은 필수 선택 항목입니다.'
        },
        { status: 400 }
      )
    }

    // 이메일 중복 검증 (자신 제외)
    const existingExec = await query(
      'SELECT id FROM executives WHERE LOWER(email) = LOWER($1) AND id != $2',
      [data.email.trim(), params.id]
    )

    if (existingExec.rows.length > 0) {
      return json(
        {
          success: false,
          error: '이미 존재하는 이메일입니다.'
        },
        { status: 400 }
      )
    }

    const result = await query(
      `
			UPDATE executives SET
				first_name = $1,
				last_name = $2,
				email = $3,
				phone = $4,
				job_title_id = $5,
				department = $6,
				appointment_date = $7,
				term_end_date = $8,
				status = $9,
				bio = $10,
				profile_image_url = $11,
				updated_at = $12
			WHERE id = $13
			RETURNING id, executive_id, first_name, last_name, email, phone, department, 
			          appointment_date, term_end_date, status, bio, profile_image_url, created_at, updated_at
		`,
      [
        data.first_name.trim(),
        data.last_name?.trim() || '',
        data.email.trim(),
        data.phone?.trim() || '',
        data.job_title_id,
        data.department?.trim() || '',
        data.appointment_date || null,
        data.term_end_date || null,
        data.status || 'active',
        data.bio?.trim() || '',
        data.profile_image_url?.trim() || '',
        new Date(),
        params.id
      ]
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '이사를 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    return json({
      success: true,
      data: result.rows[0],
      message: '이사 정보가 성공적으로 수정되었습니다.'
    })
  } catch (error: any) {
    logger.error('Error updating executive:', error)
    return json(
      {
        success: false,
        error: error.message || '이사 정보 수정에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}

// 이사 삭제 (비활성화)
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const result = await query(
      `
			UPDATE executives SET
				status = 'inactive',
				updated_at = $1
			WHERE id = $2
			RETURNING id, executive_id, first_name, last_name
		`,
      [new Date(), params.id]
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '이사를 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    return json({
      success: true,
      message: '이사가 비활성화되었습니다.'
    })
  } catch (error: any) {
    logger.error('Error deleting executive:', error)
    return json(
      {
        success: false,
        error: error.message || '이사 삭제에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}
