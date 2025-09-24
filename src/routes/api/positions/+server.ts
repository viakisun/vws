import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

// 직급 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const status = searchParams.get('status') || 'active'
    const department = searchParams.get('department')

    let whereClause = ''
    const params: unknown[] = []

    if (status === 'active') {
      whereClause = 'WHERE status = $1'
      params.push(status)
    } else if (status === 'all') {
      whereClause = ''
    }

    if (department) {
      if (whereClause) {
        whereClause += ' AND department = $' + (params.length + 1)
      } else {
        whereClause = 'WHERE department = $1'
      }
      params.push(department)
    }

    const result = await query(
      `
			SELECT id, name, description, department, level, status, created_at, updated_at
			FROM positions
			${whereClause}
			ORDER BY level ASC, name ASC
		`,
      params,
    )

    return json({
      success: true,
      data: result.rows,
    })
  } catch (error: any) {
    logger.error('Error fetching positions:', error)
    return json(
      {
        success: false,
        error: error.message || '직급 목록을 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 새 직급 생성
export const POST: RequestHandler = async ({ request }) => {
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

    // 중복 직급명 검증 (같은 부서 내에서)
    const existingPos = await query(
      'SELECT id FROM positions WHERE LOWER(name) = LOWER($1) AND department = $2',
      [data.name.trim(), data.department.trim()],
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
			INSERT INTO positions (name, description, department, level, status, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id, name, description, department, level, status, created_at, updated_at
		`,
      [
        data.name.trim(),
        data.description?.trim() || '',
        data.department.trim(),
        data.level || 1,
        data.status || 'active',
        new Date(),
        new Date(),
      ],
    )

    return json({
      success: true,
      data: result.rows[0],
      message: '직급이 성공적으로 생성되었습니다.',
    })
  } catch (error: any) {
    logger.error('Error creating position:', error)
    return json(
      {
        success: false,
        error: error.message || '직급 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 모든 직급 삭제 (리셋용)
export const DELETE: RequestHandler = async () => {
  try {
    // 모든 직급을 삭제
    await query('DELETE FROM positions')

    return json({
      success: true,
      message: '모든 직급이 삭제되었습니다.',
    })
  } catch (error: any) {
    logger.error('Error deleting all positions:', error)
    return json(
      {
        success: false,
        error: error.message || '직급 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
