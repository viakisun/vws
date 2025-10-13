/**
 * CRM S3 Service
 * CRM 고객 문서의 S3 파일 업로드/다운로드
 *
 * 특징:
 * - 메타데이터 저장 없음 (고객 정보 수정 시 s3Key 직접 저장)
 * - 문서당 하나씩 (사업자등록증 1개, 통장사본 1개)
 */

import { CrmDocumentType } from '$lib/constants/crm'
import { logger } from '$lib/utils/logger'
import { downloadFromS3Core, uploadToS3Core } from './s3-core'

// ============================================================================
// Upload
// ============================================================================

/**
 * CRM 고객 문서 업로드 (메타데이터 저장 없음)
 *
 * 프로세스:
 * - S3 업로드만 수행 (0-100%)
 * - s3Key를 반환하여 호출자가 고객 정보 저장 시 사용
 *
 * @param companyCode - 회사 코드 (예: '1001')
 * @param customerId - 고객 ID
 * @param documentType - 문서 타입
 * @param file - 업로드할 파일
 * @param onProgress - 진행률 콜백 (0-100%)
 * @returns s3Key
 */
export async function uploadCrmDocument(
  companyCode: string,
  customerId: string,
  documentType: CrmDocumentType,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<{ s3Key: string }> {
  try {
    const result = await uploadToS3Core({
      file,
      presignedUrlEndpoint: '/api/crm/documents/upload-url',
      presignedUrlParams: {
        companyCode,
        customerId,
        documentType,
        filename: file.name,
        contentType: file.type,
      },
      onProgress,
    })

    logger.log('[CRMS3] Document uploaded', {
      companyCode,
      customerId,
      documentType,
      s3Key: result.s3Key,
    })

    return { s3Key: result.s3Key }
  } catch (error) {
    logger.error('[CRMS3] Upload failed', error)
    throw error
  }
}

// ============================================================================
// Download
// ============================================================================

/**
 * CRM 고객 문서 다운로드
 *
 * @param customerId - 고객 ID
 * @param documentType - 문서 타입
 */
export async function downloadCrmDocument(
  customerId: string,
  documentType: CrmDocumentType,
): Promise<void> {
  return downloadFromS3Core({
    downloadUrlEndpoint: `/api/crm/documents/download/${customerId}/${documentType}`,
    openInNewTab: true,
  })
}

// ============================================================================
// Delete
// ============================================================================

/**
 * CRM 고객 문서 삭제
 *
 * @param customerId - 고객 ID
 * @param documentType - 문서 타입
 */
export async function deleteCrmDocument(
  customerId: string,
  documentType: CrmDocumentType,
): Promise<void> {
  try {
    const response = await fetch(`/api/crm/documents/delete/${customerId}/${documentType}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '문서 삭제 실패')
    }

    logger.log('[CRMS3] Document deleted', {
      customerId,
      documentType,
    })
  } catch (error) {
    logger.error('[CRMS3] Delete failed', error)
    throw error
  }
}
