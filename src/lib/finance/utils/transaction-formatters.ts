import { formatDateTimeForInput, getCurrentUTC, toUTC } from '$lib/utils/date-handler'

/**
 * 금액을 포맷팅 (천단위 콤마)
 */
export function formatAmountInput(value: number): string {
  return value.toLocaleString('ko-KR')
}

/**
 * 포맷팅된 금액을 숫자로 파싱
 */
export function parseAmountInput(value: string): number {
  return parseInt(value.replace(/,/g, '')) || 0
}

/**
 * 현재 UTC 타임스탬프 반환
 */
export function getCurrentUTCTimestamp(): string {
  return getCurrentUTC()
}

/**
 * 로컬 datetime을 UTC 타임스탬프로 변환
 */
export function convertToUTCTimestamp(datetimeLocal: string): string {
  if (!datetimeLocal) return getCurrentUTCTimestamp()
  return toUTC(datetimeLocal)
}

/**
 * UTC 타임스탬프를 로컬 datetime으로 변환
 */
export function convertToDateTimeLocal(timestamp: string): string {
  if (!timestamp || timestamp === 'null' || timestamp === '') {
    return formatDateTimeForInput(getCurrentUTC())
  }

  // ISO 8601 형식 (2025-10-16T13:23:46.583Z)을 KST 형식으로 변환
  if (timestamp.includes('T') && timestamp.includes('Z')) {
    try {
      const date = new Date(timestamp)
      if (!isNaN(date.getTime())) {
        // KST (+09:00)로 변환하여 YYYY-MM-DD HH:MM:SS+09 형식으로 포맷
        const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
        const year = kstDate.getUTCFullYear()
        const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0')
        const day = String(kstDate.getUTCDate()).padStart(2, '0')
        const hours = String(kstDate.getUTCHours()).padStart(2, '0')
        const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0')

        const kstTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:00+09`
        return formatDateTimeForInput(kstTimestamp)
      }
    } catch (error) {
      // ISO 변환 실패 시 원본 timestamp로 시도
    }
  }

  // 이미 KST 형식이거나 다른 형식인 경우 원본 처리
  return formatDateTimeForInput(timestamp)
}
