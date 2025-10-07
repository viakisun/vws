<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { formatCurrency } from '$lib/utils/format'
  import { DollarSignIcon, TrendingUpIcon, UsersIcon } from '@lucide/svelte'

  interface Props {
    dashboardStats: {
      currentMonth: {
        totalGrossSalary: number
        totalEmployees: number
      }
      departmentStats: Record<string, { averageGrossSalary: number }>
      activeContracts: number
    }
  }

  const { dashboardStats }: Props = $props()

  const averageSalary = $derived(
    dashboardStats.currentMonth.totalEmployees > 0
      ? dashboardStats.currentMonth.totalGrossSalary / dashboardStats.currentMonth.totalEmployees
      : 0,
  )
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <!-- 이번 달 지급 예정액 -->
  <ThemeCard class="p-4">
    <div class="flex items-center gap-3">
      <div class="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
        <DollarSignIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p class="text-sm" style:color="var(--color-text-secondary)">이번 달 지급 예정액</p>
        <p class="text-2xl font-bold" style:color="var(--color-text)">
          {formatCurrency(dashboardStats.currentMonth.totalGrossSalary)}
        </p>
      </div>
    </div>
  </ThemeCard>

  <!-- 계약 직원 수 -->
  <ThemeCard class="p-4">
    <div class="flex items-center gap-3">
      <div class="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
        <UsersIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <p class="text-sm" style:color="var(--color-text-secondary)">계약 직원 수</p>
        <p class="text-2xl font-bold" style:color="var(--color-text)">
          {dashboardStats.activeContracts}명
        </p>
      </div>
    </div>
  </ThemeCard>

  <!-- 평균 급여 -->
  <ThemeCard class="p-4">
    <div class="flex items-center gap-3">
      <div class="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
        <TrendingUpIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
      </div>
      <div>
        <p class="text-sm" style:color="var(--color-text-secondary)">평균 급여</p>
        <p class="text-2xl font-bold" style:color="var(--color-text)">
          {formatCurrency(averageSalary)}
        </p>
      </div>
    </div>
  </ThemeCard>
</div>
