import { assetService } from '$lib/services/asset/asset-service'
import type { AssetFilters, CreateAssetDto } from '$lib/types/asset'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/assets - 자산 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const filters: AssetFilters = {
      category_id: searchParams.get('category_id') || undefined,
      status: searchParams.get('status') || undefined,
      condition: searchParams.get('condition') || undefined,
      location: searchParams.get('location') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    const assets = await assetService.list(filters)
    return json({ success: true, data: assets })
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/assets - 자산 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateAssetDto = await request.json()

    // 자산 코드 중복 확인
    const isDuplicate = await assetService.isAssetCodeExists(data.asset_code)
    if (isDuplicate) {
      return json({ success: false, error: '이미 존재하는 자산 코드입니다.' }, { status: 400 })
    }

    const asset = await assetService.create(data)
    return json({ success: true, data: asset }, { status: 201 })
  } catch (error) {
    console.error('Failed to create asset:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}
