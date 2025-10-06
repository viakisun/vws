/**
 * 날짜 계산 전용 유틸리티 함수들
 * 모든 날짜 관련 계산을 중앙화하여 일관성 보장
 * UTC+9 (Asia/Seoul) 타임존 적용
 */

import { getCurrentUTC, toUTC, formatDateForInput } from './date-handler'

/**
 * 프로젝트 연차별 기간 계산 (UTC+9 타임존 적용)
 * @param projectStartDate 프로젝트 시작일
 * @param periodNumber 연차 번호 (1, 2, 3...)
 * @returns 해당 연차의 시작일과 종료일
 */
export function calculateAnnualPeriod(
  projectStartDate: string | Date,
  periodNumber: number,
): { startDate: string; endDate: string } {
  // UTC+9 타임존으로 입력 날짜 변환
  const startUtc = toUTC(projectStartDate)
  const start = new Date(startUtc)

  // 연차별 시작일 계산 (각 연차는 12개월)
  const periodStartDate = new Date(start)
  periodStartDate.setUTCFullYear(start.getUTCFullYear() + (periodNumber - 1))

  // 연차별 종료일 계산 (12개월 후의 전날)
  const periodEndDate = new Date(periodStartDate)
  periodEndDate.setUTCMonth(periodEndDate.getUTCMonth() + 12)
  periodEndDate.setUTCDate(periodEndDate.getUTCDate() - 1)

  return {
    startDate: formatDateForAPI(periodStartDate),
    endDate: formatDateForAPI(periodEndDate),
  }
}

/**
 * 참여연구원 참여기간 검증 및 계산 (UTC+9 타임존 적용)
 * @param participationStartDate 참여 시작일
 * @param participationEndDate 참여 종료일
 * @param projectStartDate 프로젝트 시작일
 * @param projectEndDate 프로젝트 종료일
 * @returns 검증 결과와 정규화된 날짜
 */
export function calculateParticipationPeriod(
  participationStartDate: string | Date,
  participationEndDate: string | Date,
  projectStartDate: string | Date,
  projectEndDate: string | Date,
): {
  isValid: boolean
  normalizedStartDate: string
  normalizedEndDate: string
  errorMessage?: string
} {
  // UTC+9 타임존으로 모든 날짜 변환
  const partStartUtc = toUTC(participationStartDate)
  const partEndUtc = toUTC(participationEndDate)
  const projStartUtc = toUTC(projectStartDate)
  const projEndUtc = toUTC(projectEndDate)

  const partStart = new Date(partStartUtc)
  const partEnd = new Date(partEndUtc)
  const projStart = new Date(projStartUtc)
  const projEnd = new Date(projEndUtc)

  // 참여 시작일이 프로젝트 종료일보다 늦으면 유효하지 않음
  if (partStart > projEnd) {
    return {
      isValid: false,
      normalizedStartDate: '',
      normalizedEndDate: '',
      errorMessage: '참여 시작일이 프로젝트 종료일보다 늦습니다.',
    }
  }

  // 참여 종료일이 프로젝트 시작일보다 이르면 유효하지 않음
  if (partEnd < projStart) {
    return {
      isValid: false,
      normalizedStartDate: '',
      normalizedEndDate: '',
      errorMessage: '참여 종료일이 프로젝트 시작일보다 이릅니다.',
    }
  }

  // 참여 시작일을 프로젝트 범위 내로 정규화
  const normalizedStartDate = partStart < projStart ? projStart : partStart

  // 참여 종료일을 프로젝트 범위 내로 정규화
  const normalizedEndDate = partEnd > projEnd ? projEnd : partEnd

  return {
    isValid: true,
    normalizedStartDate: formatDateForAPI(normalizedStartDate),
    normalizedEndDate: formatDateForAPI(normalizedEndDate),
  }
}

/**
 * 계약 기간과 프로젝트 기간의 겹침 검증
 * @param contractStartDate 계약 시작일
 * @param contractEndDate 계약 종료일
 * @param participationStartDate 참여 시작일
 * @param participationEndDate 참여 종료일
 * @returns 겹침 검증 결과
 */
