import { UserService } from '$lib/auth/user-service'
import type { CRMApiResponse, CRMContract } from '$lib/crm/types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 계약 목록 조회
export const GET: RequestHandler = async ({ url, cookies }) => {
  // 인증 확인
  const token = cookies.get('auth_token')
  if (!token) {
    return json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const userService = UserService.getInstance()
  const payload = userService.verifyToken(token)
  const user = await userService.getUserById(payload.userId)
  if (!user) {
    return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
  }

  try {
    const status = url.searchParams.get('status') || 'all'
    const type = url.searchParams.get('type') || 'all'
    const search = url.searchParams.get('search') || ''

    const whereConditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

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
      whereConditions.push(
        `(title ILIKE $${paramIndex} OR contract_number ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`,
      )
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const result = await query(
      `
      SELECT 
        c.id, c.contract_number, c.title, c.customer_id, c.type, c.status,
        c.start_date::text as start_date, c.end_date::text as end_date,
        c.total_amount, c.paid_amount, c.payment_terms,
        c.description, c.owner_id,
        c.created_at::text as created_at, c.updated_at::text as updated_at,
        cust.name as customer_name,
        cust.type as customer_type
      FROM crm_contracts c
      LEFT JOIN crm_customers cust ON c.customer_id = cust.id
      ${whereClause}
      ORDER BY c.created_at DESC
      `,
      params,
    )

    const response: CRMApiResponse<CRMContract[]> = {
      success: true,
      data: result.rows as CRMContract[],
    }

    return json(response)
  } catch (error) {
    logger.error('계약 목록 조회 실패:', error)
    const response: CRMApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '계약 목록을 조회할 수 없습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 새 계약 생성
export const POST: RequestHandler = async ({ request, cookies }) => {
  // 인증 확인
  const token = cookies.get('auth_token')
  if (!token) {
    return json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const userService = UserService.getInstance()
  const payload = userService.verifyToken(token)
  const user = await userService.getUserById(payload.userId)
  if (!user) {
    return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
  }

  try {
    const data = await request.json()

    // 필수 필드 검증
    if (!data.title || !data.customer_id || !data.type || !data.start_date) {
      const response: CRMApiResponse<null> = {
        success: false,
        error: '제목, 고객, 타입, 시작일은 필수입니다.',
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

    // 계약번호 생성 (자동)
    const contractNumber = `CON-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const result = await query(
      `
      INSERT INTO crm_contracts (
        contract_number, title, customer_id, type, status, start_date, 
        end_date, total_amount, paid_amount, payment_terms, description, owner_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, contract_number, title, customer_id, type, status,
                start_date::text as start_date, end_date::text as end_date,
                total_amount, paid_amount, payment_terms, description,
                owner_id, created_at::text as created_at, updated_at::text as updated_at
      `,
      [
        contractNumber,
        data.title,
        data.customer_id,
        data.type,
        data.status || 'active',
        data.start_date,
        data.end_date || null,
        data.total_amount || 0,
        data.paid_amount || 0,
        data.payment_terms || 30,
        data.description || null,
        data.owner_id || null,
      ],
    )

    const response: CRMApiResponse<CRMContract> = {
      success: true,
      data: result.rows[0] as CRMContract,
      message: '계약이 성공적으로 생성되었습니다.',
    }

    return json(response)
  } catch (error) {
    logger.error('계약 생성 실패:', error)
    const response: CRMApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '계약 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
