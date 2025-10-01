import { query } from '$lib/database/connection'
import type { Opportunity, SalesApiResponse } from '$lib/sales/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 영업 기회 목록 조회
export const GET: RequestHandler = async ({ url }) => {
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
        o.*,
        c.name as customer_name,
        c.type as customer_type
      FROM sales_opportunities o
      LEFT JOIN sales_customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY o.created_at DESC
      `,
      params,
    )

    const response: SalesApiResponse<Opportunity[]> = {
      success: true,
      data: result.rows as Opportunity[],
    }

    return json(response)
  } catch (error) {
    console.error('영업 기회 목록 조회 실패:', error)
    const response: SalesApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '영업 기회 목록을 조회할 수 없습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 새 영업 기회 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json()

    // 필수 필드 검증
    if (!data.title || !data.customer_id || !data.type) {
      const response: SalesApiResponse<null> = {
        success: false,
        error: '제목, 거래처, 타입은 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    // 거래처 존재 확인
    const customerCheck = await query('SELECT id FROM sales_customers WHERE id = $1', [
      data.customer_id,
    ])

    if (customerCheck.rows.length === 0) {
      const response: SalesApiResponse<null> = {
        success: false,
        error: '존재하지 않는 거래처입니다.',
      }
      return json(response, { status: 400 })
    }

    const result = await query(
      `
      INSERT INTO sales_opportunities (
        title, customer_id, type, stage, value, probability, 
        expected_close_date, owner_id, description, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
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

    const response: SalesApiResponse<Opportunity> = {
      success: true,
      data: result.rows[0] as Opportunity,
      message: '영업 기회가 성공적으로 생성되었습니다.',
    }

    return json(response)
  } catch (error) {
    console.error('영업 기회 생성 실패:', error)
    const response: SalesApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '영업 기회 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
