/**
 * S3 파일 업로드 공통 서비스
 * 모든 파일 업로드를 이 게이트를 통해 처리
 *
 * 사용 예:
 * - 증빙자료 문서 업로드
 * - CRM 고객 문서 업로드 (사업자등록증, 통장사본)
 */

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
 * 파일을 S3에 업로드하는 공통 게이트
 *
 * 프로세스:
 * 1. Presigned URL 요청 (uploadUrlEndpoint)
 * 2. S3에 직접 업로드 (PUT)
 * 3. 결과 반환 (success, url, s3Key)
 *
 * @param options - 업로드 옵션
 * @returns UploadResult - 업로드 결과
 */
export async function uploadFileToS3(options: UploadFileOptions): Promise<UploadResult> {
  const { file, uploadUrlEndpoint, uploadUrlParams, onProgress } = options

  try {
    // Step 1: Presigned URL 요청
    onProgress?.(10)
    const urlResponse = await fetch(uploadUrlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadUrlParams),
      credentials: 'include',
    })

    if (!urlResponse.ok) {
      const errorData = await urlResponse.json().catch(() => ({}))
      throw new Error(errorData.error || `업로드 URL 생성 실패 (${urlResponse.status})`)
    }

    const responseData = await urlResponse.json()
    console.log('[CommonFileUpload] Presigned URL response:', responseData)

    // API 응답 구조 처리 (두 가지 형식 지원)
    // 1. { data: { uploadUrl, s3Key, finalUrl } } - 증빙자료 API
    // 2. { url, key, finalUrl } - CRM API
    const urlData = responseData.data || responseData
    const uploadUrl = urlData.uploadUrl || urlData.url
    const s3Key = urlData.s3Key || urlData.key
    const finalUrl = urlData.finalUrl // API에서 제공하는 최종 URL

    if (!uploadUrl || !s3Key) {
      console.error('[CommonFileUpload] Invalid response structure:', responseData)
      throw new Error('업로드 URL 또는 S3 키가 없습니다')
    }

    // Step 2: S3에 직접 업로드
    onProgress?.(30)
    const s3Response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    })

    if (!s3Response.ok) {
      throw new Error(`S3 업로드 실패 (${s3Response.status})`)
    }

    // Step 3: 완료
    onProgress?.(100)
    console.log('[CommonFileUpload] Upload successful:', { s3Key, finalUrl })

    return {
      success: true,
      url: finalUrl, // 호환성을 위해 유지 (deprecated)
      s3Key, // 실제로 사용할 키
    }
  } catch (error) {
    console.error('[CommonFileUpload] Upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
  }
}

/**
 * 증빙자료 문서 업로드 (기존 증빙자료 시스템용)
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
 * CRM 고객 문서 업로드 (사업자등록증, 통장사본)
 *
 * @param companyCode - 회사 코드 (예: '1001')
 * @param customerId - 고객 ID
 * @param documentType - 문서 유형 ('business-registration' | 'bank-account')
 * @param file - 업로드할 파일
 * @returns UploadResult
 */
export async function uploadCrmDocument(
  companyCode: string,
  customerId: string,
  documentType: 'business-registration' | 'bank-account',
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
 * 여러 파일을 병렬로 업로드
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
