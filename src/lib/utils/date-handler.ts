import { logger } from '$lib/utils/logger'

/**
 * KST 전용 날짜 처리 유틸리티
 *
 * 핵심 원칙:
 * - 글로벌 지원 없음: 대한민국 KST만 사용
 * - 모든 날짜는 문자열로 처리
 * - DB 세션은 Asia/Seoul로 고정
 * - 모든 TIMESTAMPTZ 컬럼은 ::text로 캐스팅
 *
 * 데이터 흐름:
 * 1. 사용자 입력 → HTML <input type="datetime-local"> → YYYY-MM-DDTHH:MM
 * 2. DB 저장 → toKstTextFromDateTimeLocal() → YYYY-MM-DD HH:MM+09
 * 3. DB 조회 → ::text → "YYYY-MM-DD HH:MM:SS.sss+09" 또는 "YYYY-MM-DD"
 * 4. 화면 표시 → formatDateForDisplay() → "YYYY. MM. DD." 또는 "YYYY년 MM월 DD일"
 */

// =============================================
// Type Definitions
// =============================================

/**
 * 날짜 표시 형식
 */
export type DateFormatType = 'FULL' | 'SHORT' | 'ISO' | 'KOREAN'

// =============================================
// Core Functions (KST Only)
// =============================================

/**
 * datetime-local input → KST TIMESTAMPTZ 문자열
 *
 * HTML <input type="datetime-local">에서 가져온 값을 DB에 저장할 형식으로 변환
 *
 * @param value - HTML datetime-local 값 (YYYY-MM-DDTHH:MM)
 * @returns KST TIMESTAMPTZ 문자열 (YYYY-MM-DD HH:MM+09)
 *
 * @example
 * toKstTextFromDateTimeLocal('2025-10-08T11:30')
 * // → '2025-10-08 11:30+09'
 *
 * @example SQL Usage
 * const kstText = toKstTextFromDateTimeLocal(userInput)
 * await query('INSERT INTO meetings (starts_at) VALUES ($1::timestamptz)', [kstText])
 */
export function toKstTextFromDateTimeLocal(value: string): string {
  if (!value) return ''

  try {
    // YYYY-MM-DDTHH:MM → YYYY-MM-DD HH:MM+09
    const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
    if (!match) {
      const stack = new Error().stack
      const callerLine = stack?.split('\n')[2]?.trim() || 'unknown location'

      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.error('❌ [toKstTextFromDateTimeLocal] Invalid datetime-local format')
      logger.error('   Input:', value)
      logger.error('   Expected: YYYY-MM-DDTHH:MM (e.g., "2025-10-08T11:30")')
      logger.error('   Called from:', callerLine)
      logger.error('')
      logger.error('   Stack trace:')
      logger.error(stack || 'Stack trace not available')
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return ''
    }

    return `${match[1]} ${match[2]}+09`
  } catch (error) {
    const stack = error instanceof Error ? error.stack : new Error().stack
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [toKstTextFromDateTimeLocal] Conversion error')
    logger.error('   Input:', value)
    logger.error('   Error:', error)
    logger.error('')
    logger.error('   Stack trace:')
    logger.error(stack || 'Stack trace not available')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return ''
  }
}

/**
 * DB TIMESTAMPTZ → HTML date input
 *
 * DB에서 ::text로 가져온 날짜를 HTML <input type="date">에 사용할 형식으로 변환
 *
 * @param dateStr - DB 날짜 문자열
 * @returns YYYY-MM-DD 형식
 *
 * @example
 * formatDateForInput('2025-10-08 11:24:23.373+09')
 * // → '2025-10-08'
 *
 * @example
 * formatDateForInput('2025-10-08')
 * // → '2025-10-08'
 */
export function formatDateForInput(dateStr: string): string {
  if (!dateStr) return ''

  try {
    // YYYY-MM-DD 부분만 추출
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/)
    if (!match) {
      const stack = new Error().stack
      const callerLine = stack?.split('\n')[2]?.trim() || 'unknown location'

      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.error('❌ [formatDateForInput] Invalid date format')
      logger.error('   Input:', dateStr)
      logger.error('   Expected: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS+09')
      logger.error('   Called from:', callerLine)
      logger.error('')
      logger.error('   Reminder: Use ::text in SQL queries')
      logger.error('   Example: SELECT created_at::text FROM table')
      logger.error('')
      logger.error('   Stack trace:')
      logger.error(stack || 'Stack trace not available')
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return ''
    }

    return match[1]
  } catch (error) {
    const stack = error instanceof Error ? error.stack : new Error().stack
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [formatDateForInput] Formatting error')
    logger.error('   Input:', dateStr)
    logger.error('   Error:', error)
    logger.error('')
    logger.error('   Stack trace:')
    logger.error(stack || 'Stack trace not available')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return ''
  }
}

/**
 * DB TIMESTAMPTZ → HTML datetime-local input
 *
 * DB에서 ::text로 가져온 타임스탬프를 HTML <input type="datetime-local">에 사용할 형식으로 변환
 *
 * @param dateStr - DB 타임스탬프 문자열
 * @returns YYYY-MM-DDTHH:MM 형식
 *
 * @example
 * formatDateTimeForInput('2025-10-08 11:24:23+09')
 * // → '2025-10-08T11:24'
 *
 * @example
 * formatDateTimeForInput('2025-10-08 11:24:23.373+09')
 * // → '2025-10-08T11:24'
 */
