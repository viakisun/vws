<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { UsersIcon, UserCheckIcon, UserXIcon, CalendarIcon } from '@lucide/svelte'
  import type { Employee } from '$lib/types/hr'

  interface Props {
    employees: Employee[]
  }

  const { employees = [] }: Props = $props()

  // 통계 계산
  const stats = $derived.by(() => {
    const activeEmployees = employees.filter((e) => e.status === 'active')
    const onLeave = employees.filter((e) => e.status === 'on-leave')

    // 이번 달 입사자
    const thisMonth = new Date().toISOString().slice(0, 7)
    const thisMonthHires = employees.filter((e) => e.hire_date && e.hire_date.startsWith(thisMonth))

    // 이번 달 퇴사자
    const thisMonthTerminations = employees.filter(
      (e) => e.termination_date && e.termination_date.startsWith(thisMonth),
    )

    return {
      active: activeEmployees.length,
      onLeave: onLeave.length,
      thisMonthHires: thisMonthHires.length,
      thisMonthTerminations: thisMonthTerminations.length,
    }
  })
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- 재직자 -->
  <ThemeCard class="p-4">
    <div class="flex items-center gap-3">
      <div class="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
        <UserCheckIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p class="text-sm" style:color="var(--color-text-secondary)">재직자</p>
        <p class="text-2xl font-bold" style:color="var(--color-text)">{stats.active}</p>
      </div>
    </div>
  </ThemeCard>

  <!-- 휴직/휴가 -->
  <ThemeCard class="p-4">
    <div class="flex items-center gap-3">
      <div class="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
        <CalendarIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
      </div>
      <div>
        <p class="text-sm" style:color="var(--color-text-secondary)">휴직/휴가</p>
        <p class="text-2xl font-bold" style:color="var(--color-text)">{stats.onLeave}</p>
      </div>
    </div>
  </ThemeCard>

  <!-- 이번 달 입사 -->
  <ThemeCard class="p-4">
    <div class="flex items-center gap-3">
      <div class="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
        <UsersIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <p class="text-sm" style:color="var(--color-text-secondary)">이번 달 입사</p>
        <p class="text-2xl font-bold" style:color="var(--color-text)">
          {stats.thisMonthHires}
        </p>
      </div>
    </div>
  </ThemeCard>

  <!-- 이번 달 퇴사 -->
  <ThemeCard class="p-4">
    <div class="flex items-center gap-3">
      <div class="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
        <UserXIcon class="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <p class="text-sm" style:color="var(--color-text-secondary)">이번 달 퇴사</p>
        <p class="text-2xl font-bold" style:color="var(--color-text)">
          {stats.thisMonthTerminations}
        </p>
      </div>
    </div>
  </ThemeCard>
</div>
