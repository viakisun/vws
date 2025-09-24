import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

// 특정 직급 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query(
      `
			SELECT id, name, description, department, level, status, created_at, updated_at
			FROM positions
			WHERE id = $1
		`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '직급을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    return json({
      success: true,
      data: result.rows[0],
    })
  } catch (error: any) {
    logger.error('Error fetching position:', error)
    return json(
      {
        success: false,
        error: error.message || '직급 정보를 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 직급 정보 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json()

    // 필수 필드 검증
    if (!data.name || data.name.trim() === '') {
      return json(
        {
          success: false,
          error: '직급명은 필수 입력 항목입니다.',
        },
        { status: 400 },
      )
    }

    if (!data.department || data.department.trim() === '') {
      return json(
        {
          success: false,
          error: '부서는 필수 입력 항목입니다.',
        },
        { status: 400 },
      )
    }

    // 중복 직급명 검증 (자기 자신 제외, 같은 부서 내에서)
    const existingPos = await query(
      'SELECT id FROM positions WHERE LOWER(name) = LOWER($1) AND department = $2 AND id != $3',
      [data.name.trim(), data.department.trim(), params.id],
    )

    if (existingPos.rows.length > 0) {
      return json(
        {
          success: false,
          error: '해당 부서에 이미 존재하는 직급명입니다.',
        },
        { status: 400 },
      )
    }

    const result = await query(
      `
			UPDATE positions SET
				name = $2,
				description = $3,
				department = $4,
				level = $5,
				status = $6,
				updated_at = $7
			WHERE id = $1
			RETURNING id, name, description, department, level, status, created_at, updated_at
		`,
      [
        params.id,
        data.name.trim(),
        data.description?.trim() || '',
        data.department.trim(),
        data.level || 1,
        data.status || 'active',
        new Date(),
      ],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '직급을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    return json({
      success: true,
      data: result.rows[0],
      message: '직급 정보가 성공적으로 수정되었습니다.',
    })
  } catch (error: any) {
    logger.error('Error updating position:', error)
    return json(
      {
        success: false,
        error: error.message || '직급 정보 수정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 직급 삭제
export const DELETE: RequestHandler = async ({ params, url }) => {
  try {
    const searchParams = url.searchParams
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // 하드 삭제: 직급을 사용하는 직원이 있는지 확인
      const employeesInPos = await query(
        'SELECT COUNT(*) as count FROM employees WHERE position = (SELECT name FROM positions WHERE id = $1)',
        [params.id],
      )

      if (parseInt(employeesInPos.rows[0].count) > 0) {
        return json(
          {
            success: false,
            error: '해당 직급을 가진 직원이 있어 삭제할 수 없습니다.',
          },
          { status: 400 },
        )
      }

      // 하드 삭제 실행
      const result = await query('DELETE FROM positions WHERE id = $1 RETURNING id, name', [
        params.id,
      ])

      if (result.rows.length === 0) {
        return json(
          {
            success: false,
            error: '직급을 찾을 수 없습니다.',
          },
          { status: 404 },
        )
      }

      return json({
        success: true,
        message: '직급이 완전히 삭제되었습니다.',
      })
    } else {
      // 소프트 삭제: 상태를 'inactive'로 변경
      const result = await query(
        `
				UPDATE positions SET
					status = 'inactive',
					updated_at = $2
				WHERE id = $1
				RETURNING id, name, status
			`,
        [params.id, new Date()],
      )

      if (result.rows.length === 0) {
        return json(
          {
            success: false,
            error: '직급을 찾을 수 없습니다.',
          },
          { status: 404 },
        )
      }

      return json({
        success: true,
        message: '직급이 비활성화되었습니다.',
      })
    }
  } catch (error: any) {
    logger.error('Error deleting position:', error)
    return json(
      {
        success: false,
        error: error.message || '직급 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
