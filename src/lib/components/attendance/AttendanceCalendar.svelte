<script lang="ts">
  import { getHoliday } from '$lib/utils/holidays'

  interface AttendanceRecord {
    date: string
    check_in_time?: string
    check_out_time?: string
    status: string
    total_work_hours?: string | number
  }

  interface Props {
    month?: Date
    records?: AttendanceRecord[]
    onDateClick?: (date: string) => void
    onMonthChange?: (date: Date) => void
  }

  let { month = new Date(), records = [], onDateClick, onMonthChange }: Props = $props()

  // State
  let currentMonth = $state(new Date(month))

  // Effect to sync month prop changes
  $effect(() => {
    currentMonth = new Date(month)
  })

  // Computed
  const year = $derived(currentMonth.getFullYear())
  const monthIndex = $derived(currentMonth.getMonth())

  const firstDay = $derived(new Date(year, monthIndex, 1).getDay())
  const daysInMonth = $derived(new Date(year, monthIndex + 1, 0).getDate())

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

  // Functions
  function goToToday() {
    currentMonth = new Date()
    if (onMonthChange) {
      onMonthChange(currentMonth)
    }
  }

  function getDateString(day: number): string {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function getRecordForDay(day: number): AttendanceRecord | undefined {
    const dateStr = getDateString(day)
    return records.find((r) => r.date === dateStr)
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'present':
        return 'bg-green-100 border-green-300'
      case 'late':
        return 'bg-yellow-100 border-yellow-300'
      case 'early_leave':
        return 'bg-orange-100 border-orange-300'
      case 'absent':
        return 'bg-red-100 border-red-300'
      case 'half_day':
        return 'bg-blue-100 border-blue-300'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'present':
        return '정상'
      case 'late':
        return '지각'
      case 'early_leave':
        return '조기퇴근'
      case 'absent':
        return '결근'
      case 'half_day':
        return '반차'
      default:
        return ''
    }
  }

  function handleDateClick(day: number) {
    if (onDateClick) {
      onDateClick(getDateString(day))
    }
  }

  function isToday(day: number): boolean {
    const today = new Date()
    return (
      today.getDate() === day && today.getMonth() === monthIndex && today.getFullYear() === year
    )
  }

  function getHolidayForDay(day: number): string | null {
    const dateStr = getDateString(day)
    const holiday = getHoliday(dateStr)
    return holiday?.name || null
  }
</script>

