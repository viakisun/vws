import { ipService } from '$lib/services/asset/ip-service'
import type { CreateIpDto, IpFilters } from '$lib/types/asset'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/assets/ip - 지식재산권 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const filters: IpFilters = {
      ip_type: searchParams.get('ip_type') || undefined,
      status: searchParams.get('status') || undefined,
      country: searchParams.get('country') || undefined,
      search: searchParams.get('search') || undefined,
      expiry_soon: searchParams.get('expiry_soon') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    const ips = await ipService.list(filters)
    return json({ success: true, data: ips })
  } catch (error) {
    console.error('Failed to fetch intellectual properties:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/assets/ip - 지식재산권 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateIpDto = await request.json()
    const ip = await ipService.create(data)
    return json({ success: true, data: ip }, { status: 201 })
  } catch (error) {
    console.error('Failed to create intellectual property:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}
