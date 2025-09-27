import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface ExecutiveInfo {
  id: string
  executive_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department?: string
  appointment_date?: string
  term_end_date?: string
  status: string
  bio?: string
  profile_image_url?: string
  created_at: string
  updated_at: string
  job_title_name?: string
  job_title_level?: string
  job_title_category?: string
  [key: string]: unknown
}

interface CreateExecutiveRequest {
  first_name: string
  last_name?: string
  email: string
  phone?: string
  job_title_id: string
  department?: string
  appointment_date?: string
  term_end_date?: string
  status?: string
  bio?: string
  profile_image_url?: string
}

// 이사 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const status = searchParams.get('status') || 'active'
    const department = searchParams.get('department')

    let whereClause = ''
    const params: (string | number)[] = []

    if (status === 'active') {
      whereClause = 'WHERE e.status = $1'
      params.push(status)
    } else if (status === 'all') {
      whereClause = ''
    }

    if (department) {
      if (whereClause) {
        whereClause += ' AND e.department = $' + (params.length + 1)
      } else {
        whereClause = 'WHERE e.department = $1'
      }
      params.push(department)
    }

    const result = await query<ExecutiveInfo>(
      `
			SELECT 
				e.id, e.executive_id, e.first_name, e.last_name, e.email, e.phone,
				e.department, e.appointment_date, e.term_end_date, e.status, e.bio, e.profile_image_url,
				e.created_at, e.updated_at,
				jt.name as job_title_name, jt.level as job_title_level, jt.category as job_title_category
			FROM executives e
			LEFT JOIN job_titles jt ON e.job_title_id = jt.id
			${whereClause}
			ORDER BY jt.level ASC, e.appointment_date DESC
		`,
      params,
    )

    const response: ApiResponse<ExecutiveInfo[]> = {
      success: true,
      data: result.rows,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error fetching executives:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '이사 목록을 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 새 이사 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = (await request.json()) as CreateExecutiveRequest

    // 필수 필드 검증
    if (!data.first_name || data.first_name.trim() === '') {
      return json(
        {
          success: false,
          error: '이름은 필수 입력 항목입니다.',
        },
        { status: 400 },
      )
    }

    if (!data.email || data.email.trim() === '') {
      return json(
        {
          success: false,
          error: '이메일은 필수 입력 항목입니다.',
        },
        { status: 400 },
      )
    }

    if (!data.job_title_id) {
      return json(
        {
          success: false,
          error: '직책은 필수 선택 항목입니다.',
        },
        { status: 400 },
      )
    }

    // 이메일 중복 검증
    const existingExec = await query<{ id: string }>(
      'SELECT id FROM executives WHERE LOWER(email) = LOWER($1)',
      [data.email.trim()],
    )

    if (existingExec.rows.length > 0) {
      return json(
        {
          success: false,
          error: '이미 존재하는 이메일입니다.',
        },
        { status: 400 },
      )
    }

    // Executive ID 생성
    const execIdResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM executives')
    const execCount = parseInt(execIdResult.rows[0].count) + 1
    const executiveId = `EXE${execCount.toString().padStart(3, '0')}`

    const result = await query<ExecutiveInfo>(
      `
			INSERT INTO executives (
				executive_id, first_name, last_name, email, phone, job_title_id, 
				department, appointment_date, term_end_date, status, bio, profile_image_url,
				created_at, updated_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
			RETURNING id, executive_id, first_name, last_name, email, phone, department, 
			          appointment_date, term_end_date, status, bio, profile_image_url, created_at, updated_at
		`,
      [
        executiveId,
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
        new Date(),
      ],
    )

    const response: ApiResponse<ExecutiveInfo> = {
      success: true,
      data: result.rows[0],
      message: '이사가 성공적으로 생성되었습니다.',
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error creating executive:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '이사 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
