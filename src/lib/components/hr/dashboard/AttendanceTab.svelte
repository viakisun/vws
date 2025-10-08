<script lang="ts">
  /**
   * 근태관리 탭 (관리자용)
   * 전체 직원의 출퇴근 현황을 월간 캘린더로 표시
   */
  import { onMount } from 'svelte'
  import { getHoliday } from '$lib/utils/holidays'

  let loading = $state(false)
  let currentYear = $state(new Date().getFullYear())
  let currentMonth = $state(new Date().getMonth() + 1)
  let monthlySummary = $state<any>(null)
  let selectedDate = $state<string | null>(null)
  let dailyDetail = $state<any>(null)

  // Computed values
  const firstDay = $derived(new Date(currentYear, currentMonth - 1, 1).getDay())
  const daysInMonth = $derived(new Date(currentYear, currentMonth, 0).getDate())

  const calendarDays = $derived.by(() => {
    const days: (number | null)[] = []
    // 이전 달의 빈 칸
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    // 현재 달의 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  })

  /**
   * 월간 출퇴근 집계 조회
   */
  async function loadMonthlySummary() {
    loading = true
    try {
      const response = await fetch(
        `/api/hr/attendance/monthly-summary?year=${currentYear}&month=${currentMonth}`,
      )
      if (response.ok) {
        monthlySummary = await response.json()
        console.log('Monthly summary loaded:', monthlySummary)
        console.log('Daily summary count:', monthlySummary.daily_summary?.length)
      } else {
        console.error('Failed to load monthly summary:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Failed to load monthly summary:', error)
    } finally {
      loading = false
    }
  }

  /**
   * 특정일 상세 조회
   */
  async function loadDailyDetail(date: string) {
    try {
      const response = await fetch(`/api/hr/attendance/daily-detail?date=${date}`)
      if (response.ok) {
        dailyDetail = await response.json()
      }
    } catch (error) {
      console.error('Failed to load daily detail:', error)
    }
  }

  /**
   * 날짜 클릭 핸들러
   */
  function handleDateClick(date: string) {
    selectedDate = date
    loadDailyDetail(date)
  }

  /**
   * 월 변경
   */
  function changeMonth(monthIndex: number) {
    currentMonth = monthIndex + 1
    loadMonthlySummary()
  }

  /**
   * 오늘로 이동
   */
  function goToToday() {
    const today = new Date()
    currentYear = today.getFullYear()
    currentMonth = today.getMonth() + 1
    loadMonthlySummary()
  }

  /**
   * 날짜 문자열 생성
   */
  function getDateString(day: number): string {
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  /**
   * 특정 날짜의 데이터 가져오기
   */
  function getDataForDay(day: number) {
    if (!monthlySummary?.daily_summary) return null
    const dateStr = getDateString(day)
    // API가 '2025. 10. 01.' 또는 '2025-10-01' 형식으로 반환할 수 있으므로 둘 다 처리
    return monthlySummary.daily_summary.find((d: any) => {
      // 점과 공백을 하이픈으로 변환하여 비교
      const normalizedDate = d.date.replace(/\.\s*/g, '-').replace(/-$/, '')
      return normalizedDate === dateStr
    })
  }

  /**
   * 휴일 체크
   */
  function getHolidayForDay(day: number): string | null {
    const dateStr = getDateString(day)
    const holiday = getHoliday(dateStr)
    return holiday?.name || null
  }

  /**
   * 오늘인지 체크
   */
  function isToday(day: number): boolean {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth - 1 &&
      today.getFullYear() === currentYear
    )
  }

  onMount(() => {
    loadMonthlySummary()
  })
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="bg-white rounded-lg shadow p-6">
    <!-- Year Selector -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">근태 관리 캘린더</h2>
      <div class="flex items-center gap-2">
        <select
          value={currentYear}
          onchange={(e) => {
            currentYear = parseInt(e.currentTarget.value)
            loadMonthlySummary()
          }}
          class="px-3 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {#each Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).reverse() as y}
            <option value={y}>{y}년</option>
          {/each}
        </select>
        <button
          type="button"
          onclick={goToToday}
          class="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          오늘
        </button>
      </div>
    </div>

    <!-- Month Selector -->
    <div class="grid grid-cols-6 md:grid-cols-12 gap-2">
      {#each Array.from({ length: 12 }, (_, i) => i) as m}
        {@const monthDate = new Date(currentYear, m, 1)}
        {@const isCurrentMonth = m === currentMonth - 1}
        {@const isFutureMonth = monthDate > new Date()}
        {@const monthLabel = m + 1 + '월'}
        <button
          type="button"
          onclick={() => {
            if (!isFutureMonth) {
              changeMonth(m)
            }
          }}
          disabled={isFutureMonth}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {isCurrentMonth
            ? 'bg-blue-600 text-white'
            : isFutureMonth
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-200'}"
        >
          {monthLabel}
        </button>
      {/each}
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else if monthlySummary}
    <!-- 요약 통계 -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">평균 출근</div>
        <div class="text-3xl font-bold text-green-600">
          {Math.round(
            (monthlySummary.daily_summary.reduce((sum, day) => sum + day.present, 0) /
              monthlySummary.daily_summary.length) *
              10,
          ) / 10}
        </div>
        <div class="text-xs text-gray-500 mt-1">명</div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">지각</div>
        <div class="text-3xl font-bold text-yellow-600">
          {monthlySummary.daily_summary.reduce((sum, day) => sum + day.late, 0)}
        </div>
        <div class="text-xs text-gray-500 mt-1">건</div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">조퇴</div>
        <div class="text-3xl font-bold text-orange-600">
          {monthlySummary.daily_summary.reduce((sum, day) => sum + day.early_leave, 0)}
        </div>
        <div class="text-xs text-gray-500 mt-1">건</div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">결근</div>
        <div class="text-3xl font-bold text-red-600">
          {monthlySummary.daily_summary.reduce((sum, day) => sum + day.absent, 0)}
        </div>
        <div class="text-xs text-gray-500 mt-1">건</div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">연차</div>
        <div class="text-3xl font-bold text-blue-600">
          {monthlySummary.daily_summary.reduce((sum, day) => sum + day.on_leave, 0)}
        </div>
        <div class="text-xs text-gray-500 mt-1">건</div>
      </div>
    </div>

    <!-- 캘린더 그리드 -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="grid grid-cols-7 gap-3">
        <!-- Weekday Headers -->
        {#each ['일', '월', '화', '수', '목', '금', '토'] as day, i}
          <div
            class="text-center font-bold text-base py-3 {i === 0
              ? 'text-red-600'
              : i === 6
                ? 'text-blue-600'
                : 'text-gray-700'}"
          >
            {day}
          </div>
        {/each}

        <!-- Calendar Days -->
        {#each calendarDays as day, index}
          {#if day === null}
            <div class="h-32"></div>
          {:else}
            {@const dayData = getDataForDay(day)}
            {@const today = isToday(day)}
            {@const dayOfWeek = index % 7}
            {@const holiday = getHolidayForDay(day)}
            {@const isSaturday = dayOfWeek === 6}
            {@const isSunday = dayOfWeek === 0}
            {@const isWeekend = isSaturday || isSunday}
            {@const hasData =
              dayData && (dayData.present > 0 || dayData.late > 0 || dayData.absent > 0)}

            <button
              type="button"
              onclick={() => handleDateClick(getDateString(day))}
              class="h-32 p-2 border-2 rounded-xl transition-all hover:shadow-lg hover:scale-[1.02] relative {today
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : ''} {hasData
                ? 'bg-green-50 border-green-200'
                : holiday
                  ? 'bg-red-50 border-red-200'
                  : isWeekend
                    ? 'bg-gray-50 border-gray-300'
                    : 'bg-white border-gray-200 hover:border-gray-400'}"
            >
              <!-- Date (fixed position top-left) -->
              <span
                class="absolute top-2 left-2 text-base font-bold {holiday || dayOfWeek === 0
                  ? 'text-red-600'
                  : dayOfWeek === 6
                    ? 'text-blue-600'
                    : 'text-gray-900'}"
              >
                {day}
              </span>

              <!-- Status Badge (fixed position top-right) -->
              {#if hasData}
                <span
                  class="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full {dayData.late >
                  0
                    ? 'bg-yellow-500'
                    : dayData.absent > 0
                      ? 'bg-red-500'
                      : 'bg-green-500'} text-white text-xs font-bold"
                  title={dayData.late > 0 ? '지각' : dayData.absent > 0 ? '결근' : '정상'}
                >
                  {dayData.late > 0 ? '!' : dayData.absent > 0 ? '✕' : '✓'}
                </span>
              {/if}

              <!-- Content Area -->
              <div class="flex flex-col items-center justify-center flex-1 gap-1 min-h-0 mt-6">
                {#if holiday}
                  <div class="text-red-600 font-bold text-xs text-center leading-tight px-1">
                    {holiday}
                  </div>
                {/if}

                {#if dayData}
                  <div class="space-y-0.5 w-full text-center">
                    {#if dayData.present > 0}
                      <div class="text-xs text-green-600 font-medium">
                        출근 {dayData.present}명
                      </div>
                    {/if}
                    {#if dayData.late > 0}
                      <div class="text-xs text-yellow-600 font-medium">지각 {dayData.late}건</div>
                    {/if}
                    {#if dayData.absent > 0}
                      <div class="text-xs text-red-600 font-medium">결근 {dayData.absent}건</div>
                    {/if}
                    {#if dayData.on_leave > 0}
                      <div class="text-xs text-blue-600 font-medium">연차 {dayData.on_leave}명</div>
                    {/if}
                  </div>
                {/if}
              </div>
            </button>
          {/if}
        {/each}
      </div>

      <!-- Legend -->
      <div class="mt-6 pt-4 border-t border-gray-200">
        <div class="text-sm font-medium text-gray-700 mb-3">상태 아이콘</div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="flex items-center gap-2">
            <div
              class="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold"
            >
              ✓
            </div>
            <span class="text-xs text-gray-600">정상</span>
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold"
            >
              !
            </div>
            <span class="text-xs text-gray-600">지각</span>
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold"
            >
              ✕
            </div>
            <span class="text-xs text-gray-600">결근</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-green-50 border-2 border-green-200"></div>
            <span class="text-xs text-gray-600">출근 기록</span>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- 상세 모달 -->
  {#if selectedDate && dailyDetail}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onclick={(e) => {
        if (e.target === e.currentTarget) selectedDate = null
      }}
    >
      <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[85vh] overflow-hidden">
        <div class="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold">{dailyDetail.date} 출퇴근 현황</h3>
            <button
              type="button"
              onclick={() => (selectedDate = null)}
              class="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="p-6 overflow-auto max-h-[calc(85vh-100px)]">
          {#if dailyDetail.employees && dailyDetail.employees.length > 0}
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr class="border-b-2 border-gray-200">
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">이름</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">부서</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">출근</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">퇴근</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">근무시간</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {#each dailyDetail.employees as employee}
                    <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td class="py-3 px-4 font-medium">{employee.name}</td>
                      <td class="py-3 px-4 text-gray-600">{employee.department || '-'}</td>
                      <td class="py-3 px-4 text-gray-700">
                        {employee.check_in || '-'}
                      </td>
                      <td class="py-3 px-4 text-gray-700">
                        {employee.check_out || '-'}
                      </td>
                      <td class="py-3 px-4 text-gray-700">
                        {#if employee.work_hours}
                          {@const hours = Math.floor(employee.work_hours)}
                          {@const minutes = Math.round((employee.work_hours - hours) * 60)}
                          {hours}시간 {minutes}분
                        {:else}
                          -
                        {/if}
                      </td>
                      <td class="py-3 px-4">
                        <span
                          class="px-3 py-1 rounded-full text-xs font-semibold {employee.status ===
                          'present'
                            ? 'bg-green-100 text-green-700'
                            : employee.status === 'late'
                              ? 'bg-yellow-100 text-yellow-700'
                              : employee.status === 'early_leave'
                                ? 'bg-orange-100 text-orange-700'
                                : employee.status === 'absent'
                                  ? 'bg-red-100 text-red-700'
                                  : employee.status === 'on_leave'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'}"
                        >
                          {employee.status_text || employee.status || '미기록'}
                        </span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="text-center py-12 text-gray-500">
              <p class="text-lg">해당 날짜의 출퇴근 기록이 없습니다.</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
