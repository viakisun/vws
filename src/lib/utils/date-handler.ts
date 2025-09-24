import { logger } from '$lib/utils/logger'
/**
 * 통일된 날짜 처리 유틸리티
 *
 * 이 모듈은 모든 날짜 처리를 표준화하여 UTC와 서울 시간을 일관되게 처리합니다.
 *
 * 표준:
 * - 데이터베이스 저장: UTC (ISO 8601)
 * - 사용자 표시: 서울 시간 (Asia/Seoul)
 * - 입력 처리: 다양한 형식 지원 → UTC로 변환
 * - API 응답: UTC → 서울 시간으로 변환
 */

/**
 * 표준화된 날짜 타입
 */
export type StandardDate = string & { readonly __brand: 'StandardDate' }

/**
 * 지원하는 날짜 입력 형식
 */
export type DateInputFormat =
  | string // ISO 8601, YYYY-MM-DD, YYYY.MM.DD 등
  | Date // JavaScript Date 객체
  | number // Unix timestamp, Excel 날짜 등

/**
 * 날짜 표시 형식
 */
export const DATE_FORMATS = {
  // 표시용 형식들
  DISPLAY: {
    FULL: 'YYYY. MM. DD.', // 2025. 01. 15.
    SHORT: 'MM/DD', // 01/15
    ISO: 'YYYY-MM-DD', // 2025-01-15
    KOREAN: 'YYYY년 MM월 DD일', // 2025년 01월 15일
    RELATIVE: 'relative', // 상대적 시간 (1일 전, 2시간 전 등)
  },

  // 입력용 형식들
  INPUT: {
    HTML_DATE: 'YYYY-MM-DD', // HTML date input
    DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', // HTML datetime-local input
    ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ', // ISO 8601
  },
} as const

/**
 * 시간대 설정 import
 */
// timezone-config.js 파일이 삭제되어 import 제거됨

/**
 * 시간대 상수 (하위 호환성을 위해 유지)
 */
export const SEOUL_TIMEZONE = 'Asia/Seoul'
export const UTC_TIMEZONE = 'UTC'

/**
 * 현재 설정된 시간대를 가져옵니다.
 */
function getCurrentAppTimezone(): string {
  return SEOUL_TIMEZONE // 기본값으로 서울 시간대 사용
}

/**
 * 날짜를 UTC로 변환 (데이터베이스 저장용)
 * 모든 입력을 현재 설정된 시간대 기준으로 해석하여 UTC로 저장
 */
