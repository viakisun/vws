import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface SchemaValidationResponse {
  message: string
  validationType: string
  todo: string
  status: string
}

export const GET: RequestHandler = ({ url }) => {
  try {
    // TODO: 스키마 검증 로직 구현 예정
    // 현재는 검증 기능이 개발 중이므로 임시로 비활성화

    const validationType = url.searchParams.get('type') || 'all'

    logger.warn('Schema validation API is currently disabled.')

    const data: SchemaValidationResponse = {
      message: '스키마 검증 기능은 현재 개발 중입니다.',
      validationType,
      todo: 'SchemaValidator 구현 필요',
      status: 'development',
    }

    const response: ApiResponse<SchemaValidationResponse> = {
      success: true,
      data,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Schema validation error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '스키마 검증 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}
