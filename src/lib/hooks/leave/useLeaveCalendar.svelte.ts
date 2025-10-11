/**
 * useLeaveCalendar Hook
 *
 * 연차 캘린더 상태 관리 및 UI 로직
 * - 월간 데이터 로드
 * - 날짜 선택 및 모달 관리
 * - 월/년도 네비게이션
 */

import type {
    LeaveCalendarData,
    LeaveEmployee
} from '$lib/services/leave/leave-calendar-service'
import * as leaveCalendarService from '$lib/services/leave/leave-calendar-service'
import { logger } from '$lib/utils/logger'

// ============================================================================
// Hook
// ============================================================================

export function useLeaveCalendar() {
  // State
  let loading = $state(false)
  let error = $state<string | null>(null)
  let currentYear = $state(new Date().getFullYear())
  let currentMonth = $state(new Date().getMonth() + 1)
  let calendarData = $state<LeaveCalendarData | null>(null)
  let selectedDate = $state<string | null>(null)
  let selectedLeaves = $state<LeaveEmployee[]>([])

  // Derived values
  const calendarDays = $derived(
    leaveCalendarService.generateCalendarDays(currentYear, currentMonth, calendarData),
  )

  const weekdayHeaders = ['일', '월', '화', '수', '목', '금', '토']

  const yearList = $derived(leaveCalendarService.generateYearList())

  const monthList = $derived(leaveCalendarService.generateMonthList())

  // ============================================================================
  // Data Loading
  // ============================================================================

  /**
   * 월간 캘린더 데이터 로드
   */
  async function loadMonthlyCalendar(): Promise<void> {
    loading = true
    error = null

    try {
      const result = await leaveCalendarService.fetchMonthlyCalendar(currentYear, currentMonth)

      if (!result.success) {
        error = result.message || '연차 캘린더를 불러올 수 없습니다.'
        logger.error('Failed to load leave calendar:', result.message)
        return
      }

      calendarData = result.data || null
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      error = message
      logger.error('Failed to load leave calendar:', err)
    } finally {
      loading = false
    }
  }

  /**
   * 초기 로드
   */
  async function initialize(): Promise<void> {
    await loadMonthlyCalendar()
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  /**
   * 월 변경
   */
  function changeMonth(month: number): void {
    if (leaveCalendarService.isFutureMonth(currentYear, month)) {
      return
    }

    currentMonth = month
    loadMonthlyCalendar()
  }

  /**
   * 년도 변경
   */
  function changeYear(year: number): void {
    currentYear = year
    loadMonthlyCalendar()
  }

  /**
   * 오늘로 이동
   */
  function goToToday(): void {
    const today = new Date()
    currentYear = today.getFullYear()
    currentMonth = today.getMonth() + 1
    loadMonthlyCalendar()
  }

  // ============================================================================
  // Modal Management
  // ============================================================================

  /**
   * 날짜 클릭 핸들러 (모달 열기)
   */
  function handleDateClick(dateString: string): void {
    if (!dateString) return

    selectedDate = dateString
    selectedLeaves = leaveCalendarService.getLeavesForDate(calendarData, dateString)
  }

  /**
   * 모달 닫기
   */
  function closeModal(): void {
    selectedDate = null
    selectedLeaves = []
  }

  // ============================================================================
  // UI Helpers
  // ============================================================================

  /**
   * 연차 타입별 색상
   */
  function getLeaveTypeColor(type: string): string {
    return leaveCalendarService.getLeaveTypeColor(type)
  }

  /**
   * 연차 기간 포맷팅 (날짜 + 시간)
   */
  function formatLeavePeriod(startDate: string, endDate: string, leaveType: string): string {
    return leaveCalendarService.formatLeavePeriod(startDate, endDate, leaveType)
  }

  /**
   * 미래 월인지 확인
   */
  function isFutureMonth(month: number): boolean {
    return leaveCalendarService.isFutureMonth(currentYear, month)
  }

  /**
   * 현재 월인지 확인
   */
  function isCurrentMonth(month: number): boolean {
    return month === currentMonth
  }

  // ============================================================================
  // Return (Svelte 5 runes - use getters for reactivity)
  // ============================================================================

  return {
    // State (getters for reactivity)
    get loading() {
      return loading
    },
    get error() {
      return error
    },
    get currentYear() {
      return currentYear
    },
    get currentMonth() {
      return currentMonth
    },
    get calendarData() {
      return calendarData
    },
    get selectedDate() {
      return selectedDate
    },
    get selectedLeaves() {
      return selectedLeaves
    },

    // Derived (getters for reactivity)
    get calendarDays() {
      return calendarDays
    },
    get weekdayHeaders() {
      return weekdayHeaders
    },
    get yearList() {
      return yearList
    },
    get monthList() {
      return monthList
    },

    // Actions
    initialize,
    loadMonthlyCalendar,
    changeMonth,
    changeYear,
    goToToday,
    handleDateClick,
    closeModal,

    // Helpers
    getLeaveTypeColor,
    formatLeavePeriod,
    isFutureMonth,
    isCurrentMonth,
  }
}

// ============================================================================
// Types Export
// ============================================================================

export type LeaveCalendarHook = ReturnType<typeof useLeaveCalendar>

