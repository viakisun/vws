import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger';

// 특정 부서 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query(
      `
			SELECT id, name, description, status, max_employees, created_at, updated_at
			FROM departments
			WHERE id = $1
		`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '부서를 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    return json({
      success: true,
      data: result.rows[0]
    })
  } catch (error: any) {
    logger.error('Error fetching department:', error)
    return json(
      {
        success: false,
        error: error.message || '부서 정보를 가져오는데 실패했습니다.'
      },
      { status: 500 }
    )
  }
}

// 부서 정보 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json()

    // 필수 필드 검증
    if (!data.name || data.name.trim() === '') {
      return json(
        {
          success: false,
          error: '부서명은 필수 입력 항목입니다.'
        },
        { status: 400 }
      )
    }

    // 중복 부서명 검증 (자기 자신 제외)
    const existingDept = await query(
      'SELECT id FROM departments WHERE LOWER(name) = LOWER($1) AND id != $2',
      [data.name.trim(), params.id]
    )

    if (existingDept.rows.length > 0) {
      return json(
        {
          success: false,
          error: '이미 존재하는 부서명입니다.'
        },
        { status: 400 }
      )
    }

    const result = await query(
      `
			UPDATE departments SET
				name = $2,
				description = $3,
				status = $4,
				max_employees = $5,
				updated_at = $6
			WHERE id = $1
			RETURNING id, name, description, status, max_employees, created_at, updated_at
		`,
      [
        params.id,
        data.name.trim(),
        data.description?.trim() || '',
        data.status || 'active',
        data.to || 0,
        new Date()
      ]
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '부서를 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    return json({
      success: true,
      data: result.rows[0],
      message: '부서 정보가 성공적으로 수정되었습니다.'
    })
  } catch (error: any) {
    logger.error('Error updating department:', error)
    return json(
      {
        success: false,
        error: error.message || '부서 정보 수정에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}

// 부서 삭제
export const DELETE: RequestHandler = async ({ params, url }) => {
  try {
    const searchParams = url.searchParams
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // 하드 삭제: 부서를 사용하는 직원이 있는지 확인
      const employeesInDept = await query(
        'SELECT COUNT(*) as count FROM employees WHERE department = (SELECT name FROM departments WHERE id = $1)',
        [params.id]
      )

      if (parseInt(employeesInDept.rows[0].count) > 0) {
        return json(
          {
            success: false,
            error: '해당 부서에 소속된 직원이 있어 삭제할 수 없습니다.'
          },
          { status: 400 }
        )
      }

      // 하드 삭제 실행
      const result = await query('DELETE FROM departments WHERE id = $1 RETURNING id, name', [
        params.id
      ])

      if (result.rows.length === 0) {
        return json(
          {
            success: false,
            error: '부서를 찾을 수 없습니다.'
          },
          { status: 404 }
        )
      }

      return json({
        success: true,
        message: '부서가 완전히 삭제되었습니다.'
      })
    } else {
      // 소프트 삭제: 상태를 'inactive'로 변경
      const result = await query(
        `
				UPDATE departments SET
					status = 'inactive',
					updated_at = $2
				WHERE id = $1
				RETURNING id, name, status
			`,
        [params.id, new Date()]
      )

      if (result.rows.length === 0) {
        return json(
          {
            success: false,
            error: '부서를 찾을 수 없습니다.'
          },
          { status: 404 }
        )
      }

      return json({
        success: true,
        message: '부서가 비활성화되었습니다.'
      })
    }
  } catch (error: any) {
    logger.error('Error deleting department:', error)
    return json(
      {
        success: false,
        error: error.message || '부서 삭제에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}
