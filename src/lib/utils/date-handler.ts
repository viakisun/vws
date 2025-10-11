import { logger } from '$lib/utils/logger'

/**
 * 간소화된 날짜 처리 유틸리티
 *
 * 핵심 원칙:
 * - DB는 이미 KST(Asia/Seoul) 타임존으로 설정됨
 * - 모든 날짜는 TIMESTAMPTZ로 저장됨
 * - ::text 캐스팅으로 KST 문자열로 조회
 *
 * 데이터 흐름:
 * 1. 사용자 입력 → HTML <input type="date"> → YYYY-MM-DD
 * 2. DB 저장 → ISO 8601 문자열 (new Date().toISOString())
 * 3. DB 조회 → ::text → "YYYY-MM-DD HH:MM:SS+09" 또는 "YYYY-MM-DD"
 * 4. 화면 표시 → 간단한 포맷팅 ("YYYY. MM. DD.", "YYYY년 MM월 DD일" 등)
 *
 * 사용법:
 * - 저장: toUTC(userInput) → DB에 ISO 문자열 저장
 * - 조회: SELECT created_at::text → "2025-10-08 11:24:23.373+09"
 * - 표시: formatDateForDisplay(dbString) → "2025. 10. 08."
 * - 입력: formatDateForInput(dbString) → "2025-10-08"
 */

// =============================================
// Type Definitions
// =============================================

/**
 * 표준화된 날짜 타입 (ISO 8601 문자열)
 */
export type StandardDate = string & { readonly __brand: 'StandardDate' }

/**
 * 지원하는 날짜 입력 형식
 * - string: YYYY-MM-DD, ISO 8601
 * - Date: JavaScript Date 객체
 */
export type DateInputFormat = string | Date

/**
 * 날짜 표시 형식
 */
export const DATE_FORMATS = {
  FULL: 'YYYY. MM. DD.', // 2025. 01. 15.
  SHORT: 'MM/DD', // 01/15
  ISO: 'YYYY-MM-DD', // 2025-01-15
  KOREAN: 'YYYY년 MM월 DD일', // 2025년 01월 15일
} as const

export type DateFormatType = keyof typeof DATE_FORMATS

// =============================================
// Public API Functions
// =============================================

/**
 * 현재 시간을 ISO 8601 문자열로 반환
 *
 * @returns ISO 8601 문자열 (예: "2025-10-08T02:24:23.373Z")
 *
 * @example
 * const now = getCurrentUTC()
 * await query('UPDATE table SET updated_at = $1', [now])
 */
export function getCurrentUTC(): StandardDate {
  return new Date().toISOString() as StandardDate
}

/**
 * 사용자 입력을 ISO 8601 문자열로 변환 (DB 저장용)
 *
 * @param date - YYYY-MM-DD 문자열 또는 Date 객체
 * @returns ISO 8601 문자열 또는 빈 문자열
 *
 * @example
 * // HTML input에서
 * const utcDate = toUTC('2025-10-08')
 * await query('INSERT INTO table (date) VALUES ($1)', [utcDate])
 *
 * @example
 * // Date 객체에서
 * const utcDate = toUTC(new Date())
 * await query('INSERT INTO table (date) VALUES ($1)', [utcDate])
 */
