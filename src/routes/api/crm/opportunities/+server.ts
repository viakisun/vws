import { verifyToken } from '$lib/auth/middleware'
import type { CRMApiResponse, CRMOpportunity } from '$lib/crm/types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 영업 기회 목록 조회
export const GET: RequestHandler = async ({ url, cookies }) => {
  // 인증 확인
  const token = cookies.get('token')
  if (!token) {
    return json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const user = await verifyToken(token)
  if (!user) {
    return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
  }

  try {
    const stage = url.searchParams.get('stage') || 'all'
    const status = url.searchParams.get('status') || 'all'
    const type = url.searchParams.get('type') || 'all'
    const search = url.searchParams.get('search') || ''

    const whereConditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (stage !== 'all') {
      whereConditions.push(`stage = $${paramIndex}`)
      params.push(stage)
      paramIndex++
    }

    if (status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (type !== 'all') {
      whereConditions.push(`type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const result = await query(
      `
      SELECT 
        o.id, o.title, o.customer_id, o.type, o.stage, o.value, o.probability,
        o.expected_close_date::text as expected_close_date, o.owner_id, o.description, o.status,
        o.created_at::text as created_at, o.updated_at::text as updated_at,
        c.name as customer_name,
        c.type as customer_type
      FROM crm_opportunities o
      LEFT JOIN crm_customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY o.created_at DESC
      `,
      params,
    )

    const response: CRMApiResponse<CRMOpportunity[]> = {
      success: true,
      data: result.rows as CRMOpportunity[],
    }

    return json(response)
  } catch (error) {
    logger.error('영업 기회 목록 조회 실패:', error)
    const response: CRMApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '영업 기회 목록을 조회할 수 없습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 새 영업 기회 생성
export const POST: RequestHandler = async ({ request, cookies }) => {
  // 인증 확인
  const token = cookies.get('token')
  if (!token) {
    return json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const user = await verifyToken(token)
  if (!user) {
    return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
  }

  try {
    const data = await request.json()

    // 필수 필드 검증
    if (!data.title || !data.customer_id || !data.type) {
      const response: CRMApiResponse<null> = {
        success: false,
        error: '제목, 고객, 타입은 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    // 고객 존재 확인
    const customerCheck = await query('SELECT id FROM crm_customers WHERE id = $1', [
      data.customer_id,
    ])

    if (customerCheck.rows.length === 0) {
      const response: CRMApiResponse<null> = {
        success: false,
        error: '존재하지 않는 고객입니다.',
      }
      return json(response, { status: 400 })
    }

    const result = await query(
      `
      INSERT INTO crm_opportunities (
        title, customer_id, type, stage, value, probability, 
        expected_close_date, owner_id, description, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, title, customer_id, type, stage, value, probability,
                expected_close_date::text as expected_close_date, owner_id, description, status,
                created_at::text as created_at, updated_at::text as updated_at
      `,
      [
        data.title,
        data.customer_id,
        data.type,
        data.stage || 'prospecting',
        data.value || 0,
        data.probability || 50,
        data.expected_close_date || null,
        data.owner_id || null,
        data.description || null,
        data.status || 'active',
      ],
    )

    const response: CRMApiResponse<CRMOpportunity> = {
      success: true,
      data: result.rows[0] as CRMOpportunity,
      message: '영업 기회가 성공적으로 생성되었습니다.',
    }

    return json(response)
  } catch (error) {
    logger.error('영업 기회 생성 실패:', error)
    const response: CRMApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '영업 기회 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