<div class="bg-white rounded-lg shadow p-6">
  <!-- Calendar Header -->
  <div class="mb-6 space-y-4">
    <!-- Year Selector -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">출퇴근 캘린더</h2>
      <div class="flex items-center gap-2">
        <select
          value={year}
          onchange={(e) => {
            const newYear = parseInt(e.currentTarget.value)
            currentMonth = new Date(newYear, monthIndex, 1)
            if (onMonthChange) {
              onMonthChange(currentMonth)
            }
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
        {@const monthDate = new Date(year, m, 1)}
        {@const isCurrentMonth = m === monthIndex}
        {@const isFutureMonth = monthDate > new Date()}
        {@const monthLabel = m + 1 + '월'}
        <button
          type="button"
          onclick={() => {
            if (!isFutureMonth) {
              currentMonth = new Date(year, m, 1)
              if (onMonthChange) {
                onMonthChange(currentMonth)
              }
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

  <!-- Calendar Grid -->
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
        {@const record = getRecordForDay(day)}
        {@const today = isToday(day)}
        {@const dayOfWeek = index % 7}
        {@const holiday = getHolidayForDay(day)}
        {@const isSaturday = dayOfWeek === 6}
        {@const isSunday = dayOfWeek === 0}
        {@const isWeekend = isSaturday || isSunday}
        <button
          type="button"
          onclick={() => handleDateClick(day)}
          class="h-32 p-2 border-2 rounded-xl transition-all hover:shadow-lg hover:scale-[1.02] relative {today
            ? 'ring-2 ring-blue-500 ring-offset-2'
            : ''} {record
            ? getStatusColor(record.status)
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
          {#if record}
            {@const workHours =
              typeof record.total_work_hours === 'string'
                ? parseFloat(record.total_work_hours)
                : record.total_work_hours || 0}
            {@const isOverwork = workHours >= 11}
            {#if holiday}
              <!-- 휴일 근무: 근무시간만 표시 (지각/조퇴 없음) -->
              <span
                class="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full {isOverwork
                  ? 'bg-purple-500'
                  : 'bg-blue-500'} text-white text-xs font-bold"
                title={isOverwork ? '휴일 장시간 근무' : '휴일 근무'}
              >
                {isOverwork ? '⚡' : '✓'}
              </span>
            {:else if record.status === 'present'}
              <span
                class="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full {isOverwork
                  ? 'bg-purple-500'
                  : 'bg-green-500'} text-white text-xs font-bold"
                title={isOverwork ? '장시간 근무' : '정상'}
              >
                {isOverwork ? '⚡' : '✓'}
              </span>
            {:else if record.status === 'late'}
              <span
                class="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full {isOverwork
                  ? 'bg-purple-500'
                  : 'bg-yellow-500'} text-white text-xs font-bold"
                title={isOverwork ? '지각 + 장시간 근무' : '지각'}
              >
                {isOverwork ? '⚡' : '!'}
              </span>
            {:else if record.status === 'early_leave'}
              <span
                class="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold"
                title="조기퇴근"
              >
                ↑
              </span>
            {:else if record.status === 'absent'}
              <span
                class="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold"
                title="결근"
              >
                ✕
              </span>
            {/if}
          {/if}

          <!-- Content Area -->
          <div class="flex flex-col items-center justify-center flex-1 gap-1.5 min-h-0">
            {#if holiday && !record}
              <!-- 휴일만 있고 출퇴근 기록 없음 -->
              <div class="text-red-600 font-bold text-xs text-center leading-tight px-1">
                {holiday}
              </div>
            {:else if holiday && record}
              <!-- 휴일 + 출퇴근 기록 -->
              <div class="text-red-600 font-bold text-[11px] text-center leading-tight mb-0.5">
                {holiday}
              </div>
            {/if}

            {#if record}
              <!-- Time Info -->
              <div class="space-y-0.5">
                {#if record.check_in_time && record.check_out_time}
                  <div class="text-center text-[10px] text-gray-600 font-medium">
                    {record.check_in_time.substring(11, 16)}
                  </div>
                  <div class="text-center text-[10px] text-gray-500">~</div>
                  <div class="text-center text-[10px] text-gray-600 font-medium">
                    {record.check_out_time.substring(11, 16)}
                  </div>
                {:else if record.check_in_time}
                  <div class="text-center text-[10px] text-gray-600 font-medium">
                    {record.check_in_time.substring(11, 16)}
                  </div>
                  <div class="text-center text-[9px] text-gray-500">출근중</div>
                {/if}
              </div>

              <!-- Work Hours -->
              {#if record.total_work_hours}
                {@const workHours =
                  typeof record.total_work_hours === 'string'
                    ? parseFloat(record.total_work_hours)
                    : record.total_work_hours}
                {@const hours = Math.floor(workHours)}
                {@const minutes = Math.round((workHours - hours) * 60)}
                {@const isOverwork = workHours >= 11}
                {#if hours > 0 || minutes > 0}
                  <div class="mt-0.5">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold {isOverwork
                        ? 'bg-purple-600'
                        : 'bg-blue-600'} text-white shadow-sm"
                    >
                      {hours}h {minutes}m
                    </span>
                  </div>
                {/if}
              {/if}
            {/if}
          </div>
        </button>
      {/if}
    {/each}
  </div>

  <!-- Legend -->
  <div class="mt-6 pt-4 border-t border-gray-200">
    <div class="text-sm font-medium text-gray-700 mb-3">상태 아이콘</div>
    <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
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
          class="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold"
        >
          ↑
        </div>
        <span class="text-xs text-gray-600">조기퇴근</span>
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
        <div
          class="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold"
        >
          ⚡
        </div>
        <span class="text-xs text-gray-600">장시간 근무</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300"></div>
        <span class="text-xs text-gray-600">반차</span>
      </div>
    </div>
  </div>
</div>
