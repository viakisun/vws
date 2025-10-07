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
  return formatDateTimeForInput(timestamp)
}
