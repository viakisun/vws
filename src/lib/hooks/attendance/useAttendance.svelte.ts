/**
 * useAttendance Hook
 *
 * 출퇴근 관리를 위한 Hook
 *
 * 책임:
 * - API 호출 래핑
 * - 로딩/에러 상태 관리
 * - 자동 데이터 갱신
 *
 * 사용 예시:
 * ```typescript
 * const attendance = useAttendance()
 *
 * onMount(async () => {
 *   await attendance.loadTodayAttendance()
 * })
 *
 * async function handleCheckIn() {
 *   await attendance.checkIn('출근합니다')
 * }
 * ```
 */

import type { AttendanceData, AttendanceRecord } from '$lib/services/attendance/attendance-service'
import { pushToast } from '$lib/stores/toasts'
import { logger } from '$lib/utils/logger'

// ============================================================================
// 타입 정의
// ============================================================================

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

// ============================================================================
// Hook
// ============================================================================

export function useAttendance() {
  // 상태
  let loading = $state(false)
  let error = $state<string | null>(null)
  let attendanceData = $state<AttendanceData | null>(null)

  /**
   * 출퇴근 데이터 조회
   *
   * @param date - 조회 날짜 (YYYY-MM-DD), 미지정 시 오늘
   */
  async function loadAttendanceData(date?: string): Promise<void> {
    loading = true
    error = null

    try {
      const params = new URLSearchParams()
      if (date) {
        params.set('date', date)
      }

      const response = await fetch(`/api/dashboard/attendance?${params.toString()}`)
      const result: ApiResponse<AttendanceData> = await response.json()

      if (!result.success) {
        throw new Error(result.message || '데이터 조회에 실패했습니다.')
      }

      attendanceData = result.data || null
    } catch (err) {
      const message = err instanceof Error ? err.message : '데이터 조회 중 오류가 발생했습니다.'
      error = message
      logger.error('Failed to load attendance data:', err)
      pushToast(message, 'error')
    } finally {
      loading = false
    }
  }

  /**
   * 출근 기록
   *
   * @param notes - 메모 (선택)
   */
  async function checkIn(notes?: string): Promise<boolean> {
    loading = true
    error = null

    try {
      const response = await fetch('/api/dashboard/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_in',
          notes: notes || '',
        }),
      })

      const result: ApiResponse<AttendanceRecord> = await response.json()

      if (!result.success) {
        throw new Error(result.message || '출근 기록에 실패했습니다.')
      }

      pushToast(result.message || '출근이 기록되었습니다.', 'success')

      // 데이터 갱신
      await loadAttendanceData()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '출근 기록 중 오류가 발생했습니다.'
      error = message
      logger.error('Failed to check in:', err)
      pushToast(message, 'error')
      return false
    } finally {
      loading = false
    }
  }

  /**
   * 퇴근 기록
   *
   * @param notes - 메모 (선택)
   */
  async function checkOut(notes?: string): Promise<boolean> {
    loading = true
    error = null

    try {
      const response = await fetch('/api/dashboard/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_out',
          notes: notes || '',
        }),
      })

      const result: ApiResponse<AttendanceRecord> = await response.json()

      if (!result.success) {
        throw new Error(result.message || '퇴근 기록에 실패했습니다.')
      }

      pushToast(result.message || '퇴근이 기록되었습니다.', 'success')

      // 데이터 갱신
      await loadAttendanceData()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '퇴근 기록 중 오류가 발생했습니다.'
      error = message
      logger.error('Failed to check out:', err)
      pushToast(message, 'error')
      return false
    } finally {
      loading = false
    }
  }

  /**
   * 휴게 시작
   */
  async function startBreak(): Promise<boolean> {
    loading = true
    error = null

    try {
      const response = await fetch('/api/dashboard/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'break_start',
        }),
      })

      const result: ApiResponse<AttendanceRecord> = await response.json()

      if (!result.success) {
        throw new Error(result.message || '휴게 시작 기록에 실패했습니다.')
      }

      pushToast(result.message || '휴게가 시작되었습니다.', 'success')

      // 데이터 갱신
      await loadAttendanceData()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '휴게 시작 기록 중 오류가 발생했습니다.'
      error = message
      logger.error('Failed to start break:', err)
      pushToast(message, 'error')
      return false
    } finally {
      loading = false
    }
  }

  /**
   * 휴게 종료
   */
  async function endBreak(): Promise<boolean> {
    loading = true
    error = null

    try {
      const response = await fetch('/api/dashboard/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'break_end',
        }),
      })

      const result: ApiResponse<AttendanceRecord> = await response.json()

      if (!result.success) {
        throw new Error(result.message || '휴게 종료 기록에 실패했습니다.')
      }

      pushToast(result.message || '휴게가 종료되었습니다.', 'success')

      // 데이터 갱신
      await loadAttendanceData()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '휴게 종료 기록 중 오류가 발생했습니다.'
      error = message
      logger.error('Failed to end break:', err)
      pushToast(message, 'error')
      return false
    } finally {
      loading = false
    }
  }

  /**
   * 특정 날짜로 이동
   *
   * @param date - 조회 날짜 (YYYY-MM-DD)
   */
  async function navigateToDate(date: string): Promise<void> {
    await loadAttendanceData(date)
  }

  /**
   * 데이터 새로고침
   */
  async function refresh(): Promise<void> {
    await loadAttendanceData()
  }

  // 반환
  return {
    // 상태 (읽기 전용)
    get loading() {
      return loading
    },
    get error() {
      return error
    },
    get data() {
      return attendanceData
    },

    // 액션
    loadAttendanceData,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    navigateToDate,
    refresh,
  }
}