export function validateContractOverlap(
  contractStartDate: string | Date,
  contractEndDate: string | Date,
  participationStartDate: string | Date,
  participationEndDate: string | Date,
): {
  hasOverlap: boolean
  overlapStartDate?: string
  overlapEndDate?: string
  errorMessage?: string
} {
  const contractStart = new Date(contractStartDate)
  const contractEnd = new Date(contractEndDate)
  const partStart = new Date(participationStartDate)
  const partEnd = new Date(participationEndDate)

  // 계약 종료일이 참여 시작일보다 이르면 겹치지 않음
  if (contractEnd < partStart) {
    return {
      hasOverlap: false,
      errorMessage: '계약 종료일이 참여 시작일보다 이릅니다.',
    }
  }

  // 계약 시작일이 참여 종료일보다 늦으면 겹치지 않음
  if (contractStart > partEnd) {
    return {
      hasOverlap: false,
      errorMessage: '계약 시작일이 참여 종료일보다 늦습니다.',
    }
  }

  // 겹치는 기간 계산
  const overlapStart = contractStart > partStart ? contractStart : partStart
  const overlapEnd = contractEnd < partEnd ? contractEnd : partEnd

  return {
    hasOverlap: true,
    overlapStartDate: formatDateForAPI(overlapStart),
    overlapEndDate: formatDateForAPI(overlapEnd),
  }
}

/**
 * 날짜를 API 형식(YYYY-MM-DD)으로 포맷 (UTC+9 타임존 적용)
 * @param date 날짜 객체 또는 문자열
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export function formatDateForAPI(date: string | Date): string {
  if (!date) return ''

  // 문자열인 경우
  if (typeof date === 'string') {
    // YYYY-MM-DD 형식인 경우 그대로 반환
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }

    // YYYY. MM. DD. 형식인 경우 (processQueryResultDates가 변환한 형식)
    const koreanDotMatch = date.match(/^(\d{4})\.\s*(\d{2})\.\s*(\d{2})\.?$/)
    if (koreanDotMatch) {
      return `${koreanDotMatch[1]}-${koreanDotMatch[2]}-${koreanDotMatch[3]}`
    }

    // ISO 8601 형식 (UTC)인 경우
    if (date.includes('T') || date.includes('Z')) {
      return formatDateForInput(date)
    }
  }

  // Date 객체인 경우 UTC+9 타임존으로 해석하여 날짜 부분만 추출
  if (date instanceof Date) {
    const utcPlus9 = new Date(date.getTime() + 9 * 60 * 60 * 1000)
    const year = utcPlus9.getUTCFullYear()
    const month = String(utcPlus9.getUTCMonth() + 1).padStart(2, '0')
    const day = String(utcPlus9.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 다른 형식의 문자열인 경우 기존 로직 사용
  return formatDateForInput(toUTC(date))
}

/**
 * 날짜를 한국어 형식으로 포맷 (UTC+9 타임존 적용)
 * @param date 날짜 객체 또는 문자열
 * @returns YYYY년 MM월 DD일 형식의 날짜 문자열
 */
export function formatDateForKorean(date: string | Date): string {
  // 문자열인 경우 UTC+9 타임존으로 해석
  if (typeof date === 'string') {
    // YYYY-MM-DD 형식인 경우 UTC+9 자정으로 해석
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const d = new Date(date + 'T00:00:00.000+09:00')
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      return `${year}년 ${month}월 ${day}일`
    }
  }

  // Date 객체이거나 다른 형식의 문자열인 경우 기존 로직 사용
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${year}년 ${month}월 ${day}일`
}

/**
 * 두 날짜 사이의 일수 계산
 * @param startDate 시작일
 * @param endDate 종료일
 * @returns 일수 차이
 */
export function calculateDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 현재 날짜를 API 형식으로 반환 (UTC+9 타임존 적용)
 * @returns 오늘 날짜 (YYYY-MM-DD)
 */
export function getCurrentDateForAPI(): string {
  // UTC+9 타임존의 현재 시간을 가져와서 API 형식으로 변환
  const currentUtc = getCurrentUTC()
  return formatDateForAPI(currentUtc)
}

/**
 * 날짜 유효성 검증
 * @param dateString 날짜 문자열
 * @returns 유효한 날짜인지 여부
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * 날짜 범위 검증
 * @param startDate 시작일
 * @param endDate 종료일
 * @returns 시작일이 종료일보다 이른지 여부
 */
export function isValidDateRange(startDate: string | Date, endDate: string | Date): boolean {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return start <= end
}
