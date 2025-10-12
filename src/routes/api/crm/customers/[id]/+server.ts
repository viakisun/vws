import { UserService } from '$lib/auth/user-service'
import {
  buildUpdateQuery,
  mapCustomerData,
  SELECT_QUERY,
} from '$lib/crm/services/crm-customer-queries'
import type { CRMApiResponse, CRMCustomer } from '$lib/crm/types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 개별 고객 조회
export const GET: RequestHandler = async ({ params, cookies }) => {
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
    const { id } = params

    const result = await query(`${SELECT_QUERY} WHERE id = $1`, [id])

    if (result.rows.length === 0) {
      const response: CRMApiResponse<null> = {
        success: false,
        error: '고객을 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    const response: CRMApiResponse<CRMCustomer> = {
      success: true,
      data: result.rows[0] as CRMCustomer,
    }

    return json(response)
  } catch (error) {
    logger.error('고객 조회 실패:', error)
    const response: CRMApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '고객을 조회할 수 없습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 고객 수정
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
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
    const { id } = params
    const data = await request.json()

    // 필수 필드 검증
    if (!data.name || !data.business_number) {
      const response: CRMApiResponse<null> = {
        success: false,
        error: '회사명과 사업자번호는 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    const updateQuery = buildUpdateQuery()
    const values = [...mapCustomerData(data), id] // id는 마지막 파라미터
    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      const response: CRMApiResponse<null> = {
        success: false,
        error: '고객을 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    const response: CRMApiResponse<CRMCustomer> = {
      success: true,
      data: result.rows[0] as CRMCustomer,
      message: '고객 정보가 성공적으로 수정되었습니다.',
    }

    return json(response)
  } catch (error) {
    logger.error('고객 수정 실패:', error)
    const response: CRMApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '고객 수정에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 고객 삭제
export const DELETE: RequestHandler = async ({ params, cookies }) => {
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
    const { id } = params

    // 관련 데이터 확인 (계약, 거래내역 등)
    const contractCheck = await query(
      'SELECT COUNT(*) as count FROM crm_contracts WHERE customer_id = $1',
      [id],
    )

    const transactionCheck = await query(
      'SELECT COUNT(*) as count FROM crm_transactions WHERE customer_id = $1',
      [id],
    )

    if (parseInt(contractCheck.rows[0].count) > 0 || parseInt(transactionCheck.rows[0].count) > 0) {
      const response: CRMApiResponse<null> = {
        success: false,
        error:
          '관련 계약이나 거래내역이 있는 고객은 삭제할 수 없습니다. 상태를 비활성으로 변경하세요.',
      }
      return json(response, { status: 400 })
    }

    const result = await query(
      `DELETE FROM crm_customers WHERE id = $1 
       RETURNING id, name, type, business_number, contact_person, contact_phone,
                 contact_email, address, industry, payment_terms, status, notes,
                 business_registration_file_url, bank_account_file_url,
                 business_registration_s3_key, bank_account_s3_key,
                 representative_name, establishment_date, corporation_status,
                 business_type, business_category, bank_name, account_number,
                 account_holder, ocr_processed_at, ocr_confidence,
                 created_at::text, updated_at::text`,
      [id],
    )

    if (result.rows.length === 0) {
      const response: CRMApiResponse<null> = {
        success: false,
        error: '고객을 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    const response: CRMApiResponse<null> = {
      success: true,
      message: '고객이 성공적으로 삭제되었습니다.',
    }

    return json(response)
  } catch (error) {
    logger.error('고객 삭제 실패:', error)
    const response: CRMApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '고객 삭제에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
