import { env } from '$env/dynamic/private'
import { UserService } from '$lib/auth/user-service'
import { CrmDocumentType, DEFAULT_COMPANY_CODE } from '$lib/constants/crm'
import { generateCrmDocumentUploadUrl } from '$lib/services/s3/s3-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * CRM 문서 업로드 URL 생성 API
 * POST: Presigned URL 생성
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  console.log('=== CRM Document Upload URL API ===')
  console.log('Timestamp:', new Date().toISOString())

  try {
    // 인증 확인
    const token = cookies.get('auth_token')
    if (!token) {
      console.log('❌ No auth token')
      return json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const userService = UserService.getInstance()
    const payload = userService.verifyToken(token)
    const user = await userService.getUserById(payload.userId)
    if (!user) {
      console.log('❌ Invalid token')
      return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
    }

    console.log('✓ User authenticated:', user.email)

    const body = await request.json()
    const { customerId, documentType, filename, contentType } = body

    console.log('Request params:')
    console.log('- customerId:', customerId)
    console.log('- documentType:', documentType)
    console.log('- filename:', filename)
    console.log('- contentType:', contentType)

    // 필수 파라미터 검증
    if (!customerId || !documentType || !filename || !contentType) {
      console.log('❌ Missing required parameters')
      return json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    if (!Object.values(CrmDocumentType).includes(documentType as CrmDocumentType)) {
      console.log('❌ Invalid document type')
      return json({ error: '유효하지 않은 문서 타입입니다' }, { status: 400 })
    }

    const companyCode = DEFAULT_COMPANY_CODE
    console.log('Company code:', companyCode)

    console.log('Calling generateCrmDocumentUploadUrl...')
    const { url, key } = await generateCrmDocumentUploadUrl(
      companyCode,
      customerId,
      documentType as CrmDocumentType,
      filename,
      contentType,
    )
    console.log('✓ Presigned URL generated')
    console.log('- Key:', key)

    const bucketName = env.AWS_S3_BUCKET_NAME
    const region = env.AWS_S3_REGION || 'ap-northeast-2'
    const finalUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`

    console.log('✓ Success')
    console.log('===================================')

    return json({
      success: true,
      url, // Presigned URL (업로드용)
      key, // S3 키
      finalUrl, // 최종 접근 URL (DB 저장용)
    })
  } catch (error) {
    console.error('❌ Document upload URL API error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })
    console.log('===================================')

    return json(
      {
        error: '업로드 URL 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}
