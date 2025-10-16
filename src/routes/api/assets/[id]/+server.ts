import { assetService } from '$lib/services/asset/asset-service'
import type { UpdateAssetDto } from '$lib/types/asset'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/assets/[id] - 특정 자산 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const asset = await assetService.getById(params.id)
    if (!asset) {
      return json({ success: false, error: '자산을 찾을 수 없습니다.' }, { status: 404 })
    }
    return json({ success: true, data: asset })
  } catch (error) {
    console.error('Failed to fetch asset:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT /api/assets/[id] - 자산 업데이트
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data: UpdateAssetDto = await request.json()

    // 자산 코드 중복 확인 (자기 자신 제외)
    if (data.asset_code) {
      const isDuplicate = await assetService.isAssetCodeExists(data.asset_code, params.id)
      if (isDuplicate) {
        return json({ success: false, error: '이미 존재하는 자산 코드입니다.' }, { status: 400 })
      }
    }

    const asset = await assetService.update(params.id, data)
    return json({ success: true, data: asset })
  } catch (error) {
    console.error('Failed to update asset:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE /api/assets/[id] - 자산 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    await assetService.delete(params.id)
    return json({ success: true, message: '자산이 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete asset:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}
