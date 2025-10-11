import { companyService } from '$lib/services/company/company-service'
import type { DatabaseCompany } from '$lib/types'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface CompanyQueryParams {
  business_type?: string
  limit?: number
  offset?: number
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

// GET /api/companies - Get all companies
export const GET: RequestHandler = async ({ url }) => {
  try {
    const business_type = url.searchParams.get('business_type')
    const limit = url.searchParams.get('limit')
    const offset = url.searchParams.get('offset')

    const queryParams: CompanyQueryParams = {
      business_type: business_type || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    }

    const companies = await companyService.list(queryParams)

    const response: ApiResponse<DatabaseCompany[]> = {
      success: true,
      data: companies,
      count: companies.length,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Get companies error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '회사 목록 조회 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// POST /api/companies - Create new company
export const POST: RequestHandler = async ({ request }) => {
  try {
    const companyData = (await request.json()) as CreateCompanyRequest

    // Validate required fields
    if (!companyData.name) {
      const response: ApiResponse<null> = {
        success: false,
        error: '회사명은 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    // Check if company name already exists
    const existingCompany = await companyService.getByName(companyData.name)

    if (existingCompany) {
      const response: ApiResponse<null> = {
        success: false,
        error: '이미 존재하는 회사명입니다.',
      }
      return json(response, { status: 400 })
    }

    const company = await companyService.create(companyData)

    const response: ApiResponse<DatabaseCompany> = {
      success: true,
      data: company,
    }

    return json(response, { status: 201 })
  } catch (error: unknown) {
    logger.error('Create company error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '회사 생성 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}
