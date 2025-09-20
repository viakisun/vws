/**
 * UTC 기준 시간 처리 유틸리티
 * 모든 시간 처리를 UTC 기준으로 하고, 타임존 변환을 명확하게 관리합니다.
 */

import { toUTC } from './date-handler'

// 지원하는 타임존 목록 (확장 가능)
export const SUPPORTED_TIMEZONES = {
	UTC: 'UTC',
	KST: 'Asia/Seoul', // 한국 표준시 (UTC+9)
	JST: 'Asia/Tokyo', // 일본 표준시 (UTC+9)
	EST: 'America/New_York', // 미국 동부 표준시 (UTC-5)
	PST: 'America/Los_Angeles', // 미국 서부 표준시 (UTC-8)
	GMT: 'Europe/London', // 그리니치 표준시 (UTC+0)
	CET: 'Europe/Paris', // 중앙유럽 표준시 (UTC+1)
	CST: 'Asia/Shanghai', // 중국 표준시 (UTC+8)
	IST: 'Asia/Kolkata', // 인도 표준시 (UTC+5:30)
	AEST: 'Australia/Sydney', // 호주 동부 표준시 (UTC+10)
	NZST: 'Pacific/Auckland' // 뉴질랜드 표준시 (UTC+12)
} as const

export type Timezone = keyof typeof SUPPORTED_TIMEZONES

// 기본 타임존 설정 (한국 표준시)
export const DEFAULT_TIMEZONE: Timezone = 'KST'

/**
 * UTC 시간을 특정 타임존의 로컬 시간으로 변환
 * @param utcDate UTC 시간
 * @param timezone 변환할 타임존
 * @returns 변환된 로컬 시간
 */
export function utcToLocal(utcDate: Date, timezone: Timezone = DEFAULT_TIMEZONE): Date {
	if (!utcDate || isNaN(utcDate.getTime())) {
		throw new Error('Invalid UTC date provided')
	}

	// 표준 날짜 처리 함수 사용
	const utcString = utcDate.toISOString()
	const localDate = new Date(toUTC(utcString))
	return localDate
}

/**
 * 로컬 시간을 UTC 시간으로 변환
 * @param localDate 로컬 시간
 * @param timezone 로컬 시간의 타임존
 * @returns UTC 시간
 */
export function localToUtc(localDate: Date, timezone: Timezone = DEFAULT_TIMEZONE): Date {
	if (!localDate || isNaN(localDate.getTime())) {
		throw new Error('Invalid local date provided')
	}

	const timezoneString = SUPPORTED_TIMEZONES[timezone]
	// 표준 날짜 처리 함수 사용
	const utcDate = new Date(toUTC(localDate.toISOString()))

	// 타임존 오프셋을 고려하여 UTC로 변환
	const offset = getTimezoneOffset(timezone)
	return new Date(utcDate.getTime() - offset * 60 * 1000)
}

/**
 * 타임존 오프셋을 분 단위로 반환
 * @param timezone 타임존
 * @returns 오프셋 (분)
 */
export function getTimezoneOffset(timezone: Timezone): number {
	const offsets: Record<Timezone, number> = {
		UTC: 0,
		KST: -540, // UTC+9 = -540분
		JST: -540, // UTC+9 = -540분
		EST: 300, // UTC-5 = +300분
		PST: 480, // UTC-8 = +480분
		GMT: 0, // UTC+0 = 0분
		CET: -60, // UTC+1 = -60분
		CST: -480, // UTC+8 = -480분
		IST: -330, // UTC+5:30 = -330분
		AEST: -600, // UTC+10 = -600분
		NZST: -720 // UTC+12 = -720분
	}

	return offsets[timezone]
}

/**
 * UTC 시간을 YYYY-MM-DD 형식의 문자열로 변환 (로컬 타임존 기준)
 * @param utcDate UTC 시간
 * @param timezone 변환할 타임존
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export function utcToDateString(utcDate: Date, timezone: Timezone = DEFAULT_TIMEZONE): string {
	const localDate = utcToLocal(utcDate, timezone)
	const year = localDate.getFullYear()
	const month = String(localDate.getMonth() + 1).padStart(2, '0')
	const day = String(localDate.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

/**
 * YYYY-MM-DD 형식의 문자열을 UTC 시간으로 변환
 * @param dateString YYYY-MM-DD 형식의 날짜 문자열
 * @param timezone 입력 날짜의 타임존
 * @returns UTC 시간
 */
export function dateStringToUtc(dateString: string, timezone: Timezone = DEFAULT_TIMEZONE): Date {
	if (!dateString || !dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
		throw new Error('Invalid date string format. Expected YYYY-MM-DD')
	}

	// 로컬 타임존에서 자정으로 해석
	const [year, month, day] = dateString.split('-').map(Number)
	const localDate = new Date(year, month - 1, day, 0, 0, 0, 0)

	return localToUtc(localDate, timezone)
}

/**
 * UTC 시간을 HH:MM:SS 형식의 시간 문자열로 변환 (로컬 타임존 기준)
 * @param utcDate UTC 시간
 * @param timezone 변환할 타임존
 * @returns HH:MM:SS 형식의 시간 문자열
 */
export function utcToTimeString(utcDate: Date, timezone: Timezone = DEFAULT_TIMEZONE): string {
	const localDate = utcToLocal(utcDate, timezone)
	const hours = String(localDate.getHours()).padStart(2, '0')
	const minutes = String(localDate.getMinutes()).padStart(2, '0')
	const seconds = String(localDate.getSeconds()).padStart(2, '0')
	return `${hours}:${minutes}:${seconds}`
}

