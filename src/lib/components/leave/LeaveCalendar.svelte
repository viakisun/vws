<script lang="ts">
  import { getHoliday } from '$lib/utils/holidays'

  interface LeaveRequest {
    id: string
    start_date: string
    end_date: string
    total_days: number
    leave_type_name: string
    status: string
    start_time?: string
    end_time?: string
  }

  interface Props {
    currentYear: number
    currentMonth: number
    requests: LeaveRequest[]
    yearRequests: LeaveRequest[]
    onDateClick: (date: Date) => void
    onMonthChange: (date: Date) => void
    onYearChange: (year: number) => void
  }

  let {
    currentYear,
    currentMonth,
    requests,
    yearRequests,
    onDateClick,
    onMonthChange,
    onYearChange,
  }: Props = $props()

  const monthNames = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ]

  const today = new Date()
  const currentYearValue = today.getFullYear()

  // 최근 3년 + 다음 연도 (현재 - 2년부터 현재 + 1년까지)
  const availableYears = Array.from({ length: 4 }, (_, i) => currentYearValue - 2 + i)

  // 캘린더 날짜 생성
  const calendarDates = $derived.by(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const lastDay = new Date(currentYear, currentMonth, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const dates: (Date | null)[] = []

    // 이전 달 빈칸
    for (let i = 0; i < startDayOfWeek; i++) {
      dates.push(null)
    }

    // 현재 달 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(currentYear, currentMonth - 1, day))
    }

    return dates
  })

  // 특정 날짜의 연차 신청 조회
  function getLeaveForDate(date: Date): LeaveRequest | null {
    const dateStr = date.toISOString().split('T')[0]
    return (
      requests.find((req) => {
        const start = new Date(req.start_date).toISOString().split('T')[0]
        const end = new Date(req.end_date).toISOString().split('T')[0]
        return dateStr >= start && dateStr <= end
      }) || null
    )
  }

  // 연차 타입별 색상
  function getLeaveTypeColor(typeName: string): string {
    switch (typeName) {
      case '연차':
        return 'bg-blue-500'
      case '반차':
        return 'bg-yellow-500'
      case '오전반반차':
      case '오후반반차':
        return 'bg-orange-500'
      case '경조사':
        return 'bg-purple-500'
      case '예비군/민방위':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  // 연차 타입별 아이콘
  function getLeaveTypeIcon(typeName: string): string {
    switch (typeName) {
      case '연차':
        return '📅'
      case '반차':
        return '🌤️'
      case '오전반반차':
      case '오후반반차':
        return '🌅'
      case '경조사':
        return '💐'
      case '예비군/민방위':
        return '🪖'
      default:
        return '📋'
    }
  }

  function handleMonthClick(month: number) {
    const newDate = new Date(currentYear, month - 1, 1)
    onMonthChange(newDate)
  }

  // 특정 월의 승인된 연차 소진 일수 계산 (yearRequests 사용)
  function getApprovedLeaveDaysInMonth(year: number, month: number): number {
    const result = yearRequests
      .filter((req) => {
        if (req.status !== 'approved') return false

        const reqStart = new Date(req.start_date)
        const reqEnd = new Date(req.end_date)
        const monthStart = new Date(year, month - 1, 1)
        const monthEnd = new Date(year, month, 0)

        // 연차 기간이 해당 월과 겹치는지 확인
        return reqStart <= monthEnd && reqEnd >= monthStart
      })
      .reduce((sum, req) => {
        // total_days를 숫자로 변환하여 사용
        return sum + Number(req.total_days)
      }, 0)

    return result
  }
</script>

<div class="overflow-hidden">
  <!-- 헤더: 연도 선택 -->
  <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
        <span class="text-2xl">📅</span>
        <span>연차 캘린더</span>
      </h2>
      <select
        class="px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
        value={currentYear}
        onchange={(e) => onYearChange(parseInt(e.currentTarget.value))}
      >
        {#each availableYears as year}
          <option value={year}>{year}년</option>
        {/each}
      </select>
    </div>

    <!-- 월 선택 버튼 그리드 -->
    <div class="grid grid-cols-6 gap-2 mt-6">
      {#each monthNames as monthName, index}
        {@const monthNum = index + 1}
        {@const isCurrentMonth =
          currentYear === currentYearValue && monthNum === today.getMonth() + 1}
        {@const isSelected = monthNum === currentMonth}
        {@const leaveDays = getApprovedLeaveDaysInMonth(currentYear, monthNum)}
        <button
          type="button"
          onclick={() => handleMonthClick(monthNum)}
          class="relative px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm {isSelected
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105'
            : isCurrentMonth
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}"
        >
          <span>{monthName}</span>
          {#if leaveDays > 0}
            {@const displayDays =
              leaveDays % 1 === 0
                ? leaveDays.toString()
                : leaveDays.toFixed(2).replace(/\.?0+$/, '')}
            <span
              class="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-6 h-6 px-1.5 text-[10px] font-bold text-white bg-gradient-to-br from-rose-500 to-pink-600 rounded-full shadow-lg border-2 border-white"
            >
              {displayDays}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- 캘린더 그리드 -->
  <div class="p-6 bg-gray-50">
    <!-- 요일 헤더 -->
    <div class="grid grid-cols-7 gap-3 mb-3">
      {#each ['일', '월', '화', '수', '목', '금', '토'] as day, index}
        <div
          class="text-center text-sm font-bold py-3 {index === 0
            ? 'text-red-600'
            : index === 6
              ? 'text-blue-600'
              : 'text-gray-700'}"
        >
          {day}
        </div>
      {/each}
    </div>

    <!-- 날짜 그리드 -->
    <div class="grid grid-cols-7 gap-3">
      {#each calendarDates as date, index}
        {@const dayOfWeek = index % 7}
        {@const isToday =
          date &&
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()}
        {@const holiday = date ? getHoliday(date) : null}
        {@const leaveRequest = date ? getLeaveForDate(date) : null}
        {@const isWeekend = dayOfWeek === 0 || dayOfWeek === 6}
        {@const isHolidayOrWeekend = !!holiday || isWeekend}

        {#if date}
          <button
            type="button"
            onclick={() => !isHolidayOrWeekend && onDateClick(date)}
            disabled={isHolidayOrWeekend}
            class="relative h-32 rounded-xl border-2 transition-all shadow-sm {isHolidayOrWeekend
              ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
              : isToday
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                : leaveRequest
                  ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'}"
          >
            <!-- 날짜 (왼쪽 상단 고정) -->
            <span
              class="absolute top-2 left-2 text-sm font-semibold {dayOfWeek === 0
                ? 'text-red-600'
                : dayOfWeek === 6
                  ? 'text-blue-600'
                  : holiday
                    ? 'text-red-600'
                    : 'text-gray-900'}"
            >
              {date.getDate()}
            </span>

            <!-- 연차 표시 (우측 상단) -->
            {#if leaveRequest}
              <span
                class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs {getLeaveTypeColor(
                  leaveRequest.leave_type_name,
                )} text-white"
                title={leaveRequest.leave_type_name}
              >
                {getLeaveTypeIcon(leaveRequest.leave_type_name)}
              </span>
            {/if}

            <!-- 휴일 이름 (중앙) -->
            {#if holiday}
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-xs font-medium text-red-600 text-center px-2">
                  {holiday.name}
                </span>
              </div>
            {/if}

            <!-- 연차 타입 (하단) -->
            {#if leaveRequest}
              <div class="absolute bottom-2 left-2 right-2">
                <div class="text-xs font-medium text-gray-700 truncate">
                  {leaveRequest.leave_type_name}
                </div>
                <div class="text-xs text-gray-500">
                  {#if leaveRequest.start_time && leaveRequest.end_time && leaveRequest.leave_type_name !== '연차'}
                    {leaveRequest.start_time}-{leaveRequest.end_time}
                  {:else}
                    {leaveRequest.total_days}일
                  {/if}
                </div>
              </div>
            {/if}
          </button>
        {:else}
          <div class="h-32"></div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- 범례 -->
  <div class="px-4 pb-4 flex flex-wrap gap-4 text-sm">
    <div class="flex items-center gap-2">
      <div
        class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs"
      >
        📅
      </div>
      <span class="text-gray-700">연차</span>
    </div>
    <div class="flex items-center gap-2">
      <div
        class="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs"
      >
        🌤️
      </div>
      <span class="text-gray-700">반차</span>
    </div>
    <div class="flex items-center gap-2">
      <div
        class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs"
      >
        🌅
      </div>
      <span class="text-gray-700">반반차</span>
    </div>
    <div class="flex items-center gap-2">
      <div
        class="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs"
      >
        💐
      </div>
      <span class="text-gray-700">경조사</span>
    </div>
    <div class="flex items-center gap-2">
      <div
        class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs"
      >
        🪖
      </div>
      <span class="text-gray-700">예비군/민방위</span>
    </div>
  </div>
</div>
