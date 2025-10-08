<script lang="ts">
  /**
   * 연차관리 탭 (관리자용)
   * 전체 직원의 연차 현황을 월간 캘린더로 표시
   */
  import { onMount } from 'svelte'
  import { getHoliday } from '$lib/utils/holidays'

  let loading = $state(false)
  let currentYear = $state(new Date().getFullYear())
  let currentMonth = $state(new Date().getMonth() + 1)
  let calendarData = $state<any>(null)
  let selectedDate = $state<string | null>(null)
  let selectedLeaves = $state<any[]>([])

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
   * 월간 연차 캘린더 조회
   */
  async function loadMonthlyCalendar() {
    loading = true
    try {
      const response = await fetch(
        `/api/hr/leave/monthly-calendar?year=${currentYear}&month=${currentMonth}`,
      )
      if (response.ok) {
        calendarData = await response.json()
      } else {
        console.error('연차 캘린더 로드 실패:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Failed to load leave calendar:', error)
    } finally {
      loading = false
    }
  }

  /**
   * 날짜 클릭 핸들러
   */
  function handleDateClick(date: string) {
    selectedDate = date
    const dayData = calendarData.daily_leaves.find((d: any) => {
      // 날짜 형식 정규화하여 비교
      const normalizedApiDate = d.date.replace(/\.\s*/g, '-').replace(/-$/, '')
      return normalizedApiDate === date || d.date === date
    })
    selectedLeaves = dayData?.leaves || []
  }

  /**
   * 월 변경
   */
  function changeMonth(monthIndex: number) {
    currentMonth = monthIndex + 1
    loadMonthlyCalendar()
  }

  /**
   * 오늘로 이동
   */
  function goToToday() {
    const today = new Date()
    currentYear = today.getFullYear()
    currentMonth = today.getMonth() + 1
    loadMonthlyCalendar()
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
    if (!calendarData?.daily_leaves) return null
    const dateStr = getDateString(day)
    return calendarData.daily_leaves.find((d: any) => {
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

  /**
   * 연차 타입별 색상
   */
  function getLeaveTypeColor(type: string): string {
    switch (type) {
      case '연차':
        return 'bg-blue-500'
      case '반차':
        return 'bg-yellow-500'
      case '반반차':
        return 'bg-orange-500'
      case '경조사':
        return 'bg-purple-500'
      case '예비군/민방위':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  onMount(() => {
    loadMonthlyCalendar()
  })
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="bg-white rounded-lg shadow p-6">
    <!-- Year Selector -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">연차 관리 캘린더</h2>
      <div class="flex items-center gap-2">
        <select
          value={currentYear}
          onchange={(e) => {
            currentYear = parseInt(e.currentTarget.value)
            loadMonthlyCalendar()
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
  {:else if calendarData}
    <!-- 요약 통계 -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">이번 달 총 사용</div>
        <div class="text-3xl font-bold text-blue-600">
          {calendarData.summary.total_days_used.toFixed(1)}
        </div>
        <div class="text-xs text-gray-500 mt-1">일</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">오늘 연차</div>
        <div class="text-3xl font-bold text-purple-600">
          {calendarData.summary.today_on_leave}
        </div>
        <div class="text-xs text-gray-500 mt-1">명</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">연차 촉진 대상</div>
        <div class="text-3xl font-bold text-orange-600">
          {calendarData.promotion_targets.length}
        </div>
        <div class="text-xs text-gray-500 mt-1">명</div>
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
            {@const hasLeaves = dayData && dayData.total > 0}

            <button
              type="button"
              onclick={() => handleDateClick(getDateString(day))}
              class="h-32 p-2 border-2 rounded-xl transition-all hover:shadow-lg hover:scale-[1.02] relative {today
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : ''} {hasLeaves
                ? 'bg-blue-50 border-blue-200'
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

              <!-- Content Area -->
              <div class="flex flex-col items-center justify-center flex-1 gap-1 min-h-0 mt-6">
                {#if holiday}
                  <div class="text-red-600 font-bold text-xs text-center leading-tight px-1">
                    {holiday}
                  </div>
                {/if}

                {#if dayData && dayData.total > 0}
                  <div class="space-y-0.5 w-full">
                    {#each dayData.leaves.slice(0, 2) as leave}
                      <div
                        class="text-xs px-1.5 py-0.5 rounded text-white truncate font-medium {getLeaveTypeColor(
                          leave.type,
                        )}"
                      >
                        {leave.employee_name}
                      </div>
                    {/each}
                    {#if dayData.total > 2}
                      <div class="text-xs text-gray-600 font-medium text-center">
                        +{dayData.total - 2}명
                      </div>
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
        <div class="text-sm font-medium text-gray-700 mb-3">연차 타입</div>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-blue-500"></div>
            <span class="text-xs text-gray-600">연차</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-yellow-500"></div>
            <span class="text-xs text-gray-600">반차</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-orange-500"></div>
            <span class="text-xs text-gray-600">반반차</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-purple-500"></div>
            <span class="text-xs text-gray-600">경조사</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-green-500"></div>
            <span class="text-xs text-gray-600">예비군/민방위</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 연차 촉진 대상 -->
    {#if calendarData.promotion_targets.length > 0}
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-bold mb-4">연차 촉진 대상 (미사용 50% 이상)</h3>
        <div class="space-y-2">
          {#each calendarData.promotion_targets as target}
            <div class="flex items-center justify-between p-3 bg-orange-50 rounded border">
              <div>
                <span class="font-semibold">{target.employee_name}</span>
                <span class="text-sm text-gray-600 ml-2">({target.department})</span>
              </div>
              <div class="text-sm">
                <span class="text-orange-600 font-semibold">{target.remaining_days.toFixed(1)}</span
                >
                일 잔여
                <span class="text-gray-500">/ {target.total_days.toFixed(1)}일</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 상세 모달 -->
    {#if selectedDate && selectedLeaves.length > 0}
      <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onclick={(e) => {
          if (e.target === e.currentTarget) selectedDate = null
        }}
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[85vh] overflow-hidden"
        >
          <div class="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold">{selectedDate} 연차 사용 현황</h3>
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
            {#if selectedLeaves && selectedLeaves.length > 0}
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr class="border-b-2 border-gray-200">
                      <th class="text-left py-3 px-4 font-semibold text-gray-700">이름</th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700">부서</th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700">타입</th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700">기간</th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700">사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each selectedLeaves as leave}
                      <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td class="py-3 px-4 font-medium">{leave.employee_name}</td>
                        <td class="py-3 px-4 text-gray-600">{leave.department || '-'}</td>
                        <td class="py-3 px-4">
                          <span
                            class="px-3 py-1 rounded-full text-xs text-white font-semibold {getLeaveTypeColor(
                              leave.type,
                            )}"
                          >
                            {leave.type}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-sm text-gray-700">
                          {leave.start_date} ~ {leave.end_date}
                        </td>
                        <td class="py-3 px-4 text-sm text-gray-700">{leave.reason || '-'}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else}
              <div class="text-center py-12 text-gray-500">
                <p class="text-lg">해당 날짜의 연차 사용 기록이 없습니다.</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
