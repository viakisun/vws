<script lang="ts">
  import { onMount } from 'svelte'
  import { ChevronLeftIcon, ChevronRightIcon, TargetIcon, CalendarIcon } from 'lucide-svelte'
  import type { MilestoneWithProduct } from '$lib/planner/types'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import MilestoneModal from '$lib/planner/components/MilestoneModal.svelte'

  // =============================================
  // State
  // =============================================

  let milestones = $state<MilestoneWithProduct[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let showMilestoneModal = $state(false)
  let currentDate = $state(new Date())

  // =============================================
  // Data Fetching
  // =============================================

  async function loadMilestones() {
    try {
      loading = true
      error = null

      const res = await fetch('/api/planner/milestones')
      if (!res.ok) throw new Error('Failed to load milestones')

      const data = await res.json()
      milestones = data.data
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load milestones'
      console.error('Error loading milestones:', e)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadMilestones()
  })

  // =============================================
  // Calendar Logic
  // =============================================

  const currentYear = $derived(currentDate.getFullYear())
  const currentMonth = $derived(currentDate.getMonth())

  const monthName = $derived(
    new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(currentDate),
  )

  // Get first day of month (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = $derived(new Date(currentYear, currentMonth, 1).getDay())

  // Get number of days in month
  const daysInMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate())

  // Get days from previous month to fill
  const daysInPrevMonth = $derived(new Date(currentYear, currentMonth, 0).getDate())

  // Generate calendar days
  const calendarDays = $derived(() => {
    const days: Array<{
      date: number
      month: 'prev' | 'current' | 'next'
      fullDate: Date
    }> = []

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: daysInPrevMonth - i,
        month: 'prev',
        fullDate: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i),
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        month: 'current',
        fullDate: new Date(currentYear, currentMonth, i),
      })
    }

    // Next month days to complete the grid
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        month: 'next',
        fullDate: new Date(currentYear, currentMonth + 1, i),
      })
    }

    return days
  })

  // Get milestones for a specific date
  function getMilestonesForDate(date: Date): MilestoneWithProduct[] {
    const dateStr = date.toISOString().split('T')[0]
    return milestones.filter((m) => {
      const targetDate = new Date(m.target_date).toISOString().split('T')[0]
      return targetDate === dateStr
    })
  }

  // Check if date is today
  function isToday(date: Date): boolean {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Navigation
  function prevMonth() {
    currentDate = new Date(currentYear, currentMonth - 1, 1)
  }

  function nextMonth() {
    currentDate = new Date(currentYear, currentMonth + 1, 1)
  }

  function goToToday() {
    currentDate = new Date()
  }

  // Helpers
  function getMilestoneStatusColor(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'blue'
      case 'in_progress':
        return 'orange'
      case 'achieved':
        return 'green'
      case 'missed':
        return 'red'
      default:
        return 'blue'
    }
  }

  function getMilestoneStatusText(status: string): string {
    switch (status) {
      case 'upcoming':
        return '예정'
      case 'in_progress':
        return '진행 중'
      case 'achieved':
        return '달성'
      case 'missed':
        return '미달성'
      default:
        return status
    }
  }

  // Stats
  const stats = $derived([
    {
      title: '전체 마일스톤',
      value: milestones.length,
      icon: TargetIcon,
      color: 'blue' as const,
    },
    {
      title: '진행 중',
      value: milestones.filter((m) => m.status === 'in_progress').length,
      color: 'orange' as const,
    },
    {
      title: '달성',
      value: milestones.filter((m) => m.status === 'achieved').length,
      color: 'green' as const,
    },
    {
      title: '예정',
      value: milestones.filter((m) => m.status === 'upcoming').length,
      color: 'purple' as const,
    },
  ])
</script>

<svelte:head>
  <title>마일스톤 - 플래너</title>
</svelte:head>

<PageLayout
  title="마일스톤"
  subtitle="모든 제품의 마일스톤을 캘린더로 확인합니다"
  {stats}
  actions={[
    {
      label: '마일스톤 추가',
      variant: 'primary' as const,
      icon: TargetIcon,
      onclick: () => (showMilestoneModal = true),
    },
  ]}
