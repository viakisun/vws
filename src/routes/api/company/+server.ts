import { query } from '$lib/database/connection.js'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface CompanyInfo {
  id: string
  name: string
  establishment_date?: string
  ceo_name?: string
  business_type?: string
  address?: string
  phone?: string
  fax?: string
  email?: string
  website?: string
  registration_number?: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

interface CreateCompanyRequest {
  name: string
  establishment_date?: string
  ceo_name?: string
  business_type?: string
  address?: string
  phone?: string
  fax?: string
  email?: string
  website?: string
  registration_number?: string
}

// GET /api/company - 회사 정보 조회
export const GET: RequestHandler = async () => {
  try {
    const result = await query<CompanyInfo>(`
			SELECT 
				id, name, establishment_date, ceo_name, business_type,
				address, phone, fax, email, website, registration_number,
				created_at, updated_at
			FROM companies 
			ORDER BY created_at DESC
			LIMIT 1
		`)

    const company = result.rows.length > 0 ? result.rows[0] : null

    const response: ApiResponse<CompanyInfo | null> = {
      success: true,
      data: company,
      message: company ? '회사 정보를 성공적으로 조회했습니다.' : '등록된 회사 정보가 없습니다.',
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error fetching company:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '회사 정보 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// POST /api/company - 회사 정보 등록/수정
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json() as CreateCompanyRequest

    // 필수 필드 검증
    if (!data.name) {
      return json(
        {
          success: false,
          error: '회사명은 필수입니다.',
        },
        { status: 400 },
      )
    }

    // 기존 회사 정보가 있는지 확인
    const existingResult = await query<{ id: string }>('SELECT id FROM companies LIMIT 1')
    const existingCompany = existingResult.rows.length > 0

    let result: { rows: CompanyInfo[] }
    if (existingCompany) {
      // 기존 회사 정보 업데이트
      result = await query<CompanyInfo>(
        `
				UPDATE companies SET
					name = $1,
					establishment_date = $2,
					ceo_name = $3,
					business_type = $4,
					address = $5,
					phone = $6,
					fax = $7,
					email = $8,
					website = $9,
					registration_number = $10,
					updated_at = $11
				WHERE id = (SELECT id FROM companies LIMIT 1)
				RETURNING id, name, establishment_date, ceo_name, business_type,
					address, phone, fax, email, website, registration_number,
					created_at, updated_at
			`,
        [
          data.name,
          data.establishment_date || null,
          data.ceo_name || null,
          data.business_type || null,
          data.address || null,
          data.phone || null,
          data.fax || null,
          data.email || null,
          data.website || null,
          data.registration_number || null,
          new Date(),
        ],
      )
    } else {
      // 새 회사 정보 등록
      result = await query<CompanyInfo>(
        `
				INSERT INTO companies (
					name, establishment_date, ceo_name, business_type,
					address, phone, fax, email, website, registration_number,
					created_at, updated_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
				RETURNING id, name, establishment_date, ceo_name, business_type,
					address, phone, fax, email, website, registration_number,
					created_at, updated_at
			`,
        [
          data.name,
          data.establishment_date || null,
          data.ceo_name || null,
          data.business_type || null,
          data.address || null,
          data.phone || null,
          data.fax || null,
          data.email || null,
          data.website || null,
          data.registration_number || null,
          new Date(),
          new Date(),
        ],
      )
    }

    const response: ApiResponse<CompanyInfo> = {
      success: true,
      data: result.rows[0],
      message: existingCompany
        ? '회사 정보가 성공적으로 수정되었습니다.'
        : '회사 정보가 성공적으로 등록되었습니다.',
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error saving company:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '회사 정보 저장에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