export function toUTC(date: DateInputFormat): StandardDate {
  if (!date) return '' as StandardDate

  try {
    // Date 객체면 바로 ISO 문자열로
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        const stack = new Error().stack
        const callerLine = stack?.split('\n')[2]?.trim() || 'unknown location'

        logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        logger.error('❌ [toUTC] Invalid Date object')
        logger.error('   Value:', date)
        logger.error('   Called from:', callerLine)
        logger.error('')
        logger.error('   Possible causes:')
        logger.error('   - Date object is NaN or Invalid Date')
        logger.error('   - Incorrect date construction')
        logger.error('')
        logger.error('   Stack trace:')
        logger.error(stack || 'Stack trace not available')
        logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        return '' as StandardDate
      }
      return date.toISOString() as StandardDate
    }

    // 문자열이면 Date 객체로 변환 후 ISO 문자열로
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      const stack = new Error().stack
      const callerLine = stack?.split('\n')[2]?.trim() || 'unknown location'

      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.error('❌ [toUTC] Invalid date string')
      logger.error('   Input:', date)
      logger.error('   Type:', typeof date)
      logger.error('   Called from:', callerLine)
      logger.error('')
      logger.error('   Expected formats:')
      logger.error('   ✅ "YYYY-MM-DD" (e.g., "2025-10-08")')
      logger.error('   ✅ "YYYY-MM-DDTHH:MM:SS.sssZ" (ISO 8601)')
      logger.error('')
      logger.error('   Stack trace:')
      logger.error(stack || 'Stack trace not available')
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return '' as StandardDate
    }

    return dateObj.toISOString() as StandardDate
  } catch (error) {
    const stack = new Error().stack

    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [toUTC] Date conversion error')
    logger.error('   Input:', date)
    logger.error('   Type:', typeof date)
    logger.error('   Error:', error)
    if (error instanceof Error) {
      logger.error('   Error message:', error.message)
      logger.error('   Error stack:')
      logger.error(error.stack || 'Error stack not available')
    }
    logger.error('')
    logger.error('   Function stack trace:')
    logger.error(stack || 'Stack trace not available')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return '' as StandardDate
  }
}

/**
 * DB에서 가져온 날짜 문자열을 화면 표시용으로 포맷팅
 *
 * @param dateStr - DB 문자열 (YYYY-MM-DD HH:MM:SS+09 또는 YYYY-MM-DD)
 * @param format - 표시 형식 (기본값: 'FULL')
 * @returns 포맷된 날짜 문자열
 *
 * @example
 * // DB에서 조회
 * const dbDate = "2025-10-08 11:24:23.373+09"
 * formatDateForDisplay(dbDate) // "2025. 10. 08."
 * formatDateForDisplay(dbDate, 'KOREAN') // "2025년 10월 08일"
 *
 * @example
 * // DATE 타입
 * const dbDate = "2025-10-08"
 * formatDateForDisplay(dbDate) // "2025. 10. 08."
 */
export function formatDateForDisplay(
  dateStr: StandardDate | string,
  format: DateFormatType = 'FULL',
): string {
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
      logger.error('   Expected DB formats:')
      logger.error('   ✅ "YYYY-MM-DD" (e.g., "2025-10-08")')
      logger.error('   ✅ "YYYY-MM-DD HH:MM:SS+09" (e.g., "2025-10-08 11:24:23.373+09")')
      logger.error('')
      logger.error('   Make sure you are using ::text in your SQL query')
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
    const stack = new Error().stack

    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [formatDateForDisplay] Formatting error')
    logger.error('   Input:', dateStr)
    logger.error('   Format:', format)
    logger.error('   Error:', error)
    if (error instanceof Error) {
      logger.error('   Error message:', error.message)
      logger.error('   Error stack:')
      logger.error(error.stack || 'Error stack not available')
    }
    logger.error('')
    logger.error('   Function stack trace:')
    logger.error(stack || 'Stack trace not available')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return ''
  }
}

/**
 * DB 날짜 문자열을 HTML input[type="date"] 형식으로 변환
 *
 * @param dateStr - DB 문자열 (YYYY-MM-DD HH:MM:SS+09 또는 YYYY-MM-DD)
 * @returns YYYY-MM-DD 형식 문자열
 *
 * @example
 * const dbDate = "2025-10-08 11:24:23.373+09"
 * const inputValue = formatDateForInput(dbDate) // "2025-10-08"
 * // <input type="date" value={inputValue} />
 */
export function formatDateForInput(dateStr: StandardDate | string): string {
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
      logger.error('   Called from:', callerLine)
      logger.error('')
      logger.error('   Expected DB formats:')
      logger.error('   ✅ "YYYY-MM-DD" (e.g., "2025-10-08")')
      logger.error('   ✅ "YYYY-MM-DD HH:MM:SS+09" (e.g., "2025-10-08 11:24:23.373+09")')
      logger.error('')
      logger.error('   Stack trace:')
      logger.error(stack || 'Stack trace not available')
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return ''
    }
    return match[1]
  } catch (error) {
    const stack = new Error().stack

    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [formatDateForInput] Formatting error')
    logger.error('   Input:', dateStr)
    logger.error('   Error:', error)
    if (error instanceof Error) {
      logger.error('   Error message:', error.message)
      logger.error('   Error stack:')
      logger.error(error.stack || 'Error stack not available')
    }
    logger.error('')
    logger.error('   Function stack trace:')
    logger.error(stack || 'Stack trace not available')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return ''
  }
}

