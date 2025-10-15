/**
 * Planner S3 Service
 * 플래너 제품 레퍼런스 도메인의 S3 파일 업로드/다운로드/삭제
 *
 * 특징:
 * - 메타데이터를 planner_product_references 테이블에 저장
 * - 제품별로 레퍼런스 파일 관리
 * - S3 키 형식: {companyCode}/planner/products/{productId}/references/{timestamp}_{filename}
 */

import { DEFAULT_COMPANY_CODE } from '$lib/constants/crm'
import { sanitizeFilename } from '$lib/utils/file-validation'
import { logger } from '$lib/utils/logger'
import { downloadFromS3Core, uploadToS3Core } from './s3-core'

// ============================================================================
// S3 Key Generation
// ============================================================================

/**
 * 플래너 제품 레퍼런스용 S3 키 생성
 * 형식: {companyCode}/planner/products/{productId}/references/{timestamp}_{filename}
 */
export function generateProductReferenceS3Key(
  productId: string,
  filename: string,
  companyCode: string = DEFAULT_COMPANY_CODE,
): string {
  const timestamp = Date.now()
  const sanitized = sanitizeFilename(filename)
  return `${companyCode}/planner/products/${productId}/references/${timestamp}_${sanitized}`
}

// ============================================================================
// Upload
// ============================================================================

/**
 * 제품 레퍼런스 파일 업로드 (메타데이터 저장 포함)
 *
 * 프로세스:
 * 1. S3 업로드 (0-70%)
 * 2. 메타데이터 저장 (70-100%)
 *
 * @param productId - 제품 ID
 * @param file - 업로드할 파일
 * @param title - 레퍼런스 제목
 * @param description - 레퍼런스 설명 (선택)
 * @param onProgress - 진행률 콜백 (0-100%)
 * @returns s3Key와 저장된 referenceId
 */
export async function uploadProductReference(
  productId: string,
  file: File,
  title: string,
  description?: string,
  onProgress?: (progress: number) => void,
): Promise<{ s3Key: string; referenceId?: string }> {
  try {
    // Step 1: S3 업로드 (0-70%)
    const result = await uploadToS3Core({
      file,
      presignedUrlEndpoint: `/api/planner/products/${productId}/references/upload-url`,
      presignedUrlParams: {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
      },
      onProgress: (p) => onProgress?.(p * 0.7),
    })

    // Step 2: 메타데이터 저장 (70-100%)
    onProgress?.(70)

    const metadataResponse = await fetch(`/api/planner/products/${productId}/references`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        type: 'file',
        s3_key: result.s3Key,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
      }),
      credentials: 'include',
    })

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json().catch(() => ({}))
      throw new Error(errorData.error || '메타데이터 저장 실패')
    }

    const metadataResult = await metadataResponse.json()
    onProgress?.(100)

    logger.log('[PlannerS3] Product reference uploaded and metadata saved', {
      productId,
      s3Key: result.s3Key,
      referenceId: metadataResult.data?.id,
    })

    return {
      s3Key: result.s3Key,
      referenceId: metadataResult.data?.id,
    }
  } catch (error) {
    logger.error('[PlannerS3] Upload failed', error)
    throw error
  }
}

/**
 * 제품 레퍼런스 URL 생성 (파일 업로드 없이 링크만 추가)
 *
 * @param productId - 제품 ID
 * @param url - 링크 URL
 * @param title - 레퍼런스 제목
 * @param description - 레퍼런스 설명 (선택)
 * @param type - 레퍼런스 타입 (자동 감지되지 않은 경우)
 * @returns 저장된 referenceId
 */
export async function createProductReferenceUrl(
  productId: string,
  url: string,
  title: string,
  description?: string,
  type?: string,
): Promise<{ referenceId?: string }> {
  try {
    const response = await fetch(`/api/planner/products/${productId}/references`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        type: type || 'url',
        url,
      }),
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '레퍼런스 생성 실패')
    }

    const result = await response.json()

    logger.log('[PlannerS3] Product reference URL created', {
      productId,
      url,
      referenceId: result.data?.id,
    })

    return {
      referenceId: result.data?.id,
    }
  } catch (error) {
    logger.error('[PlannerS3] Create reference URL failed', error)
    throw error
  }
}

// ============================================================================
// Download
// ============================================================================

/**
 * 제품 레퍼런스 파일 다운로드
 *
 * @param productId - 제품 ID
 * @param referenceId - 레퍼런스 ID
 * @param openInNewTab - 새 탭에서 열지 여부
 */
export async function downloadProductReference(
  productId: string,
  referenceId: string,
  openInNewTab: boolean = true,
): Promise<void> {
  return downloadFromS3Core({
    downloadUrlEndpoint: `/api/planner/products/${productId}/references/${referenceId}/download-url`,
    openInNewTab,
  })
}

/**
 * 제품 레퍼런스 썸네일 다운로드 URL 생성
 *
 * @param productId - 제품 ID
 * @param referenceId - 레퍼런스 ID
 * @returns 썸네일 다운로드 URL
 */
export async function getProductReferenceThumbnailUrl(
  productId: string,
  referenceId: string,
): Promise<string> {
  try {
    const response = await fetch(
      `/api/planner/products/${productId}/references/${referenceId}/download-url?thumbnail=true`,
      {
        credentials: 'include',
      },
    )

    if (!response.ok) {
      throw new Error('썸네일 URL 생성 실패')
    }

    const result = await response.json()
    return result.data?.downloadUrl || result.downloadUrl || ''
  } catch (error) {
    logger.error('[PlannerS3] Get thumbnail URL failed', error)
    throw error
  }
}

// ============================================================================
// Delete
// ============================================================================

/**
 * 제품 레퍼런스 삭제
 *
 * @param productId - 제품 ID
 * @param referenceId - 레퍼런스 ID
 */
export async function deleteProductReference(
  productId: string,
  referenceId: string,
): Promise<void> {
  try {
    // 먼저 데이터베이스에서 soft delete 후, S3 파일도 삭제
    const response = await fetch(`/api/planner/products/${productId}/references/${referenceId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '레퍼런스 삭제 실패')
    }

    logger.log('[PlannerS3] Product reference deleted', {
      productId,
      referenceId,
    })
  } catch (error) {
    logger.error('[PlannerS3] Delete failed', error)
    throw error
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 파일 크기를 human-readable 형식으로 포맷
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * MIME 타입에서 파일 확장자 추출
 */
export function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  }

  return mimeToExt[mimeType] || 'unknown'
}

/**
 * 파일이 이미지인지 확인
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * 파일이 PDF인지 확인
 */
export function isPdfFile(mimeType: string, fileName?: string): boolean {
  return (
    mimeType === 'application/pdf' || Boolean(fileName && fileName.toLowerCase().endsWith('.pdf'))
  )
}
