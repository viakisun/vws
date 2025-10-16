import { assetRequestService } from '$lib/services/asset/asset-request-service'
import type { AssetRequestFilters, CreateAssetRequestDto } from '$lib/types/asset'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/assets/requests - 자산 신청 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const filters: AssetRequestFilters = {
      requester_id: searchParams.get('requester_id') || undefined,
      status: searchParams.get('status') || undefined,
      request_type: searchParams.get('request_type') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    const requests = await assetRequestService.list(filters)
    return json({ success: true, data: requests })
  } catch (error) {
    console.error('Failed to fetch asset requests:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/assets/requests - 자산 신청 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateAssetRequestDto = await request.json()

    // TODO: 실제 구현 시 사용자 ID를 세션에서 가져와야 함
    const requesterId = 'temp-user-id' // 임시 값

    // 차량 예약인 경우 중복 확인
    if (
      data.request_type === 'vehicle_reservation' &&
      data.asset_id &&
      data.start_datetime &&
      data.end_datetime
    ) {
      const isAvailable = await assetRequestService.checkVehicleAvailability(
        data.asset_id,
        data.start_datetime,
        data.end_datetime,
      )
      if (!isAvailable) {
        return json(
          { success: false, error: '선택한 시간에 이미 예약된 차량입니다.' },
          { status: 400 },
        )
      }
    }

    const request_result = await assetRequestService.createRequest(data, requesterId)
    return json({ success: true, data: request_result }, { status: 201 })
  } catch (error) {
    console.error('Failed to create asset request:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}