/**
 * UTC 시간을 YYYY-MM-DD HH:MM:SS 형식의 문자열로 변환 (로컬 타임존 기준)
 * @param utcDate UTC 시간
 * @param timezone 변환할 타임존
 * @returns YYYY-MM-DD HH:MM:SS 형식의 날짜시간 문자열
 */
export function utcToDateTimeString(utcDate: Date, timezone: Timezone = DEFAULT_TIMEZONE): string {
	const localDate = utcToLocal(utcDate, timezone)
	const dateString = utcToDateString(utcDate, timezone)
	const timeString = utcToTimeString(utcDate, timezone)
	return `${dateString} ${timeString}`
}

/**
 * 현재 UTC 시간을 반환
 * @returns 현재 UTC 시간
 */
export function getCurrentUtcTime(): Date {
	return new Date()
}

/**
 * 현재 로컬 시간을 반환 (지정된 타임존 기준)
 * @param timezone 타임존
 * @returns 현재 로컬 시간
 */
export function getCurrentLocalTime(timezone: Timezone = DEFAULT_TIMEZONE): Date {
	return utcToLocal(getCurrentUtcTime(), timezone)
}

/**
 * 두 UTC 시간 사이의 일수를 계산
 * @param startUtc 시작 UTC 시간
 * @param endUtc 종료 UTC 시간
 * @returns 일수
 */
export function getDaysBetweenUtc(startUtc: Date, endUtc: Date): number {
	if (!startUtc || !endUtc || isNaN(startUtc.getTime()) || isNaN(endUtc.getTime())) {
		throw new Error('Invalid UTC dates provided')
	}

	const diffTime = endUtc.getTime() - startUtc.getTime()
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * UTC 시간에 일수를 더함
 * @param utcDate 기준 UTC 시간
 * @param days 더할 일수
 * @returns 계산된 UTC 시간
 */
export function addDaysToUtc(utcDate: Date, days: number): Date {
	if (!utcDate || isNaN(utcDate.getTime())) {
		throw new Error('Invalid UTC date provided')
	}

	const result = new Date(utcDate)
	result.setUTCDate(result.getUTCDate() + days)
	return result
}

/**
 * UTC 시간에서 일수를 뺌
 * @param utcDate 기준 UTC 시간
 * @param days 뺄 일수
 * @returns 계산된 UTC 시간
 */
export function subtractDaysFromUtc(utcDate: Date, days: number): Date {
	return addDaysToUtc(utcDate, -days)
}

/**
 * UTC 시간을 특정 타임존의 로컬 시간으로 포맷팅
 * @param utcDate UTC 시간
 * @param timezone 타임존
 * @param options Intl.DateTimeFormatOptions
 * @returns 포맷팅된 문자열
 */
export function formatUtcToLocal(
	utcDate: Date,
	timezone: Timezone = DEFAULT_TIMEZONE,
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		timeZoneName: 'short'
	}
): string {
	if (!utcDate || isNaN(utcDate.getTime())) {
		throw new Error('Invalid UTC date provided')
	}

	// 표준 날짜 처리 함수 사용
	return formatUtcToLocal(utcDate, timezone, options)
}

/**
 * 날짜 입력 필드용 UTC 시간 변환 (YYYY-MM-DD 형식)
 * @param utcDate UTC 시간
 * @param timezone 타임존
 * @returns HTML date input용 YYYY-MM-DD 형식
 */
export function utcToDateInput(utcDate: Date, timezone: Timezone = DEFAULT_TIMEZONE): string {
	return utcToDateString(utcDate, timezone)
}

/**
 * HTML date input 값을 UTC 시간으로 변환
 * @param dateInputValue HTML date input의 값 (YYYY-MM-DD)
 * @param timezone 입력 값의 타임존
 * @returns UTC 시간
 */
export function dateInputToUtc(
	dateInputValue: string,
	timezone: Timezone = DEFAULT_TIMEZONE
): Date {
	return dateStringToUtc(dateInputValue, timezone)
}

/**
 * 데이터베이스 저장용 UTC 시간 문자열 생성
 * @param utcDate UTC 시간
 * @returns ISO 8601 형식의 UTC 시간 문자열
 */
export function utcToDbString(utcDate: Date): string {
	if (!utcDate || isNaN(utcDate.getTime())) {
		throw new Error('Invalid UTC date provided')
	}

	return utcDate.toISOString()
}

/**
 * 데이터베이스에서 가져온 UTC 시간 문자열을 Date 객체로 변환
 * @param dbString ISO 8601 형식의 UTC 시간 문자열
 * @returns UTC Date 객체
 */
export function dbStringToUtc(dbString: string): Date {
	if (!dbString) {
		throw new Error('Invalid database string provided')
	}

	const date = new Date(dbString)
	if (isNaN(date.getTime())) {
		throw new Error('Invalid database string format')
	}

	return date
}

/**
 * 타임존 정보를 포함한 시간 정보 객체
 */
export interface TimeInfo {
	utc: Date
	local: Date
	timezone: Timezone
	dateString: string // YYYY-MM-DD
	timeString: string // HH:MM:SS
	dateTimeString: string // YYYY-MM-DD HH:MM:SS
	formatted: string // 포맷팅된 문자열
}

/**
 * UTC 시간을 모든 형식으로 변환하여 반환
 * @param utcDate UTC 시간
 * @param timezone 타임존
 * @returns 시간 정보 객체
 */
export function getTimeInfo(utcDate: Date, timezone: Timezone = DEFAULT_TIMEZONE): TimeInfo {
	const local = utcToLocal(utcDate, timezone)

	return {
		utc: utcDate,
		local,
		timezone,
		dateString: utcToDateString(utcDate, timezone),
		timeString: utcToTimeString(utcDate, timezone),
		dateTimeString: utcToDateTimeString(utcDate, timezone),
		formatted: formatUtcToLocal(utcDate, timezone)
	}
}
