import { query } from '$lib/database/connection'
import type { ApiResponse, DatabaseDepartment } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface CreateDepartmentRequest {
  name: string
  description?: string
  status?: string
  max_employees?: number
}

// 부서 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const status = searchParams.get('status') || 'active'

    let whereClause = ''
    if (status === 'active') {
      whereClause = 'WHERE status = $1'
    } else if (status === 'all') {
      whereClause = ''
    }

    const result = await query<DatabaseDepartment>(
      `
			SELECT id, name, description, status, max_employees, created_at, updated_at
			FROM departments
			${whereClause}
			ORDER BY name ASC
		`,
      status === 'all' ? [] : [status],
    )

    const response: ApiResponse<DatabaseDepartment[]> = {
      success: true,
      data: result.rows,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error fetching departments:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '부서 목록을 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 새 부서 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json() as CreateDepartmentRequest

    // 필수 필드 검증
    if (!data.name || data.name.trim() === '') {
      return json(
        {
          success: false,
          error: '부서명은 필수 입력 항목입니다.',
        },
        { status: 400 },
      )
    }

    // 중복 부서명 검증
    const existingDept = await query<{ id: string }>('SELECT id FROM departments WHERE LOWER(name) = LOWER($1)', [
      data.name.trim(),
    ])

    if (existingDept.rows.length > 0) {
      return json(
        {
          success: false,
          error: '이미 존재하는 부서명입니다.',
        },
        { status: 400 },
      )
    }

    const result = await query<DatabaseDepartment>(
      `
			INSERT INTO departments (name, description, status, max_employees, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id, name, description, status, max_employees, created_at, updated_at
		`,
      [
        data.name.trim(),
        data.description?.trim() || '',
        data.status || 'active',
        data.max_employees || 0,
        new Date(),
        new Date(),
      ],
    )

    const response: ApiResponse<DatabaseDepartment> = {
      success: true,
      data: result.rows[0],
      message: '부서가 성공적으로 생성되었습니다.',
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error creating department:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '부서 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
