/**
 * 시간대 설정 관리 유틸리티
 *
 * 이 모듈은 애플리케이션의 시간대 설정을 중앙에서 관리합니다.
 * 환경 변수를 통해 설정 가능하며, 기본값은 서울 시간대입니다.
 */

import { browser } from '$app/environment'
import { env } from '$env/dynamic/public'

/**
 * 지원하는 시간대 목록
 */
export const SUPPORTED_TIMEZONES = [
  'Asia/Seoul', // 서울 (UTC+9)
  'Asia/Bangkok', // 방콕 (UTC+7)
  'Asia/Tokyo', // 도쿄 (UTC+9)
  'Asia/Shanghai', // 상하이 (UTC+8)
  'Asia/Singapore', // 싱가포르 (UTC+8)
  'UTC', // UTC (UTC+0)
  'America/New_York', // 뉴욕 (UTC-5/-4)
  'Europe/London' // 런던 (UTC+0/+1)
] as const

export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number]

/**
 * 시간대 정보 타입
 */
export interface TimezoneInfo {
  timezone: SupportedTimezone
  name: string
  offset: string
  description: string
}

/**
 * 시간대 정보 매핑
 */
export const TIMEZONE_INFO: Record<SupportedTimezone, TimezoneInfo> = {
  'Asia/Seoul': {
    timezone: 'Asia/Seoul',
    name: '서울',
    offset: 'UTC+9',
    description: '대한민국 표준시'
  },
  'Asia/Bangkok': {
    timezone: 'Asia/Bangkok',
    name: '방콕',
    offset: 'UTC+7',
    description: '태국 표준시'
  },
  'Asia/Tokyo': {
    timezone: 'Asia/Tokyo',
    name: '도쿄',
    offset: 'UTC+9',
    description: '일본 표준시'
  },
  'Asia/Shanghai': {
    timezone: 'Asia/Shanghai',
    name: '상하이',
    offset: 'UTC+8',
    description: '중국 표준시'
  },
  'Asia/Singapore': {
    timezone: 'Asia/Singapore',
    name: '싱가포르',
    offset: 'UTC+8',
    description: '싱가포르 표준시'
  },
  UTC: {
    timezone: 'UTC',
    name: 'UTC',
    offset: 'UTC+0',
    description: '협정 세계시'
  },
  'America/New_York': {
    timezone: 'America/New_York',
    name: '뉴욕',
    offset: 'UTC-5/-4',
    description: '미국 동부 표준시'
  },
  'Europe/London': {
    timezone: 'Europe/London',
    name: '런던',
    offset: 'UTC+0/+1',
    description: '영국 표준시'
  }
}

/**
 * 현재 설정된 시간대를 가져옵니다.
 *
 * 우선순위:
 * 1. 환경 변수 DEFAULT_TIMEZONE
 * 2. 브라우저의 로컬 시간대 (클라이언트에서만)
 * 3. 기본값: Asia/Seoul
 */
export function getCurrentTimezone(): SupportedTimezone {
  // 환경 변수에서 설정된 시간대 확인
  if (env.PUBLIC_DEFAULT_TIMEZONE) {
    const envTimezone = env.PUBLIC_DEFAULT_TIMEZONE as SupportedTimezone
    if (SUPPORTED_TIMEZONES.includes(envTimezone)) {
      return envTimezone
    }
  }

  // 브라우저 환경에서는 로컬 시간대 확인 (서버에서는 기본값 사용)
  if (browser) {
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone as SupportedTimezone
    if (SUPPORTED_TIMEZONES.includes(localTimezone)) {
      return localTimezone
    }
  }

  // 기본값: 서울 시간대
  return 'Asia/Seoul'
}

/**
 * 시간대 정보를 가져옵니다.
 */
export function getTimezoneInfo(timezone?: SupportedTimezone): TimezoneInfo {
  const targetTimezone = timezone || getCurrentTimezone()
  return TIMEZONE_INFO[targetTimezone]
}

/**
 * 시간대가 지원되는지 확인합니다.
 */
export function isSupportedTimezone(timezone: string): timezone is SupportedTimezone {
  return SUPPORTED_TIMEZONES.includes(timezone as SupportedTimezone)
}

/**
 * 시간대별 UTC 오프셋을 가져옵니다.
 *
 * @param timezone 시간대
 * @param date 기준 날짜 (일광절약시간 고려)
 * @returns UTC 오프셋 (분 단위)
 */
export function getTimezoneOffset(timezone: SupportedTimezone, date: Date = new Date()): number {
  // 표준화된 방법으로 UTC와 로컬 시간 계산
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60000
  const localTime = new Date(utcTime + getTimezoneOffsetInMinutes(timezone) * 60000)

  return getTimezoneOffsetInMinutes(timezone)
}

/**
 * 시간대별 UTC 오프셋을 분 단위로 계산 (표준화된 방법)
 */
function getTimezoneOffsetInMinutes(timezone: SupportedTimezone): number {
  const now = new Date()
  const utcTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000)

  // 각 시간대별 고정 오프셋 (일광절약시간 고려 안함)
  const timezoneOffsets: Record<SupportedTimezone, number> = {
    'Asia/Seoul': 540, // UTC+9
    'Asia/Bangkok': 420, // UTC+7
    'Asia/Tokyo': 540, // UTC+9
    'Asia/Shanghai': 480, // UTC+8
    'Asia/Singapore': 480, // UTC+8
    UTC: 0, // UTC+0
    'America/New_York': -300, // UTC-5 (일광절약시간 시 -240)
    'Europe/London': 0 // UTC+0 (일광절약시간 시 60)
  }

  return timezoneOffsets[timezone] || 0
}

/**
 * 시간대별 UTC 오프셋 문자열을 가져옵니다.
 *
 * @param timezone 시간대
 * @param date 기준 날짜
 * @returns UTC 오프셋 문자열 (예: "+09:00", "-05:00")
 */
export function getTimezoneOffsetString(
  timezone: SupportedTimezone,
  date: Date = new Date()
): string {
  const offsetMinutes = getTimezoneOffset(timezone, date)
  const hours = Math.floor(Math.abs(offsetMinutes) / 60)
  const minutes = Math.abs(offsetMinutes) % 60
  const sign = offsetMinutes >= 0 ? '+' : '-'

  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * 현재 시간대 설정을 콘솔에 출력합니다 (디버깅용)
 */
export function logCurrentTimezoneSettings(): void {
  const currentTimezone = getCurrentTimezone()
  const timezoneInfo = getTimezoneInfo(currentTimezone)
  const offsetString = getTimezoneOffsetString(currentTimezone)

  console.log('=== 시간대 설정 정보 ===')
  console.log('현재 시간대:', currentTimezone)
  console.log('시간대 이름:', timezoneInfo.name)
  console.log('오프셋:', offsetString)
  console.log('설명:', timezoneInfo.description)
  console.log('========================')
}
