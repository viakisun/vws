import { browser } from '$app/environment'
import { formatDateForDisplay } from '$lib/utils/date-handler'
import { DEFAULT_TIMEZONE, SUPPORTED_TIMEZONES, type Timezone } from '$lib/utils/timezone'
import { derived, writable } from 'svelte/store'

// 타임존 설정 스토어
export const userTimezone = writable<Timezone>(DEFAULT_TIMEZONE)

// 브라우저에서 사용자의 기본 타임존 감지
if (browser) {
  // 로컬 스토리지에서 저장된 타임존 설정 불러오기
  const savedTimezone = localStorage.getItem('user-timezone') as Timezone
  if (savedTimezone && SUPPORTED_TIMEZONES[savedTimezone]) {
    userTimezone.set(savedTimezone)
  } else {
    // 브라우저의 기본 타임존 감지
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const detectedTimezone = detectTimezoneFromBrowser(browserTimezone)
    userTimezone.set(detectedTimezone)
  }

  // 타임존 변경 시 로컬 스토리지에 저장
  userTimezone.subscribe(timezone => {
    localStorage.setItem('user-timezone', timezone)
  })
}

// 브라우저 타임존을 지원하는 타임존으로 매핑
function detectTimezoneFromBrowser(browserTimezone: string): Timezone {
  const timezoneMap: Record<string, Timezone> = {
    'Asia/Seoul': 'KST',
    'Asia/Tokyo': 'JST',
    'America/New_York': 'EST',
    'America/Los_Angeles': 'PST',
    UTC: 'UTC',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Asia/Shanghai': 'CST',
    'Asia/Kolkata': 'IST',
    'Australia/Sydney': 'AEST',
    'Pacific/Auckland': 'NZST'
  }

  return timezoneMap[browserTimezone] || DEFAULT_TIMEZONE
}

// 현재 사용자 타임존 정보
export const currentTimezone = derived(userTimezone, $timezone => ({
  timezone: $timezone,
  timezoneString: SUPPORTED_TIMEZONES[$timezone],
  offset: getTimezoneOffset($timezone),
  displayName: getTimezoneDisplayName($timezone)
}))

// 타임존 오프셋 계산
function getTimezoneOffset(timezone: Timezone): number {
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

// 타임존 표시명
function getTimezoneDisplayName(timezone: Timezone): string {
  const names: Record<Timezone, string> = {
    UTC: 'UTC (협정세계시)',
    KST: 'KST (한국 표준시, UTC+9)',
    JST: 'JST (일본 표준시, UTC+9)',
    EST: 'EST (미국 동부 표준시, UTC-5)',
    PST: 'PST (미국 서부 표준시, UTC-8)',
    GMT: 'GMT (그리니치 표준시, UTC+0)',
    CET: 'CET (중앙유럽 표준시, UTC+1)',
    CST: 'CST (중국 표준시, UTC+8)',
    IST: 'IST (인도 표준시, UTC+5:30)',
    AEST: 'AEST (호주 동부 표준시, UTC+10)',
    NZST: 'NZST (뉴질랜드 표준시, UTC+12)'
  }
  return names[timezone]
}

// 타임존 변경 함수
export function setUserTimezone(timezone: Timezone) {
  if (SUPPORTED_TIMEZONES[timezone]) {
    userTimezone.set(timezone)
  } else {
    console.warn(`Unsupported timezone: ${timezone}`)
  }
}

// 현재 시간을 사용자 타임존으로 포맷팅
export const currentTime = derived(userTimezone, $timezone => {
  if (!browser) return ''

  const now = new Date()
  const timezoneString = SUPPORTED_TIMEZONES[$timezone]

  return {
    formatted:
      formatDateForDisplay(now.toISOString(), 'KOREAN') +
      ' ' +
      now.toLocaleTimeString('ko-KR', {
        timeZone: timezoneString,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
    dateOnly: formatDateForDisplay(now.toISOString(), 'KOREAN'),
    timeOnly: now.toLocaleTimeString('ko-KR', {
      timeZone: timezoneString,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
})

// 지원하는 모든 타임존 목록 (UI용)
export const availableTimezones = Object.entries(SUPPORTED_TIMEZONES).map(([key, value]) => ({
  key: key as Timezone,
  value,
  displayName: getTimezoneDisplayName(key as Timezone),
  offset: getTimezoneOffset(key as Timezone)
}))

// 타임존별 날짜 포맷팅 옵션
export const getDateFormatOptions = (timezone: Timezone) => {
  const baseOptions: Intl.DateTimeFormatOptions = {
    timeZone: SUPPORTED_TIMEZONES[timezone],
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }

  return {
    date: baseOptions,
    dateTime: {
      ...baseOptions,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    },
    time: {
      timeZone: SUPPORTED_TIMEZONES[timezone],
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  }
}
