/**
 * S3 Core Module
 * 순수한 S3 업로드/다운로드 로직 (도메인 무관)
 *
 * 이 모듈은 S3와의 직접적인 상호작용만 담당합니다.
 * 비즈니스 로직, 메타데이터 저장 등은 Service Layer에서 처리합니다.
 */

import { logger } from '$lib/utils/logger'

// ============================================================================
// Types
// ============================================================================

export interface S3UploadCoreOptions {
  file: File
  presignedUrlEndpoint: string
  presignedUrlParams: Record<string, any>
  onProgress?: (progress: number) => void
}

export interface S3UploadCoreResult {
  success: boolean
  s3Key: string
  finalUrl?: string
  error?: string
}

export interface S3DownloadCoreOptions {
  downloadUrlEndpoint: string
  openInNewTab?: boolean
  filename?: string
}

export interface S3DeleteCoreOptions {
  deleteEndpoint: string
}

// ============================================================================
// Error Classes
// ============================================================================

export class S3CoreError extends Error {
  constructor(
    message: string,
    public readonly stage: 'url-request' | 's3-upload' | 'download' | 'delete',
    public readonly originalError?: Error,
  ) {
    super(message)
    this.name = 'S3CoreError'
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Presigned URL 요청
 */
async function requestPresignedUrl(options: S3UploadCoreOptions): Promise<{
  uploadUrl: string
  s3Key: string
  finalUrl?: string
}> {
  try {
    const response = await fetch(options.presignedUrlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options.presignedUrlParams),
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `업로드 URL 생성 실패 (${response.status})`)
    }

    const responseData = await response.json()
    logger.log('[S3Core] Presigned URL received', {
      endpoint: options.presignedUrlEndpoint,
    })

    // API 응답 구조 처리 (두 가지 형식 지원)
    // 1. { data: { uploadUrl, s3Key, finalUrl } } - 증빙자료 API
    // 2. { url, key, finalUrl } - CRM API
    const urlData = responseData.data || responseData
    const uploadUrl = urlData.uploadUrl || urlData.url
    const s3Key = urlData.s3Key || urlData.key
    const finalUrl = urlData.finalUrl

    if (!uploadUrl || !s3Key) {
      throw new Error('업로드 URL 또는 S3 키가 없습니다')
    }

    return { uploadUrl, s3Key, finalUrl }
  } catch (error) {
    throw new S3CoreError(
      'Presigned URL 요청 실패',
      'url-request',
      error instanceof Error ? error : undefined,
    )
  }
}

/**
 * XMLHttpRequest를 사용한 진행률 추적 업로드
 */
function uploadWithProgress(
  url: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // 업로드 진행률 이벤트
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100
        onProgress?.(percent)
      }
    })

    // 업로드 완료 이벤트
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        logger.log('[S3Core] Upload successful', { status: xhr.status })
        resolve()
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    })

    // 네트워크 에러
    xhr.addEventListener('error', () => {
      reject(new Error('Network error'))
    })

    // 요청 시작
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.send(file)
  })
}

/**
 * S3에 파일 업로드 (Core)
 *
 * 프로세스:
 * 1. Presigned URL 요청 (0-20%)
 * 2. S3 직접 업로드 (20-100%)
 */
export async function uploadToS3Core(options: S3UploadCoreOptions): Promise<S3UploadCoreResult> {
  try {
    // Step 1: Presigned URL 요청 (0-20%)
    options.onProgress?.(0)
    const { uploadUrl, s3Key, finalUrl } = await requestPresignedUrl(options)
    options.onProgress?.(20)

    // Step 2: S3 직접 업로드 (20-100%)
    await uploadWithProgress(uploadUrl, options.file, (progress) => {
      options.onProgress?.(20 + progress * 0.8)
    })

    logger.log('[S3Core] Upload complete', { s3Key })

    return {
      success: true,
      s3Key,
      finalUrl,
    }
  } catch (error) {
    logger.error('[S3Core] Upload failed', error)

    if (error instanceof S3CoreError) {
      throw error
    }

    throw new S3CoreError('S3 업로드 실패', 's3-upload', error instanceof Error ? error : undefined)
  }
}

/**
 * S3에서 파일 다운로드 (Core)
 */
export async function downloadFromS3Core(options: S3DownloadCoreOptions): Promise<void> {
  try {
    const response = await fetch(options.downloadUrlEndpoint, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('다운로드 URL 생성 실패')
    }

    const responseData = await response.json()

    // API 응답 구조 처리
    const url = responseData.data?.downloadUrl || responseData.downloadUrl

    if (!url) {
      throw new Error('다운로드 URL이 없습니다')
    }

    logger.log('[S3Core] Download URL received', { endpoint: options.downloadUrlEndpoint })

    if (options.openInNewTab) {
      window.open(url, '_blank')
    } else {
      // 직접 다운로드
      downloadFile(url, options.filename)
    }
  } catch (error) {
    logger.error('[S3Core] Download failed', error)
    throw new S3CoreError('다운로드 실패', 'download', error instanceof Error ? error : undefined)
  }
}

/**
 * S3에서 파일 삭제 (Core)
 */
export async function deleteFromS3Core(options: S3DeleteCoreOptions): Promise<void> {
  try {
    const response = await fetch(options.deleteEndpoint, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('삭제 실패')
    }

    logger.log('[S3Core] Delete successful', { endpoint: options.deleteEndpoint })
  } catch (error) {
    logger.error('[S3Core] Delete failed', error)
    throw new S3CoreError('삭제 실패', 'delete', error instanceof Error ? error : undefined)
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 파일 직접 다운로드 (브라우저 다운로드 트리거)
 */
function downloadFile(url: string, filename?: string): void {
  const link = document.createElement('a')
  link.href = url
  if (filename) {
    link.download = filename
  }
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
