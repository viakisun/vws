import { UserService } from '$lib/auth/user-service'
import { query } from '$lib/database/connection'
import { generatePresignedDownloadUrl } from '$lib/services/s3/s3-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * CRM 문서 다운로드 API
 * GET: Presigned Download URL 생성
 * Query params: customerId, documentType
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    // 인증 확인
    const token = cookies.get('auth_token')
    if (!token) {
      return json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const userService = UserService.getInstance()
    const payload = userService.verifyToken(token)
    const user = await userService.getUserById(payload.userId)
    if (!user) {
      return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
    }

    const customerId = url.searchParams.get('customerId')
    const documentType = url.searchParams.get('documentType')

    if (!customerId || !documentType) {
      return json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    if (!['business-registration', 'bank-account'].includes(documentType)) {
      return json({ error: '유효하지 않은 문서 타입입니다' }, { status: 400 })
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
      return json({ error: '고객을 찾을 수 없습니다' }, { status: 404 })
    }

    const s3Key = result.rows[0].s3_key

    if (!s3Key) {
      return json({ error: '파일이 존재하지 않습니다' }, { status: 404 })
    }

    // Presigned Download URL 생성 (5분간 유효)
    const downloadUrl = await generatePresignedDownloadUrl(s3Key, 300)

    return json({
      success: true,
      downloadUrl,
      expiresIn: 300,
    })
  } catch (error) {
    console.error('CRM document download API error:', error)
    return json(
      {
        error: '다운로드 URL 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}
