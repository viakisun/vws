<script lang="ts">
  import { goto } from '$app/navigation'
  import { pushToast } from '$lib/stores/toasts'
  import { onMount } from 'svelte'
  import type { PageData } from './$types'
  import type { AttendanceData } from '$lib/types/dashboard'
  import { logger } from '$lib/utils/logger'
  import AttendanceCalendar from '$lib/components/attendance/AttendanceCalendar.svelte'
  import {
    ArrowLeftIcon,
    ClockIcon,
    LogInIcon,
    LogOutIcon,
    CoffeeIcon,
    CalendarIcon,
  } from 'lucide-svelte'

  const { data: _data }: { data: PageData } = $props()

  // 상태 관리
  let attendanceData = $state<AttendanceData | null>(null)
  let loading = $state(false)
  const today = $state(new Date().toISOString().split('T')[0])
  let selectedDate = $state(today)
  let currentTime = $state(new Date())

  // 출퇴근 기록
  let checkInTime = $state('')
  let checkOutTime = $state('')
  let breakStartTime = $state('')
  let breakEndTime = $state('')
  let notes = $state('')

  // 출퇴근 상태
  let canCheckIn = $state(true)
  let canCheckOut = $state(false)
  let canBreakStart = $state(false)
  let canBreakEnd = $state(false)

  // 현재 시간 업데이트
  let timeInterval: ReturnType<typeof setInterval> | null = null

  // 실시간 근무시간 계산
  const liveWorkTime = $derived.by(() => {
    if (!attendanceData?.today?.check_in_time || !isToday) {
      const hours = attendanceData?.today?.total_work_hours || 0
      return { hours: Math.floor(hours), minutes: Math.round((hours % 1) * 60) }
    }

    const checkIn = new Date(attendanceData.today.check_in_time)
    const checkOut = attendanceData.today.check_out_time
      ? new Date(attendanceData.today.check_out_time)
      : currentTime

    const diffMs = checkOut.getTime() - checkIn.getTime()
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    // 휴게시간 제외 (향후 구현)
    return { hours: Math.max(0, hours), minutes: Math.max(0, minutes) }
  })

  // 출퇴근 데이터 로드
  async function loadAttendanceData() {
    loading = true
    try {
      const response = await fetch(`/api/dashboard/attendance?date=${selectedDate}`, {
        credentials: 'include',
      })
      const result = await response.json()

      if (result.success) {
        attendanceData = result.data
        updateAttendanceStatus()
      }
    } catch (error) {
      logger.error('Error loading attendance data:', error)
    } finally {
      loading = false
    }
  }

  // 출퇴근 상태 업데이트
  function updateAttendanceStatus() {
    if (!attendanceData?.today) {
      canCheckIn = true
      canCheckOut = false
      canBreakStart = false
      canBreakEnd = false
      return
    }

    const today = attendanceData.today
    canCheckIn = !today.check_in_time
    canCheckOut = Boolean(today.check_in_time && !today.check_out_time)
    canBreakStart = Boolean(today.check_in_time && !today.check_out_time && !today.break_start_time)
    canBreakEnd = Boolean(today.break_start_time && !today.break_end_time)

    // 시간 표시 업데이트
    if (today.check_in_time) {
      checkInTime = new Date(today.check_in_time).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    if (today.check_out_time) {
      checkOutTime = new Date(today.check_out_time).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    if (today.break_start_time) {
      breakStartTime = new Date(today.break_start_time).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    if (today.break_end_time) {
      breakEndTime = new Date(today.break_end_time).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    if (today.notes) {
      notes = today.notes
    }
  }

  // 출근 처리
  async function handleCheckIn() {
    try {
      const response = await fetch('/api/dashboard/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'check_in',
          notes: notes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadAttendanceData()
        pushToast(result.message, 'success')
      } else {
        pushToast(result.message, 'error')
      }
    } catch (error) {
      logger.error('Error checking in:', error)
      pushToast('출근 기록에 실패했습니다.', 'error')
    }
  }

  // 퇴근 처리
  async function handleCheckOut() {
    try {
      const response = await fetch('/api/dashboard/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'check_out',
          notes: notes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadAttendanceData()
        pushToast(result.message, 'success')
      } else {
        pushToast(result.message, 'error')
      }
    } catch (error) {
      logger.error('Error checking out:', error)
      pushToast('퇴근 기록에 실패했습니다.', 'error')
    }
  }

  // 휴게 시작
  async function handleBreakStart() {
    try {
      const response = await fetch('/api/dashboard/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'break_start',
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadAttendanceData()
        pushToast(result.message, 'success')
      } else {
        pushToast(result.message, 'error')
      }
    } catch (error) {
      logger.error('Error starting break:', error)
      pushToast('휴게 시작에 실패했습니다.', 'error')
    }
  }

  // 휴게 종료
  async function handleBreakEnd() {
    try {
      const response = await fetch('/api/dashboard/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'break_end',
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadAttendanceData()
        pushToast(result.message, 'success')
      } else {
        pushToast(result.message, 'error')
      }
    } catch (error) {
      logger.error('Error ending break:', error)
      pushToast('휴게 종료에 실패했습니다.', 'error')
    }
  }

  function goBack() {
    goto('/dashboard')
  }

  // 초기 로드
  onMount(() => {
    loadAttendanceData()

    // 현재 시간 업데이트 (1초마다)
    timeInterval = setInterval(() => {
      currentTime = new Date()
    }, 1000)

    return () => {
      if (timeInterval) {
        clearInterval(timeInterval)
      }
    }
  })

  // Computed values
  const currentTimeString = $derived(
    currentTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  )

  const currentDateString = $derived(
    currentTime.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
  )

  const isToday = $derived(selectedDate === today)
</script>

<svelte:head>
  <title>출퇴근 현황 - VWS</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          type="button"
          onclick={goBack}
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon size={20} />
          <span>대시보드</span>
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        <h1 class="text-2xl font-bold text-gray-900">출퇴근 현황</h1>
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else}
      <!-- 현재 시간 & 빠른 출퇴근 -->
      {#if isToday}
        <div
          class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white"
        >
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- 현재 시간 -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-blue-100">
                <ClockIcon size={20} />
                <span class="text-sm font-medium">현재 시간</span>
              </div>
              <div class="text-5xl font-bold tabular-nums">{currentTimeString}</div>
              <div class="text-blue-100">{currentDateString}</div>
            </div>

            <!-- 빠른 출퇴근 버튼 -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                onclick={handleCheckIn}
                disabled={!canCheckIn}
                class="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/30"
              >
                <LogInIcon size={32} />
                <span class="font-semibold">출근</span>
                {#if checkInTime}
                  <span class="text-sm opacity-90">{checkInTime}</span>
                {/if}
              </button>

              <button
                type="button"
                onclick={handleCheckOut}
                disabled={!canCheckOut}
                class="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/30"
              >
                <LogOutIcon size={32} />
                <span class="font-semibold">퇴근</span>
                {#if checkOutTime}
                  <span class="text-sm opacity-90">{checkOutTime}</span>
                {/if}
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- 오늘의 출퇴근 상세 -->
      {#if attendanceData?.today && isToday}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- 근무 시간 정보 -->
          <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div class="flex items-center gap-2 mb-4 text-blue-600">
              <ClockIcon size={20} />
              <h3 class="font-semibold">총 근무시간</h3>
            </div>
            <div class="text-4xl font-bold text-gray-900">
              {liveWorkTime.hours}<span class="text-2xl text-gray-500">시간</span>
              {liveWorkTime.minutes}<span class="text-2xl text-gray-500">분</span>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div class="flex items-center gap-2 mb-4 text-orange-600">
              <ClockIcon size={20} />
              <h3 class="font-semibold">초과근무</h3>
            </div>
            <div class="text-4xl font-bold text-gray-900">
              {attendanceData.today.overtime_hours || 0}
              <span class="text-2xl text-gray-500">시간</span>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div class="flex items-center gap-2 mb-4 text-green-600">
              <CalendarIcon size={20} />
              <h3 class="font-semibold">출퇴근 상태</h3>
            </div>
            <div class="text-2xl font-bold">
              {#if attendanceData.today.status === 'present'}
                <span class="text-green-600">✓ 정상</span>
              {:else if attendanceData.today.status === 'late'}
                <span class="text-yellow-600">⚠ 지각</span>
              {:else if attendanceData.today.status === 'early_leave'}
                <span class="text-orange-600">⚠ 조기퇴근</span>
              {:else}
                <span class="text-gray-600">{attendanceData.today.status}</span>
              {/if}
            </div>
          </div>
        </div>

        <!-- 출퇴근 타임라인 -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">오늘의 출퇴근 기록</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 출퇴근 -->
            <div class="space-y-4">
              <div
                class="flex items-center justify-between p-4 rounded-lg {checkInTime
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'}"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="p-2 rounded-lg {checkInTime
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'}"
                  >
                    <LogInIcon size={20} />
                  </div>
                  <div>
                    <div class="text-sm text-gray-600">출근 시간</div>
                    <div class="text-xl font-semibold text-gray-900">
                      {checkInTime || '미기록'}
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="flex items-center justify-between p-4 rounded-lg {checkOutTime
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'}"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="p-2 rounded-lg {checkOutTime
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'}"
                  >
                    <LogOutIcon size={20} />
                  </div>
                  <div>
                    <div class="text-sm text-gray-600">퇴근 시간</div>
                    <div class="text-xl font-semibold text-gray-900">
                      {checkOutTime || '미기록'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 휴게 시간 -->
            <div class="space-y-4">
              <div
                class="flex items-center justify-between p-4 rounded-lg {breakStartTime
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-50 border border-gray-200'}"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="p-2 rounded-lg {breakStartTime
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-300 text-gray-600'}"
                  >
                    <CoffeeIcon size={20} />
                  </div>
                  <div>
                    <div class="text-sm text-gray-600">휴게 시작</div>
                    <div class="text-xl font-semibold text-gray-900">
                      {breakStartTime || '미기록'}
                    </div>
                  </div>
                </div>
                {#if !breakStartTime}
                  <button
                    type="button"
                    onclick={handleBreakStart}
                    disabled={!canBreakStart}
                    class="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    시작
                  </button>
                {/if}
              </div>

              <div
                class="flex items-center justify-between p-4 rounded-lg {breakEndTime
                  ? 'bg-purple-50 border border-purple-200'
                  : 'bg-gray-50 border border-gray-200'}"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="p-2 rounded-lg {breakEndTime
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-300 text-gray-600'}"
                  >
                    <CoffeeIcon size={20} />
                  </div>
                  <div>
                    <div class="text-sm text-gray-600">휴게 종료</div>
                    <div class="text-xl font-semibold text-gray-900">
                      {breakEndTime || '미기록'}
                    </div>
                  </div>
                </div>
                {#if !breakEndTime && breakStartTime}
                  <button
                    type="button"
                    onclick={handleBreakEnd}
                    disabled={!canBreakEnd}
                    class="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    종료
                  </button>
                {/if}
              </div>
            </div>
          </div>

          <!-- 메모 -->
          {#if isToday}
            <div class="mt-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">메모</label>
              <textarea
                bind:value={notes}
                placeholder="출퇴근 관련 메모를 입력하세요"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
              ></textarea>
            </div>
          {/if}
        </div>
      {/if}

      <!-- 이번 달 통계 -->
      {#if attendanceData?.stats}
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">이번 달 통계</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div class="text-sm text-blue-600 mb-1">총 근무일수</div>
              <div class="text-3xl font-bold text-blue-900">{attendanceData.stats.workDays}</div>
              <div class="text-xs text-blue-600 mt-1">
                전체 {attendanceData.stats.totalDays}일 중
              </div>
            </div>

            <div class="p-4 bg-green-50 rounded-lg border border-green-100">
              <div class="text-sm text-green-600 mb-1">총 근무시간</div>
              <div class="text-3xl font-bold text-green-900">
                {attendanceData.stats.totalWorkHours}h
              </div>
              <div class="text-xs text-green-600 mt-1">
                초과 {attendanceData.stats.totalOvertimeHours}h
              </div>
            </div>

            <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div class="text-sm text-yellow-600 mb-1">지각</div>
              <div class="text-3xl font-bold text-yellow-900">{attendanceData.stats.lateDays}</div>
              <div class="text-xs text-yellow-600 mt-1">회</div>
            </div>

            <div class="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div class="text-sm text-orange-600 mb-1">조기퇴근</div>
              <div class="text-3xl font-bold text-orange-900">
                {attendanceData.stats.earlyLeaveDays}
              </div>
              <div class="text-xs text-orange-600 mt-1">회</div>
            </div>
          </div>
        </div>
      {/if}

      <!-- 월별 캘린더 -->
      {#if attendanceData?.month}
        <AttendanceCalendar
          month={new Date(selectedDate)}
          records={attendanceData.month}
          onDateClick={(date) => {
            selectedDate = date
            loadAttendanceData()
          }}
          onMonthChange={(date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            selectedDate = `${year}-${month}-01`
            loadAttendanceData()
          }}
        />
      {/if}
    {/if}
  </div>
</div>
