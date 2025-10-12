import { UserService } from '$lib/auth/user-service'
import { buildInsertQuery, mapCustomerData } from '$lib/crm/services/crm-customer-queries'
import { query } from '$lib/database/connection'
import type { BankAccountData, BusinessRegistrationData } from '$lib/services/ocr'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * OCR 데이터로 고객 자동 생성 API
 * POST: OCR 추출 데이터를 받아 고객 생성
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
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
        SELECT id FROM crm_customers 
        WHERE business_number = $1 
        AND business_number != '000-00-00000'
      `
      const checkResult = await query(checkQuery, [businessData.businessNumber])

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

    // OCR 데이터를 표준 형식으로 변환
    const customerData = {
      name: businessData.companyName,
      type: 'customer',
      business_number: businessData.businessNumber,
      contact_person: null, // 담당자는 OCR에서 추출 안됨
      contact_phone: null,
      contact_email: null,
      representative_name: businessData.representativeName, // 대표자 이름 (사업자등록증)
      address: businessData.businessAddress,
      industry: businessData.businessType,
      business_type: businessData.businessType,
      business_category: businessData.businessCategory,
      establishment_date: businessData.establishmentDate,
      corporation_status: businessData.isCorporation,
      bank_name: bankData?.bankName,
      account_number: bankData?.accountNumber,
      account_holder: bankData?.accountHolder,
      business_registration_file_url: businessRegistrationUrl,
      bank_account_file_url: bankAccountUrl,
      ocr_processed_at: new Date().toISOString(),
      ocr_confidence: Math.round((businessData.confidence + (bankData?.confidence || 0)) / 2),
      status: 'active',
    }

    // 고객 생성
    const insertQuery = buildInsertQuery()
    const values = mapCustomerData(customerData)
    const result = await query(insertQuery, values)
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
