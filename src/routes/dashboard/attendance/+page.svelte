<script lang="ts">
  import { pushToast } from '$lib/stores/toasts'
  import { onMount } from 'svelte'
  import type { PageData } from './$types'
  import type { AttendanceData } from '$lib/types/dashboard'
  import { logger } from '$lib/utils/logger'

  let { data: _data }: { data: PageData } = $props()

  // 상태 관리
  let attendanceData = $state<AttendanceData | null>(null)
  let loading = $state(false)
  let today = $state(new Date().toISOString().split('T')[0])
  let selectedDate = $state(today)

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

  // 출퇴근 데이터 로드
  async function loadAttendanceData() {
    loading = true
    try {
      const response = await fetch(`/api/dashboard/attendance?date=${selectedDate}`)
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
        body: JSON.stringify({
          action: 'check_in',
          notes: notes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadAttendanceData()
        pushToast('출근이 기록되었습니다.', 'info')
      } else {
        pushToast(result.message, 'info')
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
        body: JSON.stringify({
          action: 'check_out',
          notes: notes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadAttendanceData()
        pushToast('퇴근이 기록되었습니다.', 'info')
      } else {
        pushToast(result.message, 'info')
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
        body: JSON.stringify({
          action: 'break_start',
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadAttendanceData()
        pushToast('휴게가 시작되었습니다.', 'info')
      } else {
        pushToast(result.message, 'info')
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
        body: JSON.stringify({
          action: 'break_end',
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadAttendanceData()
        pushToast('휴게가 종료되었습니다.', 'info')
      } else {
        pushToast(result.message, 'info')
      }
    } catch (error) {
      logger.error('Error ending break:', error)
      pushToast('휴게 종료에 실패했습니다.', 'error')
    }
  }

  // 날짜 변경
  function changeDate(days: number) {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    selectedDate = date.toISOString().split('T')[0]
    loadAttendanceData()
  }

  // 초기 로드
  onMount(() => {
    loadAttendanceData()
  })
</script>

<svelte:head>
  <title>출퇴근 현황 - VWS</title>
</svelte:head>

<div class="space-y-6">
  <!-- 페이지 헤더 -->
  <div class="bg-white rounded-lg shadow p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">출퇴근 현황</h1>
    <p class="text-gray-600">출퇴근 기록을 확인하고 관리할 수 있습니다.</p>
  </div>

  <!-- 날짜 선택 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">날짜 선택</h2>
      <div class="flex items-center space-x-2">
        <button
          type="button"
          onclick={() => changeDate(-1)}
          class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
        >
          ←
        </button>
        <span class="text-lg font-medium text-gray-900">
          {new Date(selectedDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </span>
        <button
          type="button"
          onclick={() => changeDate(1)}
          class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
        >
          →
        </button>
      </div>
    </div>
  </div>

  <!-- 오늘의 출퇴근 기록 -->
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">오늘의 출퇴근 기록</h2>

    {#if loading}
      <div class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    {:else if attendanceData?.today}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 출퇴근 시간 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div class="text-sm text-gray-600">출근 시간</div>
              <div class="text-xl font-semibold text-gray-900">{checkInTime || '미기록'}</div>
            </div>
            <button
              type="button"
              onclick={handleCheckIn}
              disabled={!canCheckIn}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              출근
            </button>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div class="text-sm text-gray-600">퇴근 시간</div>
              <div class="text-xl font-semibold text-gray-900">{checkOutTime || '미기록'}</div>
            </div>
            <button
              type="button"
              onclick={handleCheckOut}
              disabled={!canCheckOut}
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              퇴근
            </button>
          </div>
        </div>

        <!-- 휴게 시간 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div class="text-sm text-gray-600">휴게 시작</div>
              <div class="text-xl font-semibold text-gray-900">{breakStartTime || '미기록'}</div>
            </div>
            <button
              type="button"
              onclick={handleBreakStart}
              disabled={!canBreakStart}
              class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              휴게 시작
            </button>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div class="text-sm text-gray-600">휴게 종료</div>
              <div class="text-xl font-semibold text-gray-900">{breakEndTime || '미기록'}</div>
            </div>
            <button
              type="button"
              onclick={handleBreakEnd}
              disabled={!canBreakEnd}
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              휴게 종료
            </button>
          </div>
        </div>
      </div>

      <!-- 근무 시간 정보 -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="text-sm text-blue-600">총 근무시간</div>
          <div class="text-2xl font-bold text-blue-900">
            {attendanceData.today.total_work_hours || 0}시간
          </div>
        </div>
        <div class="bg-orange-50 p-4 rounded-lg">
          <div class="text-sm text-orange-600">초과근무</div>
          <div class="text-2xl font-bold text-orange-900">
            {attendanceData.today.overtime_hours || 0}시간
          </div>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="text-sm text-gray-600">상태</div>
          <div class="text-2xl font-bold text-gray-900">
            {attendanceData.today.status === 'present'
              ? '정상'
              : attendanceData.today.status === 'late'
                ? '지각'
                : attendanceData.today.status === 'early_leave'
                  ? '조기퇴근'
                  : attendanceData.today.status}
          </div>
        </div>
      </div>

      <!-- 메모 -->
      <div class="mt-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">메모</label>
        <textarea
          bind:value={notes}
          placeholder="출퇴근 관련 메모를 입력하세요"
          class="w-full border border-gray-300 rounded-md px-3 py-2"
          rows="3"
        ></textarea>
      </div>
    {:else}
      <div class="text-center py-8 text-gray-500">
        {selectedDate === today
          ? '오늘의 출퇴근 기록이 없습니다.'
          : '해당 날짜의 출퇴근 기록이 없습니다.'}
      </div>
    {/if}
  </div>

  <!-- 이번 주 출퇴근 현황 -->
  {#if attendanceData?.week && attendanceData.week.length > 0}
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">이번 주 출퇴근 현황</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >날짜</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >출근</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >퇴근</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >근무시간</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >초과근무</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >상태</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each attendanceData.week as record}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(record.date).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.check_in_time
                    ? new Date(record.check_in_time).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.check_out_time
                    ? new Date(record.check_out_time).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.total_work_hours || 0}시간
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.overtime_hours || 0}시간
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {record.status ===
                    'present'
                      ? 'bg-green-100 text-green-800'
                      : record.status === 'late'
                        ? 'bg-yellow-100 text-yellow-800'
                        : record.status === 'early_leave'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'}"
                  >
                    {record.status === 'present'
                      ? '정상'
                      : record.status === 'late'
                        ? '지각'
                        : record.status === 'early_leave'
                          ? '조기퇴근'
                          : record.status}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- 이번 달 통계 -->
  {#if attendanceData?.stats}
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">이번 달 통계</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <div class="text-sm text-blue-600">총 근무일수</div>
          <div class="text-3xl font-bold text-blue-900">{attendanceData.stats.workDays}일</div>
          <div class="text-sm text-blue-500">전체 {attendanceData.stats.totalDays}일 중</div>
        </div>
        <div class="bg-green-50 p-6 rounded-lg">
          <div class="text-sm text-green-600">총 근무시간</div>
          <div class="text-3xl font-bold text-green-900">
            {attendanceData.stats.totalWorkHours}시간
          </div>
          <div class="text-sm text-green-500">
            초과근무 {attendanceData.stats.totalOvertimeHours}시간
          </div>
        </div>
        <div class="bg-orange-50 p-6 rounded-lg">
          <div class="text-sm text-orange-600">지각/조기퇴근</div>
          <div class="text-3xl font-bold text-orange-900">
            {attendanceData.stats.lateDays + attendanceData.stats.earlyLeaveDays}회
          </div>
          <div class="text-sm text-orange-500">
            지각 {attendanceData.stats.lateDays}회, 조기퇴근 {attendanceData.stats.earlyLeaveDays}회
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
