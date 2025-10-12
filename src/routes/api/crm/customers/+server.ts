import { UserService } from '$lib/auth/user-service'
import {
  buildInsertQuery,
  mapCustomerData,
  SELECT_QUERY,
} from '$lib/crm/services/crm-customer-queries'
import type { CRMApiResponse, CRMCustomer } from '$lib/crm/types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 고객 목록 조회
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
    const type = url.searchParams.get('type') || 'all'
    const status = url.searchParams.get('status') || 'all'
    const search = url.searchParams.get('search') || ''

    const whereConditions: string[] = []
    const params: (string | number)[] = []
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
      whereConditions.push(
        `(name ILIKE $${paramIndex} OR contact_person ILIKE $${paramIndex} OR industry ILIKE $${paramIndex})`,
      )
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const result = await query(`${SELECT_QUERY} ${whereClause} ORDER BY created_at DESC`, params)

    const response: CRMApiResponse<CRMCustomer[]> = {
      success: true,
      data: result.rows as CRMCustomer[],
    }

    return json(response)
  } catch (error) {
    logger.error('고객 목록 조회 실패:', error)
    const response: CRMApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '고객 목록을 조회할 수 없습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 새 고객 생성
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
    if (!data.name || !data.business_number) {
      const response: CRMApiResponse<null> = {
        success: false,
        error: '회사명과 사업자번호는 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    const insertQuery = buildInsertQuery()
    const values = mapCustomerData(data)
    const result = await query(insertQuery, values)

    const response: CRMApiResponse<CRMCustomer> = {
      success: true,
      data: result.rows[0] as CRMCustomer,
      message: '고객이 성공적으로 생성되었습니다.',
    }

    return json(response)
  } catch (error) {
    logger.error('고객 생성 실패:', error)
    const response: CRMApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '고객 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
