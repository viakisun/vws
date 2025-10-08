<script lang="ts">
  import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-svelte'
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
  const monthName = $derived(
    currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
  )

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
  function previousMonth() {
    currentMonth = new Date(year, monthIndex - 1, 1)
    if (onMonthChange) {
      onMonthChange(currentMonth)
    }
  }

  function nextMonth() {
    currentMonth = new Date(year, monthIndex + 1, 1)
    if (onMonthChange) {
      onMonthChange(currentMonth)
    }
  }

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
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-bold text-gray-900">{monthName}</h2>
    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={previousMonth}
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="이전 달"
      >
        <ChevronLeftIcon size={20} class="text-gray-600" />
      </button>
      <button
        type="button"
        onclick={goToToday}
        class="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        오늘
      </button>
      <button
        type="button"
        onclick={nextMonth}
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="다음 달"
      >
        <ChevronRightIcon size={20} class="text-gray-600" />
      </button>
    </div>
  </div>

  <!-- Calendar Grid -->
  <div class="grid grid-cols-7 gap-2">
    <!-- Weekday Headers -->
    {#each ['일', '월', '화', '수', '목', '금', '토'] as day, i}
      <div
        class="text-center font-semibold text-sm py-2 {i === 0
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
        <div class="aspect-square"></div>
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
          class="aspect-square p-2 border-2 rounded-lg transition-all hover:shadow-md {today
            ? 'ring-2 ring-blue-500'
            : ''} {holiday
            ? 'bg-red-50 border-red-200'
            : isWeekend
              ? 'bg-gray-50 border-gray-300'
              : record
                ? getStatusColor(record.status)
                : 'border-gray-200 hover:border-gray-300'}"
        >
          <div class="flex flex-col h-full">
            <div
              class="text-sm font-semibold mb-1 {holiday || dayOfWeek === 0
                ? 'text-red-600'
                : dayOfWeek === 6
                  ? 'text-blue-600'
                  : 'text-gray-900'}"
            >
              {day}
            </div>

            {#if holiday}
              <div class="flex-1 flex flex-col justify-center items-center text-xs">
                <div class="text-red-600 font-semibold text-[10px] text-center leading-tight">
                  {holiday}
                </div>
              </div>
            {:else if record}
              <div class="flex-1 flex flex-col justify-center items-center text-xs gap-0.5">
                <div class="font-medium text-gray-700 text-[10px]">
                  {getStatusText(record.status)}
                </div>
                {#if record.check_in_time}
                  <div class="text-gray-600 text-[10px]">
                    {record.check_in_time.substring(11, 16)}
                  </div>
                {/if}
                {#if record.check_out_time}
                  <div class="text-gray-500 text-[10px]">
                    ~ {record.check_out_time.substring(11, 16)}
                  </div>
                {/if}
                {#if record.total_work_hours}
                  {@const workHours =
                    typeof record.total_work_hours === 'string'
                      ? parseFloat(record.total_work_hours)
                      : record.total_work_hours}
                  {@const hours = Math.floor(workHours)}
                  {@const minutes = Math.round((workHours - hours) * 60)}
                  <div class="text-blue-600 font-semibold text-[10px] mt-0.5">
                    {hours}시간{minutes > 0 ? ` ${minutes}분` : ''}
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
    <div class="text-sm font-medium text-gray-700 mb-2">범례</div>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
        <span class="text-xs text-gray-600">정상</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
        <span class="text-xs text-gray-600">지각</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-orange-100 border-2 border-orange-300"></div>
        <span class="text-xs text-gray-600">조기퇴근</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-red-100 border-2 border-red-300"></div>
        <span class="text-xs text-gray-600">결근</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300"></div>
        <span class="text-xs text-gray-600">반차</span>
      </div>
    </div>
  </div>
</div>
