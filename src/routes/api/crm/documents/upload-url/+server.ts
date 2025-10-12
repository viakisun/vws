import { verifyToken } from '$lib/auth/middleware'
import { generateCrmDocumentUploadUrl } from '$lib/services/s3/s3-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * CRM 문서 업로드 URL 생성 API
 * POST: Presigned URL 생성
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // 인증 확인
    const token = cookies.get('token')
    if (!token) {
      return json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, documentType, filename, contentType } = body

    // 필수 파라미터 검증
    if (!customerId || !documentType || !filename || !contentType) {
      return json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    if (!['business-registration', 'bank-account'].includes(documentType)) {
      return json({ error: '유효하지 않은 문서 타입입니다' }, { status: 400 })
    }

    // 회사 코드 (하드코딩 - 추후 시스템에서 가져오기)
    const companyCode = '1001'

    // Presigned URL 생성
    const { url, key } = await generateCrmDocumentUploadUrl(
      companyCode,
      customerId,
      documentType as 'business-registration' | 'bank-account',
      filename,
      contentType
    )

    return json({
      success: true,
      uploadUrl: url,
      key,
    })
  } catch (error) {
    console.error('Document upload URL API error:', error)
    return json(
      {
        error: '업로드 URL 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

