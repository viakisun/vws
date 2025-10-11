<script lang="ts">
  /**
   * LeaveTab Component
   *
   * HR 관리자용 연차 캘린더 탭
   * - 월간 캘린더 뷰
   * - 직원별 연차 현황
   * - 연차 촉진 대상 관리
   *
   * Clean Architecture:
   * - Hook: 상태 관리 및 비즈니스 로직
   * - Service: API 호출 및 데이터 변환
   * - Component: UI 렌더링만
   */

  import { useLeaveCalendar } from '$lib/hooks/leave/useLeaveCalendar.svelte'
  import { onMount } from 'svelte'

  // Hook 초기화
  const calendar = useLeaveCalendar()

  // 컴포넌트 마운트 시 데이터 로드
  onMount(() => {
    calendar.initialize()
  })
</script>

<div class="space-y-6">
  <!-- ========================================================================
       헤더: 연도 선택 및 오늘 버튼
       ======================================================================== -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">연차 관리 캘린더</h2>
      <div class="flex items-center gap-2">
        <!-- 연도 선택 -->
        <select
          value={calendar.currentYear}
          onchange={(e) => calendar.changeYear(parseInt(e.currentTarget.value))}
          class="px-3 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {#each calendar.yearList as y}
            <option value={y}>{y}년</option>
          {/each}
        </select>

        <!-- 오늘 버튼 -->
        <button
          type="button"
          onclick={calendar.goToToday}
          class="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          오늘
        </button>
      </div>
    </div>

    <!-- ======================================================================
         월 선택 버튼 그리드
         ====================================================================== -->
    <div class="grid grid-cols-6 md:grid-cols-12 gap-2">
      {#each calendar.monthList as month}
        {@const isCurrentMonth = calendar.isCurrentMonth(month)}
        {@const isFuture = calendar.isFutureMonth(month)}

        <button
          type="button"
          onclick={() => {
            if (!isFuture) {
              calendar.changeMonth(month)
            }
          }}
          disabled={isFuture}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {isCurrentMonth
            ? 'bg-blue-600 text-white'
            : isFuture
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-200'}"
        >
          {month}월
        </button>
      {/each}
    </div>
  </div>

  <!-- ========================================================================
       로딩 상태
       ======================================================================== -->
  {#if calendar.loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- ======================================================================
         에러 상태
         ====================================================================== -->
  {:else if calendar.error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-6">
      <p class="text-red-800 font-medium">⚠️ {calendar.error}</p>
    </div>

    <!-- ======================================================================
         데이터 로드 완료
         ====================================================================== -->
  {:else if calendar.calendarData}
    <!-- ====================================================================
         요약 통계
         ==================================================================== -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">이번 달 총 사용</div>
        <div class="text-3xl font-bold text-blue-600">
          {calendar.calendarData.summary.total_days_used.toFixed(1)}
        </div>
        <div class="text-xs text-gray-500 mt-1">일</div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">오늘 연차</div>
        <div class="text-3xl font-bold text-purple-600">
          {calendar.calendarData.summary.today_on_leave}
        </div>
        <div class="text-xs text-gray-500 mt-1">명</div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div class="text-sm text-gray-600 mb-1">연차 촉진 대상</div>
        <div class="text-3xl font-bold text-orange-600">
          {calendar.calendarData.promotion_targets.length}
        </div>
        <div class="text-xs text-gray-500 mt-1">명</div>
      </div>
    </div>

    <!-- ====================================================================
         캘린더 그리드
         ==================================================================== -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="grid grid-cols-7 gap-3">
        <!-- 요일 헤더 -->
        {#each calendar.weekdayHeaders as day, i}
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

        <!-- 캘린더 날짜 -->
        {#each calendar.calendarDays as calDay}
          {#if calDay.day === 0}
            <!-- 빈 칸 -->
            <div class="h-32"></div>
          {:else}
            {@const hasLeaves = calDay.data && calDay.data.total > 0}

            <button
              type="button"
              onclick={() => calendar.handleDateClick(calDay.dateString)}
              class="h-32 p-2 border-2 rounded-xl transition-all hover:shadow-lg hover:scale-[1.02] relative {calDay.isToday
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : ''} {hasLeaves
                ? 'bg-blue-50 border-blue-200'
                : calDay.holiday
                  ? 'bg-red-50 border-red-200'
                  : calDay.isWeekend
                    ? 'bg-gray-50 border-gray-300'
                    : 'bg-white border-gray-200 hover:border-gray-400'}"
            >
              <!-- 날짜 (좌상단 고정) -->
              <span
                class="absolute top-2 left-2 text-base font-bold {calDay.holiday ||
                calDay.isSunday
                  ? 'text-red-600'
                  : calDay.isSaturday
                    ? 'text-blue-600'
                    : 'text-gray-900'}"
              >
                {calDay.day}
              </span>

              <!-- 컨텐츠 영역 -->
              <div class="flex flex-col items-center justify-center flex-1 gap-1 min-h-0 mt-6">
                <!-- 휴일 -->
                {#if calDay.holiday}
                  <div class="text-red-600 font-bold text-xs text-center leading-tight px-1">
                    {calDay.holiday}
                  </div>
                {/if}

                <!-- 연차 목록 -->
                {#if hasLeaves && calDay.data}
                  <div class="space-y-0.5 w-full">
                    {#each calDay.data.leaves.slice(0, 2) as leave}
                      <div
                        class="text-xs px-1.5 py-0.5 rounded text-white truncate font-medium {calendar.getLeaveTypeColor(
                          leave.type,
                        )}"
                      >
                        {leave.employee_name}
                      </div>
                    {/each}

                    {#if calDay.data.total > 2}
                      <div class="text-xs text-gray-600 font-medium text-center">
                        +{calDay.data.total - 2}명
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </button>
          {/if}
        {/each}
      </div>

      <!-- ==================================================================
           범례 (Legend)
           ================================================================== -->
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

    <!-- ====================================================================
         연차 촉진 대상 목록
         ==================================================================== -->
    {#if calendar.calendarData.promotion_targets.length > 0}
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-bold mb-4">연차 촉진 대상 (미사용 50% 이상)</h3>
        <div class="space-y-2">
          {#each calendar.calendarData.promotion_targets as target}
            <div class="flex items-center justify-between p-3 bg-orange-50 rounded border">
              <div>
                <span class="font-semibold">{target.employee_name}</span>
                <span class="text-sm text-gray-600 ml-2">({target.department})</span>
              </div>
              <div class="text-sm">
                <span class="text-orange-600 font-semibold"
                  >{target.remaining_days.toFixed(1)}</span
                >
                일 잔여
                <span class="text-gray-500">/ {target.total_days.toFixed(1)}일</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- ==========================================================================
     상세 모달: 선택된 날짜의 연차 목록
     ========================================================================== -->
{#if calendar.selectedDate && calendar.selectedLeaves.length > 0}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onclick={(e) => {
      if (e.target === e.currentTarget) calendar.closeModal()
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') calendar.closeModal()
    }}
    role="button"
    tabindex="0"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[85vh] overflow-hidden">
      <!-- 모달 헤더 -->
      <div class="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold">{calendar.selectedDate} 연차 사용 현황</h3>
          <button
            type="button"
            onclick={() => calendar.closeModal()}
            class="text-white hover:text-gray-200 text-2xl"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 모달 컨텐츠 -->
      <div class="p-6 overflow-auto max-h-[calc(85vh-100px)]">
        {#if calendar.selectedLeaves.length > 0}
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
                {#each calendar.selectedLeaves as leave}
                  <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td class="py-3 px-4 font-medium">{leave.employee_name}</td>
                    <td class="py-3 px-4 text-gray-600">{leave.department || '-'}</td>
                    <td class="py-3 px-4">
                      <span
                        class="px-3 py-1 rounded-full text-xs text-white font-semibold {calendar.getLeaveTypeColor(
                          leave.type,
                        )}"
                      >
                        {leave.type}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-sm text-gray-700">
                      {calendar.formatLeavePeriod(leave.start_date, leave.end_date, leave.type)}
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
