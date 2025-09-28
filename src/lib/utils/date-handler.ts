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

/**
 * 시간대 상수
 */
const SEOUL_TIMEZONE = 'Asia/Seoul'
const SEOUL_OFFSET = '+09:00'

// =============================================
// 핵심 함수들 (5개만 유지)
// =============================================

/**
 * 🔥 저장용: 사용자 입력을 UTC로 변환
 *
 * 사용법: 데이터베이스에 저장할 때
 * 예시: const utcDate = toUTC(userInput)
 */
export function toUTC(date: DateInputFormat): StandardDate {
  if (!date) return '' as StandardDate

  try {
    let dateObj: Date

    if (date instanceof Date) {
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
      // 문자열 처리 - 서울 시간대로 해석하여 UTC로 변환
      const dateStr = String(date).trim()
      if (!dateStr) return '' as StandardDate

      if (dateStr.includes('T')) {
        // ISO 8601 형식
        if (dateStr.includes('+') || dateStr.includes('Z') || dateStr.includes('-', 10)) {
          dateObj = new Date(dateStr)
        } else {
          // 시간대 정보가 없으면 서울 시간대로 해석
          dateObj = new Date(`${dateStr}${SEOUL_OFFSET}`)
        }
      } else if (dateStr.includes('.')) {
        // YYYY.MM.DD 형식 - 서울 시간대 자정으로 해석
        const [year, month, day] = dateStr.split('.')
        dateObj = new Date(
          `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00${SEOUL_OFFSET}`,
        )
      } else if (dateStr.includes('-')) {
        // YYYY-MM-DD 형식 - 서울 시간대 자정으로 해석
        const [year, month, day] = dateStr.split('-')
        dateObj = new Date(
          `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00${SEOUL_OFFSET}`,
        )
      } else if (dateStr.includes('/')) {
        // MM/DD/YYYY 형식 - 서울 시간대 자정으로 해석
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          const [month, day, year] = parts
          dateObj = new Date(
            `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00${SEOUL_OFFSET}`,
          )
        } else {
          dateObj = new Date(dateStr)
        }
      } else {
        // 기본 Date 생성자 사용 후 서울 시간대로 재해석
        const tempDate = new Date(dateStr)
        if (!isNaN(tempDate.getTime())) {
          const year = tempDate.getFullYear()
          const month = String(tempDate.getMonth() + 1).padStart(2, '0')
          const day = String(tempDate.getDate()).padStart(2, '0')
          dateObj = new Date(`${year}-${month}-${day}T00:00:00${SEOUL_OFFSET}`)
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
  format: keyof typeof DATE_FORMATS = 'FULL',
): string {
  if (!utcDate) return ''

  try {
    // 날짜 형식 정규화
    let normalizedDate = utcDate.toString().trim()
    
    // YYYY. MM. DD. 형식을 YYYY-MM-DD로 변환 (공백 제거 포함)
    if (normalizedDate.includes('.')) {
      normalizedDate = normalizedDate
        .replace(/\s+/g, '') // 모든 공백 제거
        .replace(/\./g, '-') // 점을 하이픈으로 변환
        .replace(/-$/, '') // 끝의 하이픈 제거
    }
    
    // 이미 ISO 형식인지 확인
    const date = new Date(normalizedDate)
    if (isNaN(date.getTime())) {
      // 다른 형식 시도
      const altDate = new Date(utcDate.toString())
      if (isNaN(altDate.getTime())) {
        logger.warn('Invalid UTC date for display:', utcDate)
        return ''
      }
      // altDate 사용
      const year = altDate.getFullYear()
      const month = String(altDate.getMonth() + 1).padStart(2, '0')
      const day = String(altDate.getDate()).padStart(2, '0')
      
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

    // 서울 시간대로 변환
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: SEOUL_TIMEZONE }))

    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')

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
    logger.error('Date display formatting error:', error, 'for date:', utcDate)
    return ''
  }
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

    // 서울 시간대로 변환하여 YYYY-MM-DD 형식으로 반환
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: SEOUL_TIMEZONE }))

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
