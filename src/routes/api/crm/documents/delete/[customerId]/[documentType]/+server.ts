import { CrmDocumentType } from '$lib/constants/crm'
import { query } from '$lib/database/connection'
import { getS3BucketName, getS3Client } from '$lib/services/s3/s3-client'
import { logger } from '$lib/utils/logger'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * DELETE /api/crm/documents/delete/[customerId]/[documentType]
 * CRM 고객 문서 삭제 (S3 파일 삭제)
 */
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { customerId, documentType } = params

    // 문서 타입 검증
    if (
      documentType !== CrmDocumentType.BUSINESS_REGISTRATION &&
      documentType !== CrmDocumentType.BANK_ACCOUNT
    ) {
      return json({ error: '유효하지 않은 문서 타입입니다' }, { status: 400 })
    }

    // 고객 정보에서 S3 키 조회
    const s3KeyColumn =
      documentType === CrmDocumentType.BUSINESS_REGISTRATION
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
      return json({ error: '삭제할 문서가 없습니다' }, { status: 404 })
    }

    // S3에서 파일 삭제
    const s3Client = getS3Client()
    const bucketName = getS3BucketName()

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      }),
    )

    logger.log('[CRM] Document deleted from S3', { customerId, documentType, s3Key })

    return json({
      success: true,
      message: '문서가 삭제되었습니다',
    })
  } catch (error) {
    logger.error('[CRM] Document delete error:', error)
    return json(
      {
        error: '문서 삭제 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}