export function formatDateTimeForInput(dateStr: string): string {
  if (!dateStr) return ''

  try {
    // YYYY-MM-DD HH:MM:SS+09 → YYYY-MM-DDTHH:MM
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/)
    if (!match) {
      const stack = new Error().stack
      const callerLine = stack?.split('\n')[2]?.trim() || 'unknown location'

      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.error('❌ [formatDateTimeForInput] Invalid datetime format')
      logger.error('   Input:', dateStr)
      logger.error('   Expected: YYYY-MM-DD HH:MM:SS+09 (with time component)')
      logger.error('   Called from:', callerLine)
      logger.error('')
      logger.error('   Hint: If you only have a date (YYYY-MM-DD),')
      logger.error('         use formatDateForInput() instead')
      logger.error('')
      logger.error('   Stack trace:')
      logger.error(stack || 'Stack trace not available')
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return ''
    }

    return `${match[1]}T${match[2]}`
  } catch (error) {
    const stack = error instanceof Error ? error.stack : new Error().stack
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [formatDateTimeForInput] Formatting error')
    logger.error('   Input:', dateStr)
    logger.error('   Error:', error)
    logger.error('')
    logger.error('   Stack trace:')
    logger.error(stack || 'Stack trace not available')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return ''
  }
}

/**
 * DB 날짜 → 화면 표시
 *
 * DB에서 가져온 날짜를 사용자 친화적 형식으로 변환
 *
 * @param dateStr - DB 날짜 문자열
 * @param format - 표시 형식 (기본값: 'FULL')
 * @returns 포맷된 날짜 문자열
 *
 * @example
 * formatDateForDisplay('2025-10-08', 'FULL')
 * // → '2025. 10. 08.'
 *
 * @example
 * formatDateForDisplay('2025-10-08 11:24:23+09', 'KOREAN')
 * // → '2025년 10월 08일'
 *
 * @example
 * formatDateForDisplay('2025-10-08', 'SHORT')
 * // → '10/08'
 *
 * @example
 * formatDateForDisplay('2025-10-08', 'ISO')
 * // → '2025-10-08'
 */
export function formatDateForDisplay(dateStr: string, format: DateFormatType = 'FULL'): string {
  if (!dateStr) return ''

  try {
    // YYYY-MM-DD 또는 YYYY-MM-DD HH:MM:SS+09 에서 날짜 부분만 추출
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) {
      const stack = new Error().stack
      const callerLine = stack?.split('\n')[2]?.trim() || 'unknown location'

      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.error('❌ [formatDateForDisplay] Invalid date format')
      logger.error('   Input:', dateStr)
      logger.error('   Format requested:', format)
      logger.error('   Called from:', callerLine)
      logger.error('')
      logger.error('   Expected: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS+09')
      logger.error('   Reminder: Use ::text in SQL queries')
      logger.error('   Example: SELECT created_at::text FROM table')
      logger.error('')
      logger.error('   Stack trace:')
      logger.error(stack || 'Stack trace not available')
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return ''
    }

    const [, year, month, day] = match

    switch (format) {
      case 'FULL':
        return `${year}. ${month}. ${day}.`
      case 'SHORT':
        return `${month}/${day}`
      case 'ISO':
        return `${year}-${month}-${day}`
      case 'KOREAN':
        return `${year}년 ${month}월 ${day}일`
      default:
        return `${year}. ${month}. ${day}.`
    }
  } catch (error) {
    const stack = error instanceof Error ? error.stack : new Error().stack
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [formatDateForDisplay] Display formatting error')
    logger.error('   Input:', dateStr)
    logger.error('   Format:', format)
    logger.error('   Error:', error)
    logger.error('')
    logger.error('   Stack trace:')
    logger.error(stack || 'Stack trace not available')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return ''
  }
}

/**
 * 날짜 유효성 검사
 *
 * @param date - 검사할 날짜 (문자열 또는 Date 객체)
 * @returns 유효한 날짜면 true
 *
 * @example
 * isValidDate('2025-10-08') // → true
 * isValidDate('invalid') // → false
 * isValidDate(new Date()) // → true
 */
export function isValidDate(date: string | Date): boolean {
  if (!date) return false

  try {
    const d = new Date(date)
    return !isNaN(d.getTime())
  } catch {
    return false
  }
}

/**
 * 현재 시간을 ISO 8601 형식으로 반환
 *
 * KST 시스템에서 현재 timestamp를 얻을 때 사용
 * DB에 저장 시 PostgreSQL이 자동으로 KST로 변환
 *
 * @returns ISO 8601 형식 문자열
 *
 * @example
 * getCurrentKstIso()
 * // → '2025-10-11T02:30:45.123Z'
 *
 * @example SQL Usage
 * // 더 나은 방법: SQL의 now() 사용
 * await query('INSERT INTO logs (created_at) VALUES (now())')
 *
 * // 또는 명시적으로:
 * await query('INSERT INTO logs (created_at) VALUES ($1)', [getCurrentKstIso()])
 */
export function getCurrentKstIso(): string {
  return new Date().toISOString()
}

// =============================================
// DEPRECATED - Backward Compatibility
// =============================================

/**
 * @deprecated Use getCurrentKstIso() instead
 */
export const getCurrentUTC = getCurrentKstIso

/**
 * @deprecated For DATE columns, pass YYYY-MM-DD string directly
 * @deprecated For TIMESTAMP columns, use new Date().toISOString() or now() in SQL
 */
export function toUTC(date: string | Date): string {
  if (!date) return ''
  if (date instanceof Date) {
    return date.toISOString()
  }
  return new Date(date).toISOString()
}

// =============================================
// Re-exported from date-calculator
// =============================================

export {
  calculateAnnualPeriod,
  calculateDaysBetween,
  calculateParticipationPeriod,
  formatDateForAPI,
  formatDateForKorean,
  getCurrentDateForAPI,
  isValidDateRange,
  validateContractOverlap,
} from './date-calculator'
