/**
 * Evidence S3 Service
 * 증빙자료 도메인의 S3 파일 업로드/다운로드/삭제
 *
 * 특징:
 * - 메타데이터를 evidence_documents 테이블에 저장
 * - 한 증빙 항목에 여러 문서 첨부 가능
 */

import type { DocumentType } from '$lib/constants/document-types'
import { logger } from '$lib/utils/logger'
import { deleteFromS3Core, downloadFromS3Core, uploadToS3Core } from './s3-core'

// ============================================================================
// Upload
// ============================================================================

/**
 * 증빙자료 문서 업로드 (메타데이터 저장 포함)
 *
 * 프로세스:
 * 1. S3 업로드 (0-70%)
 * 2. 메타데이터 저장 (70-100%)
 *
 * @param evidenceId - 증빙 항목 ID
 * @param file - 업로드할 파일
 * @param documentType - 문서 타입 (견적서, 세금계산서 등)
 * @param onProgress - 진행률 콜백 (0-100%)
 * @returns s3Key와 저장된 documentId
 */
export async function uploadEvidenceDocument(
  evidenceId: string,
  file: File,
  documentType: DocumentType,
  onProgress?: (progress: number) => void,
): Promise<{ s3Key: string; documentId?: string }> {
  try {
    // Step 1: S3 업로드 (0-70%)
    const result = await uploadToS3Core({
      file,
      presignedUrlEndpoint: `/api/research-development/evidence/${evidenceId}/upload-url`,
      presignedUrlParams: {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
      },
      onProgress: (p) => onProgress?.(p * 0.7),
    })

    // Step 2: 메타데이터 저장 (70-100%)
    onProgress?.(70)

    const metadataResponse = await fetch(
      `/api/research-development/evidence/${evidenceId}/documents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          fileName: file.name,
          s3Key: result.s3Key,
          fileSize: file.size,
        }),
        credentials: 'include',
      },
    )

    if (!metadataResponse.ok) {
      throw new Error('메타데이터 저장 실패')
    }

    const metadataResult = await metadataResponse.json()
    onProgress?.(100)

    logger.log('[EvidenceS3] Document uploaded and metadata saved', {
      evidenceId,
      s3Key: result.s3Key,
      documentId: metadataResult.data?.id,
    })

    return {
      s3Key: result.s3Key,
      documentId: metadataResult.data?.id,
    }
  } catch (error) {
    logger.error('[EvidenceS3] Upload failed', error)
    throw error
  }
}

// ============================================================================
// Download
// ============================================================================

/**
 * 증빙자료 문서 다운로드
 *
 * @param evidenceId - 증빙 항목 ID
 * @param documentId - 문서 ID
 */
export async function downloadEvidenceDocument(
  evidenceId: string,
  documentId: string,
): Promise<void> {
  return downloadFromS3Core({
    downloadUrlEndpoint: `/api/research-development/evidence/${evidenceId}/documents/${documentId}/download`,
    openInNewTab: true,
  })
}

// ============================================================================
// Delete
// ============================================================================

/**
 * 증빙자료 문서 삭제
 *
 * @param evidenceId - 증빙 항목 ID
 * @param documentId - 문서 ID
 */
export async function deleteEvidenceDocument(
  evidenceId: string,
  documentId: string,
): Promise<void> {
  return deleteFromS3Core({
    deleteEndpoint: `/api/research-development/evidence/${evidenceId}/documents/${documentId}`,
  })
}
