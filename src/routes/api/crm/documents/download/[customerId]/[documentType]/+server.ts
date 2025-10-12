import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { generatePresignedDownloadUrl } from '$lib/services/s3/s3-service'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface DocumentDownloadResponse {
  downloadUrl: string
  fileName: string
  expiresIn: number
}

/**
 * CRM 문서 다운로드 API
 * GET: Presigned Download URL 생성 (Path params)
 */
export const GET: RequestHandler = async (event) => {
  try {
    await requireAuth(event)
    const { customerId, documentType } = event.params

    // 문서 타입 검증
    if (!['business-registration', 'bank-account'].includes(documentType)) {
      return json<ApiResponse<never>>(
        {
          success: false,
          error: '유효하지 않은 문서 타입입니다',
        },
        { status: 400 },
      )
    }

    // DB에서 s3Key 조회
    const s3KeyColumn =
      documentType === 'business-registration'
        ? 'business_registration_s3_key'
        : 'bank_account_s3_key'

    const result = await query(`SELECT ${s3KeyColumn} as s3_key FROM crm_customers WHERE id = $1`, [
      customerId,
    ])

    if (result.rows.length === 0) {
      return json<ApiResponse<never>>(
        {
          success: false,
          error: '고객을 찾을 수 없습니다',
        },
        { status: 404 },
      )
    }

    const s3Key = result.rows[0].s3_key

    if (!s3Key) {
      return json<ApiResponse<never>>(
        {
          success: false,
          error: '파일이 존재하지 않습니다',
        },
        { status: 404 },
      )
    }

    // Presigned Download URL 생성 (5분간 유효)
    const downloadUrl = await generatePresignedDownloadUrl(s3Key, 300)

    // 파일명 추출 (s3Key에서)
    const fileName = s3Key.split('/').pop() || `${documentType}.pdf`

    logger.log('CRM document download URL generated', {
      customerId,
      documentType,
      fileName,
    })

    const response: ApiResponse<DocumentDownloadResponse> = {
      success: true,
      data: {
        downloadUrl,
        fileName,
        expiresIn: 300,
      },
    }

    return json(response)
  } catch (error) {
    logger.error('Failed to generate CRM document download URL:', error)
    return json<ApiResponse<never>>(
      {
        success: false,
        error: '다운로드 URL 생성에 실패했습니다',
      },
      { status: 500 },
    )
  }
}
