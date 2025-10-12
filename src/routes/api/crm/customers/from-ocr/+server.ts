import { verifyToken } from '$lib/auth/middleware'
import { getPool } from '$lib/database/connection'
import type { BankAccountData, BusinessRegistrationData } from '$lib/services/ocr'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * OCR 데이터로 고객 자동 생성 API
 * POST: OCR 추출 데이터를 받아 고객 생성
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  const pool = getPool()
  try {
    // 인증 확인
    const token = cookies.get('token')
    if (!token) {
      return json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessData,
      bankData,
      businessRegistrationUrl,
      bankAccountUrl,
    }: {
      businessData: BusinessRegistrationData
      bankData: BankAccountData
      businessRegistrationUrl?: string
      bankAccountUrl?: string
    } = body

    // 필수 데이터 검증
    if (!businessData || !businessData.companyName) {
      return json({ error: '상호명은 필수입니다' }, { status: 400 })
    }

    // 사업자번호 중복 체크
    if (businessData.businessNumber) {
      const checkQuery = `
        SELECT id FROM sales_customers 
        WHERE business_number = $1 
        AND business_number != '000-00-00000'
      `
      const checkResult = await pool.query(checkQuery, [businessData.businessNumber])

      if (checkResult.rows.length > 0) {
        return json(
          {
            error: '이미 등록된 사업자번호입니다',
            existingCustomerId: checkResult.rows[0].id,
          },
          { status: 409 },
        )
      }
    }

    // 고객 생성
    const insertQuery = `
      INSERT INTO sales_customers (
        name,
        type,
        business_number,
        contact_person,
        contact_phone,
        contact_email,
        address,
        industry,
        representative_name,
        business_address,
        business_type,
        business_category,
        establishment_date,
        is_corporation,
        bank_name,
        account_number,
        account_holder,
        business_registration_file_url,
        bank_account_file_url,
        ocr_processed_at,
        ocr_confidence,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      )
      RETURNING id, name, business_number, created_at
    `

    const values = [
      businessData.companyName, // name
      'customer', // type
      businessData.businessNumber, // business_number
      businessData.representativeName, // contact_person
      null, // contact_phone (OCR에서 추출 안됨)
      null, // contact_email (OCR에서 추출 안됨)
      businessData.businessAddress, // address
      businessData.businessType, // industry
      businessData.representativeName, // representative_name
      businessData.businessAddress, // business_address
      businessData.businessType, // business_type
      businessData.businessCategory, // business_category
      businessData.establishmentDate, // establishment_date
      businessData.isCorporation, // is_corporation
      bankData?.bankName, // bank_name
      bankData?.accountNumber, // account_number
      bankData?.accountHolder, // account_holder
      businessRegistrationUrl, // business_registration_file_url
      bankAccountUrl, // bank_account_file_url
      new Date().toISOString(), // ocr_processed_at
      Math.round((businessData.confidence + (bankData?.confidence || 0)) / 2), // ocr_confidence (평균)
      'active', // status
    ]

    const result = await pool.query(insertQuery, values)
    const newCustomer = result.rows[0]

    return json({
      success: true,
      customer: newCustomer,
      message: '고객이 성공적으로 생성되었습니다',
    })
  } catch (error) {
    console.error('Customer from OCR API error:', error)

    // 사업자번호 중복 에러 (DB 제약조건)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return json(
        {
          error: '이미 등록된 사업자번호입니다',
        },
        { status: 409 },
      )
    }

    return json(
      {
        error: '고객 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}
