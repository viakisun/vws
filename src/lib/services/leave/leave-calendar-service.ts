/**
 * Leave Calendar Service
 *
 * 연차 캘린더 관련 비즈니스 로직 및 API 호출
 * - 월간 캘린더 데이터 조회
 * - 데이터 변환 및 정규화
 * - 날짜 관련 유틸리티
 */

import { getHoliday } from '$lib/utils/holidays'

// ============================================================================
// Types
// ============================================================================

export interface LeaveEmployee {
  id: string
  employee_id: string
  employee_name: string
  department: string
  type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
}

export interface DailyLeave {
  date: string
  total: number
  leaves: LeaveEmployee[]
}

export interface PromotionTarget {
  employee_id: string
  employee_name: string
  department: string
  total_days: number
  remaining_days: number
}

export interface LeaveCalendarData {
  daily_leaves: DailyLeave[]
  summary: {
    total_days_used: number
    today_on_leave: number
  }
  promotion_targets: PromotionTarget[]
}

export interface CalendarDay {
  day: number
  dateString: string
  isToday: boolean
  isWeekend: boolean
  isSaturday: boolean
  isSunday: boolean
  holiday: string | null
  dayOfWeek: number
  data: DailyLeave | null
}

export interface ServiceResult<T> {
  success: boolean
  data?: T
  message?: string
}

// ============================================================================
// API Service
// ============================================================================

/**
 * 월간 연차 캘린더 데이터 조회
 */
export async function fetchMonthlyCalendar(
  year: number,
  month: number,
): Promise<ServiceResult<LeaveCalendarData>> {
  try {
    const response = await fetch(`/api/hr/leave/monthly-calendar?year=${year}&month=${month}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('연차 캘린더 로드 실패:', response.status, errorText)
      return {
        success: false,
        message: `연차 캘린더 로드 실패 (${response.status})`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Failed to fetch leave calendar:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '연차 캘린더 조회 중 오류가 발생했습니다.',
    }
  }
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * 날짜 문자열 생성 (YYYY-MM-DD)
 */
export function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * 월의 첫 번째 요일 (0: 일요일, 6: 토요일)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

/**
 * 월의 일수
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * 오늘 날짜인지 확인
 */
export function isToday(year: number, month: number, day: number): boolean {
  const today = new Date()
  return today.getDate() === day && today.getMonth() === month - 1 && today.getFullYear() === year
}

/**
 * 휴일 정보 가져오기
 */
export function getHolidayName(year: number, month: number, day: number): string | null {
  const dateStr = formatDateString(year, month, day)
  const holiday = getHoliday(dateStr)
  return holiday?.name || null
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * 캘린더 날짜 배열 생성
 */
export function generateCalendarDays(
  year: number,
  month: number,
  calendarData: LeaveCalendarData | null,
): CalendarDay[] {
  const firstDay = getFirstDayOfMonth(year, month)
  const daysInMonth = getDaysInMonth(year, month)
  const days: CalendarDay[] = []

  // 이전 달의 빈 칸 (null 대신 빈 객체)
  for (let i = 0; i < firstDay; i++) {
    days.push({
      day: 0,
      dateString: '',
      isToday: false,
      isWeekend: false,
      isSaturday: false,
      isSunday: false,
      holiday: null,
      dayOfWeek: i,
      data: null,
    })
  }

  // 현재 달의 날짜
  for (let day = 1; day <= daysInMonth; day++) {
    const index = firstDay + day - 1
    const dayOfWeek = index % 7
    const dateString = formatDateString(year, month, day)
    const isSunday = dayOfWeek === 0
    const isSaturday = dayOfWeek === 6
    const isWeekend = isSunday || isSaturday

    days.push({
      day,
      dateString,
      isToday: isToday(year, month, day),
      isWeekend,
      isSaturday,
      isSunday,
      holiday: getHolidayName(year, month, day),
      dayOfWeek,
      data: findDayData(calendarData, dateString),
    })
  }

  return days
}

/**
 * 특정 날짜의 데이터 찾기
 */
function findDayData(calendarData: LeaveCalendarData | null, dateStr: string): DailyLeave | null {
  if (!calendarData?.daily_leaves) return null

  return (
    calendarData.daily_leaves.find((d) => {
      const normalizedDate = d.date.replace(/\.\s*/g, '-').replace(/-$/, '')
      return normalizedDate === dateStr
    }) || null
  )
}

/**
 * 특정 날짜의 연차 목록 가져오기
 */
export function getLeavesForDate(
  calendarData: LeaveCalendarData | null,
  dateStr: string,
): LeaveEmployee[] {
  const dayData = calendarData?.daily_leaves.find((d) => {
    const normalizedApiDate = d.date.replace(/\.\s*/g, '-').replace(/-$/, '')
    return normalizedApiDate === dateStr || d.date === dateStr
  })

  return dayData?.leaves || []
}

// ============================================================================
// UI Utilities
// ============================================================================

/**
 * 연차 타입별 색상 클래스
 */
export function getLeaveTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    연차: 'bg-blue-500',
    반차: 'bg-yellow-500',
    반반차: 'bg-orange-500',
    경조사: 'bg-purple-500',
    '예비군/민방위': 'bg-green-500',
  }

  return colorMap[type] || 'bg-gray-500'
}

/**
 * KST 타임스탬프 문자열에서 날짜 부분만 추출
 * 예: "2025-10-08 11:24:23.373+09" → "2025-10-08"
 *
 * 출퇴근과 동일한 패턴: substring(0, 10)
 */
export function formatLeaveDate(dateTimeString: string): string {
  if (!dateTimeString) return ''
  // KST 타임스탬프에서 날짜 부분만 추출
  return dateTimeString.substring(0, 10)
}

/**
 * KST 타임스탬프 문자열에서 시간 부분만 추출 (반차/반반차용)
 * 예: "2025-10-08 11:24:23.373+09" → "11:24"
 *
 * 출퇴근과 동일한 패턴: substring(11, 16)
 */
export function formatLeaveTime(dateTimeString: string): string {
  if (!dateTimeString) return ''
  // KST 타임스탬프에서 시간 부분만 추출
  return dateTimeString.substring(11, 16)
}

/**
 * 연차 기간 포맷팅 (날짜 + 시간)
 * - 연차: "2025-10-08 ~ 2025-10-10"
 * - 반차/반반차: "2025-10-08 (10:00 ~ 15:00)"
 */
export function formatLeavePeriod(startDate: string, endDate: string, leaveType: string): string {
  const startDateOnly = formatLeaveDate(startDate)
  const endDateOnly = formatLeaveDate(endDate)

  // 같은 날짜인 경우 (반차/반반차)
  if (startDateOnly === endDateOnly) {
    const startTime = formatLeaveTime(startDate)
    const endTime = formatLeaveTime(endDate)
    return `${startDateOnly} (${startTime} ~ ${endTime})`
  }

  // 다른 날짜인 경우 (연차)
  return `${startDateOnly} ~ ${endDateOnly}`
}

/**
 * 월 목록 생성 (1-12월)
 */
export function generateMonthList(): number[] {
  return Array.from({ length: 12 }, (_, i) => i + 1)
}

/**
 * 연도 목록 생성 (최근 3년)
 */
export function generateYearList(): number[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 3 }, (_, i) => currentYear - 2 + i)
}

/**
 * 미래 월인지 확인
 */
export function isFutureMonth(year: number, month: number): boolean {
  const monthDate = new Date(year, month - 1, 1)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return monthDate > today
}
