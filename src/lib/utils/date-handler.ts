import { logger } from '$lib/utils/logger'

/**
 * 통일된 날짜 처리 유틸리티
 *
 * 핵심 원칙:
 * - 저장: 사용자 입력 → UTC 변환
 * - 표시: UTC → 서울 시간 변환
 * - 입력: UTC → HTML input 형식
 */

/**
 * 표준화된 날짜 타입 (UTC ISO 8601 문자열)
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
  FULL: 'YYYY. MM. DD.', // 2025. 01. 15.
  SHORT: 'MM/DD', // 01/15
  ISO: 'YYYY-MM-DD', // 2025-01-15
  KOREAN: 'YYYY년 MM월 DD일', // 2025년 01월 15일
} as const

export type DateFormatType = keyof typeof DATE_FORMATS

/**
 * 시간대 상수
 */
const TIMEZONE_CONFIG = {
  SEOUL: 'Asia/Seoul',
  SEOUL_OFFSET: '+09:00',
  EXCEL_EPOCH: 25569, // Excel date threshold
} as const

/**
 * 날짜 패턴 정규식
 */
const DATE_PATTERNS = {
  KOREAN_DOT: /^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?$/, // 2025. 08. 31.
  ISO_DATE: /^\d{4}-\d{1,2}-\d{1,2}$/, // 2025-08-31
  ISO_DATETIME: /^\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}$/, // 2025-04-07 11:37:29
  US_DATE: /^\d{1,2}\/\d{1,2}\/\d{4}$/, // 08/31/2025
  SLASH_DATETIME: /^\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}$/, // 2025/04/07 11:37:29
  SIMPLE_DOT: /^\d{4}\.\d{1,2}\.\d{1,2}$/, // 2025.08.31
} as const

// =============================================
// Private Helper Functions
// =============================================

/**
 * Check if a date string matches any valid pattern
 */
function isValidDateString(dateStr: string): boolean {
  const trimmed = dateStr.trim()
  if (!trimmed) return false

  // Try basic Date constructor
  const testDate = new Date(trimmed)
  if (!isNaN(testDate.getTime())) return true

  // Test against known patterns
  return Object.values(DATE_PATTERNS).some((pattern) => pattern.test(trimmed))
}

/**
 * Convert Excel serial date to JavaScript Date
 */
function excelSerialToDate(serial: number): Date {
  const excelEpoch = new Date(1900, 0, 1)
  return new Date(excelEpoch.getTime() + (serial - 2) * 24 * 60 * 60 * 1000)
}

/**
 * Convert Unix timestamp to JavaScript Date
 */
function unixTimestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000)
}

/**
 * Parse numeric date (Excel or Unix timestamp)
 */
function parseNumericDate(num: number): Date {
  return num > TIMEZONE_CONFIG.EXCEL_EPOCH ? excelSerialToDate(num) : unixTimestampToDate(num)
}

/**
 * Create Seoul timezone date string
 */
function createSeoulDateString(
  year: string,
  month: string,
  day: string,
  time = '00:00:00',
): string {
  const paddedMonth = month.padStart(2, '0')
  const paddedDay = day.padStart(2, '0')
  return `${year}-${paddedMonth}-${paddedDay}T${time}${TIMEZONE_CONFIG.SEOUL_OFFSET}`
}

/**
 * Parse Korean dot format (YYYY.MM.DD)
 */
function parseKoreanDotFormat(dateStr: string): Date {
  const parts = dateStr
    .split('.')
    .map((part) => part.trim())
    .filter((part) => part !== '')

  if (parts.length < 3) {
    throw new Error(`Invalid Korean dot format: ${dateStr}`)
  }

  const [year, month, day] = parts
  return new Date(createSeoulDateString(year, month, day))
}

/**
 * Parse ISO format with optional time (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
 */
function parseISOFormat(dateStr: string): Date {
  if (dateStr.includes(' ')) {
    // Has time component
    return new Date(`${dateStr.replace(' ', 'T')}${TIMEZONE_CONFIG.SEOUL_OFFSET}`)
  }

  // Date only
  const parts = dateStr.split('-').map((part) => part.trim())
  if (parts.length < 3) {
    throw new Error(`Invalid ISO format: ${dateStr}`)
  }

  const [year, month, day] = parts
  return new Date(createSeoulDateString(year, month, day))
}

/**
 * Parse slash format (MM/DD/YYYY or YYYY/MM/DD HH:MM:SS)
 */
