<script lang="ts">
  /**
   * 연차관리 탭 (관리자용)
   * 전체 직원의 연차 현황을 월간 캘린더로 표시
   */
  import { onMount } from 'svelte'

  let loading = $state(false)
  let currentYear = $state(new Date().getFullYear())
  let currentMonth = $state(new Date().getMonth() + 1)
  let calendarData = $state<any>(null)
  let selectedDate = $state<string | null>(null)
  let selectedLeaves = $state<any[]>([])

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
    const dayData = calendarData.daily_leaves.find((d) => d.date === date)
    selectedLeaves = dayData?.leaves || []
  }

  /**
   * 월 변경
   */
  function changeMonth(delta: number) {
    currentMonth += delta
    if (currentMonth < 1) {
      currentMonth = 12
      currentYear--
    } else if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
    loadMonthlyCalendar()
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
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold text-gray-900">연차 관리</h2>
    <div class="flex items-center gap-4">
      <button
        type="button"
        onclick={() => changeMonth(-1)}
        class="px-3 py-1 text-sm border rounded hover:bg-gray-50"
      >
        이전
      </button>
      <span class="text-lg font-semibold">
        {currentYear}년 {currentMonth}월
      </span>
      <button
        type="button"
        onclick={() => changeMonth(1)}
        class="px-3 py-1 text-sm border rounded hover:bg-gray-50"
      >
        다음
      </button>
    </div>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <p class="text-gray-500">데이터를 불러오는 중...</p>
    </div>
  {:else if calendarData}
    <!-- 요약 카드 -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-lg shadow border">
        <p class="text-sm text-gray-600">이번 달 총 사용</p>
        <p class="text-2xl font-bold text-blue-600">
          {calendarData.summary.total_days_used.toFixed(1)}일
        </p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow border">
        <p class="text-sm text-gray-600">오늘 연차</p>
        <p class="text-2xl font-bold text-purple-600">
          {calendarData.summary.today_on_leave}명
        </p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow border">
        <p class="text-sm text-gray-600">연차 촉진 대상</p>
        <p class="text-2xl font-bold text-orange-600">
          {calendarData.promotion_targets.length}명
        </p>
      </div>
    </div>

    <!-- 캘린더 -->
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="grid grid-cols-7 gap-2">
        <div class="text-center font-semibold text-gray-700">일</div>
        <div class="text-center font-semibold text-gray-700">월</div>
        <div class="text-center font-semibold text-gray-700">화</div>
        <div class="text-center font-semibold text-gray-700">수</div>
        <div class="text-center font-semibold text-gray-700">목</div>
        <div class="text-center font-semibold text-gray-700">금</div>
        <div class="text-center font-semibold text-gray-700">토</div>

        {#each Array(new Date(currentYear, currentMonth - 1, 1).getDay()) as _}
          <div></div>
        {/each}

        {#each Array(new Date(currentYear, currentMonth, 0).getDate()) as _, i}
          {@const day = i + 1}
          {@const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`}
          {@const dayData = calendarData.daily_leaves.find((d) => d.date === dateStr)}

          <button
            type="button"
            onclick={() => handleDateClick(dateStr)}
            class="p-2 border rounded hover:bg-gray-50 text-left min-h-[80px]"
          >
            <div class="text-sm font-semibold mb-1">{day}</div>
            {#if dayData && dayData.total > 0}
              <div class="space-y-1">
                {#each dayData.leaves.slice(0, 2) as leave}
                  <div
                    class="text-xs px-1 py-0.5 rounded text-white truncate {getLeaveTypeColor(leave.type)}"
                  >
                    {leave.employee_name}
                  </div>
                {/each}
                {#if dayData.total > 2}
                  <div class="text-xs text-gray-500">+{dayData.total - 2}명</div>
                {/if}
              </div>
            {/if}
          </button>
        {/each}
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
                <span class="text-orange-600 font-semibold">{target.remaining_days.toFixed(1)}</span>
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
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-auto">
          <div class="p-6 border-b">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold">{selectedDate} 연차 사용 현황</h3>
              <button
                type="button"
                onclick={() => (selectedDate = null)}
                class="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
          <div class="p-6">
            <table class="w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">이름</th>
                  <th class="text-left py-2">부서</th>
                  <th class="text-left py-2">타입</th>
                  <th class="text-left py-2">기간</th>
                  <th class="text-left py-2">사유</th>
                </tr>
              </thead>
              <tbody>
                {#each selectedLeaves as leave}
                  <tr class="border-b">
                    <td class="py-2">{leave.employee_name}</td>
                    <td class="py-2">{leave.department}</td>
                    <td class="py-2">
                      <span
                        class="px-2 py-1 rounded text-xs text-white {getLeaveTypeColor(leave.type)}"
                      >
                        {leave.type}
                      </span>
                    </td>
                    <td class="py-2 text-sm">
                      {new Date(leave.start_date).toLocaleDateString('ko-KR')}
                      ~
                      {new Date(leave.end_date).toLocaleDateString('ko-KR')}
                    </td>
                    <td class="py-2 text-sm">{leave.reason}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
