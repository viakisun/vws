import { certificationService } from '$lib/services/asset/certification-service'
import type { CertificationFilters, CreateCertificationDto } from '$lib/types/asset'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/assets/certifications - 인증서 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const filters: CertificationFilters = {
      company_id: searchParams.get('company_id') || undefined,
      certification_type: searchParams.get('certification_type') || undefined,
      status: searchParams.get('status') || undefined,
      expiry_soon: searchParams.get('expiry_soon') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    const certifications = await certificationService.list(filters)
    return json({ success: true, data: certifications })
  } catch (error) {
    console.error('Failed to fetch certifications:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/assets/certifications - 인증서 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateCertificationDto = await request.json()
    const certification = await certificationService.create(data)
    return json({ success: true, data: certification }, { status: 201 })
  } catch (error) {
    console.error('Failed to create certification:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}