function parseSlashFormat(dateStr: string): Date {
  if (dateStr.includes(' ')) {
    // YYYY/MM/DD HH:MM:SS format
    const isoFormat = `${dateStr.replace(' ', 'T').replace(/\//g, '-')}${TIMEZONE_CONFIG.SEOUL_OFFSET}`
    return new Date(isoFormat)
  }

  // MM/DD/YYYY format
  const parts = dateStr.split('/').map((part) => part.trim())
  if (parts.length !== 3) {
    throw new Error(`Invalid slash format: ${dateStr}`)
  }

  const [month, day, year] = parts
  return new Date(createSeoulDateString(year, month, day))
}

/**
 * Parse ISO 8601 with timezone
 */
function parseISO8601(dateStr: string): Date {
  if (dateStr.includes('+') || dateStr.includes('Z') || dateStr.includes('-', 10)) {
    return new Date(dateStr)
  }
  // No timezone info - interpret as Seoul time
  return new Date(`${dateStr}${TIMEZONE_CONFIG.SEOUL_OFFSET}`)
}

/**
 * Fallback parser for unrecognized formats
 */
function parseFallbackFormat(dateStr: string): Date {
  const tempDate = new Date(dateStr)
  if (isNaN(tempDate.getTime())) {
    return tempDate
  }

  // Re-interpret as Seoul time
  const year = tempDate.getFullYear()
  const month = String(tempDate.getMonth() + 1)
  const day = String(tempDate.getDate())
  return new Date(createSeoulDateString(String(year), month, day))
}

/**
 * Parse string date into Date object (interpreted as Seoul time)
 */
function parseStringDate(dateStr: string): Date {
  const trimmed = dateStr.trim()
  if (!trimmed) {
    throw new Error('Empty date string')
  }

  if (!isValidDateString(trimmed)) {
    throw new Error(`Invalid date format: ${trimmed}`)
  }

  // ISO 8601 with T separator
  if (trimmed.includes('T')) {
    return parseISO8601(trimmed)
  }

  // Korean dot format
  if (trimmed.includes('.')) {
    return parseKoreanDotFormat(trimmed)
  }

  // ISO format with dash
  if (trimmed.includes('-')) {
    return parseISOFormat(trimmed)
  }

  // Slash format
  if (trimmed.includes('/')) {
    return parseSlashFormat(trimmed)
  }

  // Fallback to default parsing
  return parseFallbackFormat(trimmed)
}

/**
 * Convert date input to Date object
 */
function convertToDateObject(date: DateInputFormat): Date {
  if (date instanceof Date) {
    return date
  }

  if (typeof date === 'number') {
    return parseNumericDate(date)
  }

  return parseStringDate(String(date))
}

/**
 * Convert Date to Seoul timezone
 */
function convertToSeoulTime(date: Date): Date {
  const seoulString = date.toLocaleString('en-US', { timeZone: TIMEZONE_CONFIG.SEOUL })
  return new Date(seoulString)
}

/**
 * Extract date components from Date object
 */
function extractDateComponents(date: Date): { year: string; month: string; day: string } {
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
  }
}

/**
 * Format date components according to specified format
 */
function formatDateComponents(
  year: string,
  month: string,
  day: string,
  format: DateFormatType,
): string {
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
}

// =============================================
// Public API Functions
// =============================================

/**
 * Test date conversion (Development only)
 */
