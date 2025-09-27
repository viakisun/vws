import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request: _request }) => {
  // TODO: 급여명세서 엑셀 업로드 기능 구현 필요
  // 현재 ExcelJS 타입 오류로 인해 임시 비활성화
  logger.warn('Payslip Excel upload functionality is currently disabled.')

  const response: ApiResponse<null> = {
    success: false,
    error: '급여명세서 엑셀 업로드 기능은 현재 개발 중입니다. 추후 구현 예정입니다.',
  }

  return json(response, { status: 501 })
}
