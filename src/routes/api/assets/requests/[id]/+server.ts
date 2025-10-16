import { assetRequestService } from '$lib/services/asset/asset-request-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/assets/requests/[id] - 자산 신청 상세 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const request = await assetRequestService.getById(params.id)
    if (!request) {
      return json({ success: false, error: '신청을 찾을 수 없습니다.' }, { status: 404 })
    }
    return json({ success: true, data: request })
  } catch (error) {
    console.error('Failed to fetch asset request:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/assets/requests/[id]/approve - 자산 신청 승인
export const POST: RequestHandler = async ({ params, url, request }) => {
  try {
    const action = url.searchParams.get('action')

    if (action === 'approve') {
      // TODO: 실제 구현 시 승인자 ID를 세션에서 가져와야 함
      const approverId = 'temp-approver-id' // 임시 값
      await assetRequestService.approveRequest(params.id, approverId)
      return json({ success: true, message: '신청이 승인되었습니다.' })
    } else if (action === 'reject') {
      const { reason } = await request.json()
      // TODO: 실제 구현 시 승인자 ID를 세션에서 가져와야 함
      const approverId = 'temp-approver-id' // 임시 값
      await assetRequestService.rejectRequest(params.id, approverId, reason)
      return json({ success: true, message: '신청이 거부되었습니다.' })
    } else if (action === 'cancel') {
      // TODO: 실제 구현 시 신청자 ID를 세션에서 가져와야 함
      const requesterId = 'temp-user-id' // 임시 값
      await assetRequestService.cancelRequest(params.id, requesterId)
      return json({ success: true, message: '신청이 취소되었습니다.' })
    } else {
      return json({ success: false, error: '잘못된 액션입니다.' }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to process asset request:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}
