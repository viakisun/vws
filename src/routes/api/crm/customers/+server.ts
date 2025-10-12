import type { CRMApiResponse, CRMCustomer } from '$lib/crm/types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 고객 목록 조회
export const GET: RequestHandler = async ({ url }) => {
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

    const result = await query(
      `
      SELECT id, name, type, business_number, contact_person, contact_phone,
             contact_email, address, industry, payment_terms, status, notes,
             business_registration_file_url, bank_account_file_url,
             representative_name, establishment_date, corporation_status,
             business_type, business_category, bank_name, account_number,
             account_holder, ocr_processed_at, ocr_confidence,
             created_at::text as created_at, updated_at::text as updated_at
      FROM crm_customers 
      ${whereClause}
      ORDER BY created_at DESC
      `,
      params,
    )

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
export const POST: RequestHandler = async ({ request }) => {
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

    const result = await query(
      `
      INSERT INTO crm_customers (
        name, type, business_number, contact_person, contact_phone, 
        contact_email, address, industry, payment_terms, status, notes,
        business_registration_file_url, bank_account_file_url,
        representative_name, establishment_date, corporation_status,
        business_type, business_category, bank_name, account_number,
        account_holder, ocr_processed_at, ocr_confidence
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING id, name, type, business_number, contact_person, contact_phone,
                contact_email, address, industry, payment_terms, status, notes,
                business_registration_file_url, bank_account_file_url,
                representative_name, establishment_date, corporation_status,
                business_type, business_category, bank_name, account_number,
                account_holder, ocr_processed_at, ocr_confidence,
                created_at::text, updated_at::text
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
        data.business_registration_file_url || null,
        data.bank_account_file_url || null,
        data.representative_name || null,
        data.establishment_date || null,
        data.corporation_status || null,
        data.business_type || null,
        data.business_category || null,
        data.bank_name || null,
        data.account_number || null,
        data.account_holder || null,
        data.ocr_processed_at || null,
        data.ocr_confidence || null,
      ],
    )

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