export function testDateConversion(testDates: string[]): void {
  logger.log('🧪 날짜 변환 테스트 시작...')
  testDates.forEach((dateStr) => {
    try {
      const result = toUTC(dateStr)
      logger.log(`✅ ${dateStr} → ${result}`)
    } catch (error) {
      logger.log(
        `❌ ${dateStr} → Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  })
  logger.log('🧪 날짜 변환 테스트 완료')
}

/**
 * 🔥 저장용: 사용자 입력을 UTC로 변환
 *
 * 사용법: 데이터베이스에 저장할 때
 * 예시: const utcDate = toUTC(userInput)
 */
export function toUTC(date: DateInputFormat): StandardDate {
  if (!date) return '' as StandardDate

  try {
    const dateObj = convertToDateObject(date)

    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`)
    }

    return dateObj.toISOString() as StandardDate
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Date conversion error:', errorMessage, 'for input:', date)
    return '' as StandardDate
  }
}

/**
 * 🔥 표시용: UTC 날짜를 서울 시간으로 변환하여 표시
 *
 * 사용법: 사용자에게 날짜를 표시할 때
 * 예시: const displayDate = formatDateForDisplay(utcDate)
 */
export function formatDateForDisplay(
  utcDate: StandardDate | string,
  format: DateFormatType = 'FULL',
): string {
  if (!utcDate) return ''

  try {
    const normalizedDate = normalizeDisplayDate(utcDate.toString())
    const date = new Date(normalizedDate)

    if (isNaN(date.getTime())) {
      logger.warn('Invalid UTC date for display:', utcDate)
      return ''
    }

    const seoulDate = convertToSeoulTime(date)
    const { year, month, day } = extractDateComponents(seoulDate)

    return formatDateComponents(year, month, day, format)
  } catch (error) {
    logger.error('Date display formatting error:', error, 'for date:', utcDate)
    return ''
  }
}

/**
 * Normalize display date format (handles YYYY. MM. DD. format)
 */
function normalizeDisplayDate(dateStr: string): string {
  let normalized = dateStr.trim()

  if (normalized.includes('.')) {
    normalized = normalized
      .replace(/\s+/g, '') // Remove all whitespace
      .replace(/\./g, '-') // Convert dots to dashes
      .replace(/-$/, '') // Remove trailing dash
  }

  return normalized
}

/**
 * 🔥 입력용: UTC 날짜를 HTML input 형식으로 변환
 *
 * 사용법: HTML date input에 바인딩할 때
 * 예시: <input type="date" bind:value={formatDateForInput(utcDate)} />
 */
export function formatDateForInput(utcDate: StandardDate | string): string {
  if (!utcDate) return ''

  try {
    const date = new Date(utcDate)
    if (isNaN(date.getTime())) {
      return ''
    }

    const seoulDate = convertToSeoulTime(date)
    const { year, month, day } = extractDateComponents(seoulDate)

    return `${year}-${month}-${day}`
  } catch (error) {
    logger.error('Date input formatting error:', error, 'for date:', utcDate)
    return ''
  }
}

/**
 * 🔥 입력용: UTC 날짜를 datetime-local 형식으로 변환
 *
 * 사용법: datetime-local 입력 필드에 사용
 * 예시: <input type="datetime-local" bind:value={formatDateTimeForInput(utcDate)} />
 */
export function formatDateTimeForInput(utcDate: StandardDate | string): string {
  if (!utcDate) return ''

  try {
    const date = new Date(utcDate)
    if (isNaN(date.getTime())) {
      return ''
    }

    const seoulDate = convertToSeoulTime(date)
    const { year, month, day } = extractDateComponents(seoulDate)
    const hours = String(seoulDate.getHours()).padStart(2, '0')
    const minutes = String(seoulDate.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    logger.error('DateTime input formatting error:', error, 'for date:', utcDate)
    return ''
  }
}

/**
 * 🔥 현재시간: 현재 시간을 UTC로 반환
 *
 * 사용법: 현재 시간을 저장할 때
 * 예시: const now = getCurrentUTC()
 */
export function getCurrentUTC(): StandardDate {
  return new Date().toISOString() as StandardDate
}

/**
 * 🔥 검증용: 날짜 유효성 검사
 *
 * 사용법: 사용자 입력 검증할 때
 * 예시: if (!isValidDate(userInput)) { throw new Error('Invalid date') }
 */
export function isValidDate(date: DateInputFormat): boolean {
  try {
    const utcDate = toUTC(date)
    return utcDate !== '' && !isNaN(new Date(utcDate).getTime())
  } catch {
    return false
  }
}

// =============================================
// 사용 가이드라인
// =============================================

/**
 * 📚 사용 가이드라인
 *
 * 1. 저장할 때:
 *    const utcDate = toUTC(userInput)
 *    await query('INSERT INTO table (date) VALUES ($1)', [utcDate])
 *
 * 2. 표시할 때:
 *    const displayDate = formatDateForDisplay(utcDate)
 *    <span>{displayDate}</span>
 *
 * 3. HTML input에 바인딩할 때:
 *    <input type="date" bind:value={formatDateForInput(utcDate)} />
 *
 * 4. 현재 시간 저장할 때:
 *    const now = getCurrentUTC()
 *    await query('UPDATE table SET updated_at = $1', [now])
 *
 * 5. 입력 검증할 때:
 *    if (!isValidDate(userInput)) {
 *      throw new Error('올바른 날짜를 입력해주세요.')
 *    }
 */
