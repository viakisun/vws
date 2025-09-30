import { query } from '$lib/database/connection'
import type { Customer, SalesApiResponse } from '$lib/sales/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 거래처 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const type = url.searchParams.get('type') || 'all'
    const status = url.searchParams.get('status') || 'all'
    const search = url.searchParams.get('search') || ''

    let whereConditions: string[] = []
    let params: (string | number)[] = []
    let paramIndex = 1

    if (type !== 'all') {
      whereConditions.push(`type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    if (status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR contact_person ILIKE $${paramIndex} OR industry ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const result = await query(
      `
      SELECT * FROM sales_customers 
      ${whereClause}
      ORDER BY created_at DESC
      `,
      params
    )

    const response: SalesApiResponse<Customer[]> = {
      success: true,
      data: result.rows as Customer[],
    }

    return json(response)
  } catch (error) {
    console.error('거래처 목록 조회 실패:', error)
    const response: SalesApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '거래처 목록을 조회할 수 없습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 새 거래처 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json()

    // 필수 필드 검증
    if (!data.name || !data.business_number) {
      const response: SalesApiResponse<null> = {
        success: false,
        error: '회사명과 사업자번호는 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    const result = await query(
      `
      INSERT INTO sales_customers (
        name, type, business_number, contact_person, contact_phone, 
        contact_email, address, industry, payment_terms, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [
        data.name,
        data.type || 'customer',
        data.business_number,
        data.contact_person || null,
        data.contact_phone || null,
        data.contact_email || null,
        data.address || null,
        data.industry || null,
        data.payment_terms || 30,
        data.status || 'active',
        data.notes || null,
      ]
    )

    const response: SalesApiResponse<Customer> = {
      success: true,
      data: result.rows[0] as Customer,
      message: '거래처가 성공적으로 생성되었습니다.',
    }

    return json(response)
  } catch (error) {
    console.error('거래처 생성 실패:', error)
    const response: SalesApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '거래처 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