>
  {#if loading}
    <div class="text-center py-12">
      <div style:color="var(--color-text-secondary)">로딩 중...</div>
    </div>
  {:else if error}
    <ThemeCard variant="outlined" class="border-red-200 bg-red-50">
      <p style:color="var(--color-error)">{error}</p>
    </ThemeCard>
  {:else}
    <!-- Calendar Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold" style:color="var(--color-text-primary)">
        {monthName}
      </h2>
      <div class="flex items-center gap-2">
        <ThemeButton variant="ghost" size="sm" onclick={goToToday}>
          <CalendarIcon size={16} />
          오늘
        </ThemeButton>
        <ThemeButton variant="ghost" size="sm" onclick={prevMonth}>
          <ChevronLeftIcon size={20} />
        </ThemeButton>
        <ThemeButton variant="ghost" size="sm" onclick={nextMonth}>
          <ChevronRightIcon size={20} />
        </ThemeButton>
      </div>
    </div>

    <!-- Calendar Grid -->
    <ThemeCard variant="default">
      <!-- Day headers -->
      <div class="grid grid-cols-7 gap-px mb-2">
        {#each ['일', '월', '화', '수', '목', '금', '토'] as day, i}
          <div
            class="text-center text-sm font-semibold py-3"
            style:color={i === 0
              ? 'var(--color-red)'
              : i === 6
                ? 'var(--color-blue)'
                : 'var(--color-text-secondary)'}
          >
            {day}
          </div>
        {/each}
      </div>

      <!-- Calendar days -->
      <div class="grid grid-cols-7 gap-px" style:background="var(--color-border-light)">
        {#each calendarDays() as day, i}
          {@const dayMilestones = getMilestonesForDate(day.fullDate)}
          <div
            class="min-h-28 p-2"
            style:background={day.month === 'current'
              ? 'var(--color-surface)'
              : 'var(--color-surface-elevated)'}
          >
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-sm font-medium"
                class:px-2={isToday(day.fullDate)}
                class:py-1={isToday(day.fullDate)}
                class:rounded-full={isToday(day.fullDate)}
                style:color={isToday(day.fullDate)
                  ? 'white'
                  : day.month === 'current'
                    ? i % 7 === 0
                      ? 'var(--color-red)'
                      : i % 7 === 6
                        ? 'var(--color-blue)'
                        : 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)'}
                style:background={isToday(day.fullDate) ? 'var(--color-primary)' : 'transparent'}
              >
                {day.date}
              </span>
            </div>

            {#if dayMilestones.length > 0}
              <div class="space-y-1">
                {#each dayMilestones.slice(0, 3) as milestone}
                  {@const statusColor = getMilestoneStatusColor(milestone.status)}
                  <a
                    href="/planner/products/{milestone.product_id}"
                    class="block px-2 py-1 rounded text-xs font-medium truncate transition hover:opacity-80"
                    style:background="var(--color-{statusColor}-light)"
                    style:color="var(--color-{statusColor})"
                    title={`${milestone.name} - ${milestone.product_name}`}
                  >
                    {milestone.name}
                  </a>
                {/each}
                {#if dayMilestones.length > 3}
                  <div class="text-xs px-2 py-1" style:color="var(--color-text-tertiary)">
                    +{dayMilestones.length - 3}개 더
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </ThemeCard>

    <!-- Upcoming Milestones List -->
    <div class="mt-8">
      <h3 class="text-xl font-bold mb-4" style:color="var(--color-text-primary)">
        다가오는 마일스톤
      </h3>

      {#if milestones.filter((m) => new Date(m.target_date) >= new Date() && m.status !== 'achieved').length === 0}
        <ThemeCard variant="default">
          <p class="text-center py-8 text-sm" style:color="var(--color-text-tertiary)">
            다가오는 마일스톤이 없습니다.
          </p>
        </ThemeCard>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each milestones
            .filter((m) => new Date(m.target_date) >= new Date() && m.status !== 'achieved')
            .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
            .slice(0, 6) as milestone}
            {@const statusColor = getMilestoneStatusColor(milestone.status)}
            <a href="/planner/products/{milestone.product_id}" class="block">
              <ThemeCard variant="default" hover clickable>
                <div class="flex items-start justify-between mb-3">
                  <h4 class="text-base font-semibold" style:color="var(--color-text-primary)">
                    {milestone.name}
                  </h4>
                  <span
                    class="ml-2 px-2 py-1 text-xs font-semibold rounded-lg whitespace-nowrap"
                    style:background="var(--color-{statusColor}-light)"
                    style:color="var(--color-{statusColor})"
                  >
                    {getMilestoneStatusText(milestone.status)}
                  </span>
                </div>

                {#if milestone.description}
                  <p
                    class="text-sm mb-3 line-clamp-2 leading-relaxed"
                    style:color="var(--color-text-secondary)"
                  >
                    {milestone.description}
                  </p>
                {/if}

                <div
                  class="flex items-center justify-between text-xs pt-3"
                  style:border-top="1px solid var(--color-border-light)"
                >
                  <span style:color="var(--color-text-tertiary)">{milestone.product_name}</span>
                  <span class="font-medium" style:color="var(--color-primary)">
                    {new Date(milestone.target_date).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </ThemeCard>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</PageLayout>

<!-- Milestone Modal -->
<MilestoneModal
  bind:open={showMilestoneModal}
  onclose={() => (showMilestoneModal = false)}
  onsave={() => {
    showMilestoneModal = false
    loadMilestones()
  }}
/>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