/**
 * DB 날짜 문자열을 HTML input[type="datetime-local"] 형식으로 변환
 *
 * @param dateStr - DB 문자열 (YYYY-MM-DD HH:MM:SS+09)
 * @returns YYYY-MM-DDTHH:MM 형식 문자열
 *
 * @example
 * const dbDate = "2025-10-08 11:24:23.373+09"
 * const inputValue = formatDateTimeForInput(dbDate) // "2025-10-08T11:24"
 * // <input type="datetime-local" value={inputValue} />
 */
export function formatDateTimeForInput(dateStr: StandardDate | string): string {
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
      logger.error('   Called from:', callerLine)
      logger.error('')
      logger.error('   Expected DB format:')
      logger.error('   ✅ "YYYY-MM-DD HH:MM:SS+09" (e.g., "2025-10-08 11:24:23.373+09")')
      logger.error('')
      logger.error('   Note: This function requires timestamp with time component')
      logger.error('   Use formatDateForInput() for date-only values')
      logger.error('')
      logger.error('   Stack trace:')
      logger.error(stack || 'Stack trace not available')
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return ''
    }

    return `${match[1]}T${match[2]}`
  } catch (error) {
    const stack = new Error().stack

    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [formatDateTimeForInput] Formatting error')
    logger.error('   Input:', dateStr)
    logger.error('   Error:', error)
    if (error instanceof Error) {
      logger.error('   Error message:', error.message)
      logger.error('   Error stack:')
      logger.error(error.stack || 'Error stack not available')
    }
    logger.error('')
    logger.error('   Function stack trace:')
    logger.error(stack || 'Stack trace not available')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return ''
  }
}

/**
 * 날짜 유효성 검사
 *
 * @param date - 검사할 날짜 (문자열 또는 Date 객체)
 * @returns 유효하면 true, 아니면 false
 *
 * @example
 * if (!isValidDate(userInput)) {
 *   throw new Error('올바른 날짜를 입력해주세요.')
 * }
 */
export function isValidDate(date: DateInputFormat): boolean {
  if (!date) return false

  try {
    // Date 객체 확인
    if (date instanceof Date) {
      return !isNaN(date.getTime())
    }

    // 문자열 확인 - YYYY-MM-DD 형식이거나 유효한 Date 문자열
    if (typeof date === 'string') {
      // YYYY-MM-DD 형식 체크
      if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
        const dateObj = new Date(date)
        return !isNaN(dateObj.getTime())
      }
      // 기타 유효한 날짜 문자열 체크
      const dateObj = new Date(date)
      return !isNaN(dateObj.getTime())
    }

    return false
  } catch {
    return false
  }
}

// =============================================
// Usage Examples (for documentation)
// =============================================

/**
 * 📚 사용 가이드라인
 *
 * 1. DB에 저장할 때:
 *    const utcDate = toUTC(userInput)
 *    await query('INSERT INTO table (date) VALUES ($1)', [utcDate])
 *
 * 2. DB에서 조회할 때:
 *    const result = await query('SELECT created_at::text FROM table')
 *    // result.rows[0].created_at = "2025-10-08 11:24:23.373+09"
 *
 * 3. 화면에 표시할 때:
 *    const displayDate = formatDateForDisplay(dbDate)
 *    // "2025. 10. 08."
 *
 * 4. HTML input에 바인딩할 때:
 *    <input type="date" value={formatDateForInput(dbDate)} />
 *
 * 5. datetime-local input에 바인딩할 때:
 *    <input type="datetime-local" value={formatDateTimeForInput(dbDate)} />
 *
 * 6. 현재 시간 저장할 때:
 *    const now = getCurrentUTC()
 *    await query('UPDATE table SET updated_at = $1', [now])
 *
 * 7. 입력 검증할 때:
 *    if (!isValidDate(userInput)) {
 *      throw new Error('올바른 날짜를 입력해주세요.')
 *    }
 */