export function toUTC(date: DateInputFormat): StandardDate {
  if (!date) return '' as StandardDate

  try {
    let dateObj: Date
    const _currentTimezone = getCurrentAppTimezone()
    const timezoneOffset = '+09:00' // 서울 시간대 오프셋

    if (date instanceof Date) {
      // Date 객체는 이미 올바른 시간대로 간주
      dateObj = date
    } else if (typeof date === 'number') {
      // Excel 날짜 또는 Unix timestamp 처리
      if (date > 25569) {
        // Excel 날짜 (1900-01-01 기준)
        const excelEpoch = new Date(1900, 0, 1)
        dateObj = new Date(excelEpoch.getTime() + (date - 2) * 24 * 60 * 60 * 1000)
      } else {
        // Unix timestamp
        dateObj = new Date(date * 1000)
      }
    } else {
      // 문자열 처리 - 모든 날짜를 현재 설정된 시간대 기준으로 해석
      const dateStr = String(date).trim()

      if (!dateStr) return '' as StandardDate

      // 다양한 형식 지원
      if (dateStr.includes('T')) {
        // ISO 8601 형식 - 이미 시간대 정보가 포함되어 있으면 그대로 사용
        if (dateStr.includes('+') || dateStr.includes('Z') || dateStr.includes('-', 10)) {
          dateObj = new Date(dateStr)
        } else {
          // 시간대 정보가 없으면 현재 설정된 시간대로 해석
          dateObj = new Date(`${dateStr}${timezoneOffset}`)
        }
      } else if (dateStr.includes('.')) {
        // YYYY.MM.DD 형식 - 현재 설정된 시간대 자정으로 해석
        const [year, month, day] = dateStr.split('.')
        dateObj = new Date(
          `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00${timezoneOffset}`,
        )
      } else if (dateStr.includes('-')) {
        // YYYY-MM-DD 형식 - 현재 설정된 시간대 자정으로 해석
        const [year, month, day] = dateStr.split('-')
        dateObj = new Date(
          `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00${timezoneOffset}`,
        )
      } else if (dateStr.includes('/')) {
        // MM/DD/YYYY 또는 DD/MM/YYYY 형식 - 현재 설정된 시간대 자정으로 해석
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          // MM/DD/YYYY 가정
          const [month, day, year] = parts
          dateObj = new Date(
            `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00${timezoneOffset}`,
          )
        }
      } else {
        // 기본 Date 생성자 사용 후 현재 설정된 시간대로 해석
        const tempDate = new Date(dateStr)
        if (!isNaN(tempDate.getTime())) {
          // 유효한 날짜면 현재 설정된 시간대 자정으로 재해석
          const year = tempDate.getFullYear()
          const month = String(tempDate.getMonth() + 1).padStart(2, '0')
          const day = String(tempDate.getDate()).padStart(2, '0')
          dateObj = new Date(`${year}-${month}-${day}T00:00:00${timezoneOffset}`)
        } else {
          dateObj = tempDate
        }
      }
    }

    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`)
    }

    // UTC로 변환하여 ISO 문자열 반환
    return dateObj.toISOString() as StandardDate
  } catch (error) {
    logger.error('Date conversion error:', error, 'for input:', date)
    return '' as StandardDate
  }
}

/**
 * UTC 날짜를 서울 시간으로 변환하여 표시용 형식으로 포맷팅
 */
export function formatDateForDisplay(
  utcDate: StandardDate | string,
  format: keyof typeof DATE_FORMATS.DISPLAY = 'FULL',
): string {
  if (!utcDate) return ''

  try {
    const date = new Date(utcDate)

    if (isNaN(date.getTime())) {
      logger.warn('Invalid UTC date for display:', utcDate)
      return ''
    }

    // 현재 설정된 시간대로 변환
    const currentTimezone = getCurrentAppTimezone()
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: currentTimezone }))

    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    const _hours = String(localDate.getHours()).padStart(2, '0')
    const _minutes = String(localDate.getMinutes()).padStart(2, '0')

    switch (format) {
      case 'FULL':
        return `${year}. ${month}. ${day}.`
      case 'SHORT':
        return `${month}/${day}`
      case 'ISO':
        return `${year}-${month}-${day}`
      case 'KOREAN':
        return `${year}년 ${month}월 ${day}일`
      case 'RELATIVE':
        return getRelativeTime(seoulDate)
      default:
        return `${year}. ${month}. ${day}.`
    }
  } catch (error) {
    logger.error('Date display formatting error:', error, 'for date:', utcDate)
    return ''
  }
}

/**
 * HTML input용 날짜 형식 (YYYY-MM-DD)
 */
export function formatDateForInput(utcDate: StandardDate | string): string {
  if (!utcDate) return ''

  try {
    const date = new Date(utcDate)

    if (isNaN(date.getTime())) {
      return ''
    }

    // 현재 설정된 시간대로 변환하여 YYYY-MM-DD 형식으로 반환
    const currentTimezone = getCurrentAppTimezone()
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: currentTimezone }))

    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch (error) {
    logger.error('Date input formatting error:', error, 'for date:', utcDate)
    return ''
  }
}

/**
 * HTML datetime-local input용 형식 (YYYY-MM-DDTHH:mm)
 */
export function formatDateTimeForInput(utcDate: StandardDate | string): string {
  if (!utcDate) return ''

  try {
    const date = new Date(utcDate)

    if (isNaN(date.getTime())) {
      return ''
    }

    // 현재 설정된 시간대로 변환
    const currentTimezone = getCurrentAppTimezone()
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: currentTimezone }))

    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    const _hours = String(localDate.getHours()).padStart(2, '0')
    const _minutes = String(localDate.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    logger.error('DateTime input formatting error:', error, 'for date:', utcDate)
    return ''
  }
}

/**
 * 상대적 시간 표시 (예: "1일 전", "2시간 전")
 */
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}분 전`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}시간 전`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}일 전`
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months}개월 전`
  } else {
    const years = Math.floor(diffInSeconds / 31536000)
    return `${years}년 전`
  }
}

/**
 * 현재 시간을 UTC로 반환
 */
export function getCurrentUTC(): StandardDate {
  return new Date().toISOString() as StandardDate
}

/**
 * 현재 서울 시간을 UTC로 변환하여 반환
 */
export function getCurrentSeoulAsUTC(): StandardDate {
  const now = new Date()
  // 서울 시간대의 현재 시간을 UTC로 변환하는 더 정확한 방법
  const seoulTime = new Date(now.toLocaleString('en-US', { timeZone: SEOUL_TIMEZONE }))
  return seoulTime.toISOString() as StandardDate
}

/**
 * 날짜 유효성 검증
 */
export function isValidDate(date: DateInputFormat): boolean {
  try {
    const utcDate = toUTC(date)
    return utcDate !== '' && !isNaN(new Date(utcDate).getTime())
  } catch {
    return false
  }
}

/**
 * 두 날짜 간의 차이 계산 (일 단위)
 */
export function getDateDifference(
  startDate: StandardDate | string,
  endDate: StandardDate | string,
): number {
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0
    }

    const diffInMs = end.getTime() - start.getTime()
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  } catch {
    return 0
  }
}

/**
 * 날짜 범위 검증 (시작일이 종료일보다 이전인지)
 */
export function isValidDateRange(
  startDate: StandardDate | string,
  endDate: StandardDate | string,
): boolean {
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false
    }

    return start < end
  } catch {
    return false
  }
}

/**
 * 날짜 처리 강제 함수 (개발 모드에서만 동작)
 */
export function enforceStandardDate(date: DateInputFormat, context: string = '날짜'): StandardDate {
  if (process.env.NODE_ENV === 'development') {
    if (!isValidDate(date)) {
      logger.warn(`⚠️ [날짜 처리 강제] ${context}에서 유효하지 않은 날짜 발견: "${date}"`)
    }
  }

  return toUTC(date)
}

/**
 * 날짜 처리 표준 가이드라인
 */
export const DATE_STANDARDS = {
  /**
   * 표준 형식
   */
  FORMATS: {
    STORAGE: 'UTC (ISO 8601)', // 데이터베이스 저장
    DISPLAY: '서울 시간 (Asia/Seoul)', // 사용자 표시
    INPUT: '다양한 형식 지원', // 사용자 입력
  },

  /**
   * 사용 금지 패턴들
   */
  FORBIDDEN_PATTERNS: [
    'new Date().toLocaleDateString()', // 직접 로컬 날짜 사용
    'new Date().toLocaleString()', // 직접 로컬 시간 사용
    'date.toISOString()', // UTC 변환 없이 직접 사용
    'new Date(dateString)', // 문자열을 직접 Date 생성자에 전달
    'Date.now()', // 직접 timestamp 사용
  ],

  /**
   * 권장 패턴들
   */
  RECOMMENDED_PATTERNS: [
    'toUTC(userInput)', // 사용자 입력을 UTC로 변환
    'formatDateForDisplay(utcDate)', // UTC를 표시용으로 변환
    'formatDateForInput(utcDate)', // HTML input용으로 변환
    'getCurrentUTC()', // 현재 시간을 UTC로
    'enforceStandardDate(date)', // 타입 안전한 날짜 처리
  ],
} as const
