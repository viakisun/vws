import { DatabaseService } from '$lib/database/connection'
import type { DatabaseCompany } from '$lib/types'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface CompanyQueryParams {
  type?: string
  status?: string
  industry?: string
  limit?: number
  offset?: number
}

interface CreateCompanyRequest {
  name: string
  type: string
  status?: string
  industry?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  description?: string
}

// GET /api/companies - Get all companies
export const GET: RequestHandler = async ({ url }) => {
  try {
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const industry = url.searchParams.get('industry')
    const limit = url.searchParams.get('limit')
    const offset = url.searchParams.get('offset')

    const queryParams: CompanyQueryParams = {
      type: type || undefined,
      status: status || undefined,
      industry: industry || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    }

    const companies = await DatabaseService.getCompanies(queryParams)

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
    if (!companyData.name || !companyData.type) {
      const response: ApiResponse<null> = {
        success: false,
        error: '회사명과 유형은 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    // Check if company name already exists
    const existingCompany = await DatabaseService.query(
      'SELECT id FROM companies WHERE name = $1',
      [companyData.name],
    )

    if (existingCompany.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: '이미 존재하는 회사명입니다.',
      }
      return json(response, { status: 400 })
    }

    const company = await DatabaseService.createCompany(companyData as Partial<DatabaseCompany>)

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
