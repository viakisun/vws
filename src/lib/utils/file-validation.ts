/**
 * 파일 검증 유틸리티
 */

export interface FileValidationError {
  type: 'size' | 'type' | 'name'
  message: string
}

/**
 * 파일 타입 검증
 */
export function validateFileType(
  filename: string,
  allowedTypes: string[],
): FileValidationError | null {
  const ext = filename.toLowerCase().split('.').pop()
  if (!ext) {
    return {
      type: 'type',
      message: '파일 확장자를 확인할 수 없습니다.',
    }
  }

  const normalizedAllowedTypes = allowedTypes.map((t) => t.toLowerCase().replace('.', ''))
  if (!normalizedAllowedTypes.includes(ext)) {
    return {
      type: 'type',
      message: `허용되지 않는 파일 형식입니다. 허용 형식: ${allowedTypes.join(', ')}`,
    }
  }

  return null
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(size: number, maxSizeMB: number): FileValidationError | null {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (size > maxSizeBytes) {
    return {
      type: 'size',
      message: `파일 크기가 ${maxSizeMB}MB를 초과합니다. (현재: ${(size / 1024 / 1024).toFixed(2)}MB)`,
    }
  }
  return null
}

/**
 * 파일명 정규화 (특수문자 제거, 공백을 언더스코어로)
 */
export function sanitizeFilename(filename: string): string {
  const parts = filename.split('.')
  const ext = parts.pop()
  const name = parts.join('.')

  // 한글, 영문, 숫자, 하이픈, 언더스코어만 허용
  const sanitized = name
    .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '_') // 공백을 언더스코어로
    .replace(/_{2,}/g, '_') // 연속된 언더스코어 제거
    .substring(0, 200) // 최대 길이 제한

  return ext ? `${sanitized}.${ext}` : sanitized
}

/**
 * 파일 전체 검증
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number,
): FileValidationError | null {
  // 타입 검증
  const typeError = validateFileType(file.name, allowedTypes)
  if (typeError) return typeError

  // 크기 검증
  const sizeError = validateFileSize(file.size, maxSizeMB)
  if (sizeError) return sizeError

  return null
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * MIME 타입에서 확장자 추출
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/haansofthwp': 'hwp',
    'application/x-hwp': 'hwp',
  }

  return mimeMap[mimeType] || 'bin'
}
