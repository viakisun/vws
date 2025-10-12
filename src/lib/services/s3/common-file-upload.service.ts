/**
 * S3 파일 업로드 공통 서비스 (Wrapper)
 * 하위 호환성을 위해 유지됨
 *
 * 새 코드는 도메인별 서비스를 직접 사용하는 것을 권장:
 * - s3-evidence.service.ts (증빙자료)
 * - s3-crm.service.ts (CRM)
 */

import { CrmDocumentType } from '$lib/constants/crm'
import { uploadToS3Core } from './s3-core'

export interface UploadFileOptions {
  file: File
  uploadUrlEndpoint: string
  uploadUrlParams: Record<string, any>
  onProgress?: (progress: number) => void
}

export interface UploadResult {
  success: boolean
  url?: string
  s3Key?: string
  error?: string
}

/**
 * 파일을 S3에 업로드하는 공통 게이트 (Legacy)
 *
 * @deprecated 새 코드는 s3-evidence.service.ts 또는 s3-crm.service.ts 사용 권장
 *
 * @param options - 업로드 옵션
 * @returns UploadResult - 업로드 결과
 */
export async function uploadFileToS3(options: UploadFileOptions): Promise<UploadResult> {
  try {
    const result = await uploadToS3Core({
      file: options.file,
      presignedUrlEndpoint: options.uploadUrlEndpoint,
      presignedUrlParams: options.uploadUrlParams,
      onProgress: options.onProgress,
    })

    return {
      success: true,
      s3Key: result.s3Key,
      url: result.finalUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
  }
}

/**
 * 증빙자료 문서 업로드 (Legacy)
 *
 * @deprecated s3-evidence.service.ts의 uploadEvidenceDocument 사용 권장
 *
 * 참고: 이 함수는 메타데이터 저장을 하지 않습니다.
 * 메타데이터 저장이 필요하면 s3-evidence.service.ts를 사용하세요.
 *
 * @param evidenceId - 증빙 항목 ID
 * @param file - 업로드할 파일
 * @returns UploadResult
 */
export async function uploadEvidenceDocument(
  evidenceId: string,
  file: File,
): Promise<UploadResult> {
  return uploadFileToS3({
    file,
    uploadUrlEndpoint: `/api/research-development/evidence/${evidenceId}/upload-url`,
    uploadUrlParams: {
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || 'application/octet-stream',
    },
  })
}

/**
 * CRM 고객 문서 업로드 (Legacy)
 *
 * @deprecated s3-crm.service.ts의 uploadCrmDocument 사용 권장
 *
 * @param companyCode - 회사 코드 (예: '1001')
 * @param customerId - 고객 ID
 * @param documentType - 문서 유형
 * @param file - 업로드할 파일
 * @returns UploadResult
 */
export async function uploadCrmDocument(
  companyCode: string,
  customerId: string,
  documentType: CrmDocumentType,
  file: File,
): Promise<UploadResult> {
  return uploadFileToS3({
    file,
    uploadUrlEndpoint: '/api/crm/documents/upload-url',
    uploadUrlParams: {
      companyCode,
      customerId,
      documentType,
      filename: file.name,
      contentType: file.type,
    },
  })
}

/**
 * 여러 파일을 병렬로 업로드 (Legacy)
 *
 * @deprecated 필요시 도메인별 서비스를 직접 병렬 호출 권장
 *
 * @param uploads - 업로드할 파일 목록
 * @returns UploadResult 배열
 */
export async function uploadMultipleFiles(
  uploads: Array<{
    file: File
    uploadUrlEndpoint: string
    uploadUrlParams: Record<string, any>
  }>,
): Promise<UploadResult[]> {
  return Promise.all(
    uploads.map((upload) =>
      uploadFileToS3({
        file: upload.file,
        uploadUrlEndpoint: upload.uploadUrlEndpoint,
        uploadUrlParams: upload.uploadUrlParams,
      }),
    ),
  )
}
