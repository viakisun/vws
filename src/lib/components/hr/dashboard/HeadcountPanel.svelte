<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type { Department, Employee } from '$lib/types/hr'
  import { TrendingDownIcon, TrendingUpIcon, UsersIcon } from '@lucide/svelte'

  interface Props {
    departments: Department[]
    employees: Employee[]
  }

  const { departments = [], employees = [] }: Props = $props()

  // 부서별 T.O vs 현재 인원 계산
  const headcountData = $derived.by(() => {
    return departments.map((dept) => {
      const currentCount = employees.filter(
        (e) => e.department === dept.name && e.status === 'active',
      ).length
      const headcount = dept.headcount || 0
      const difference = currentCount - headcount
      const percentage = headcount > 0 ? Math.round((currentCount / headcount) * 100) : 0

      return {
        department: dept.name,
        current: currentCount,
        headcount: headcount,
        difference: difference,
        percentage: percentage,
        status: difference > 0 ? 'over' : difference < 0 ? 'under' : 'exact',
      }
    })
  })

  // 전체 통계
  const totalStats = $derived.by(() => {
    const totalCurrent = employees.filter((e) => e.status === 'active').length
    const totalHeadcount = departments.reduce((sum, dept) => sum + (dept.headcount || 0), 0)
    const totalDifference = totalCurrent - totalHeadcount

    return {
      current: totalCurrent,
      headcount: totalHeadcount,
      difference: totalDifference,
      percentage: totalHeadcount > 0 ? Math.round((totalCurrent / totalHeadcount) * 100) : 0,
    }
  })
</script>

<ThemeCard class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-2">
      <UsersIcon class="w-5 h-5 text-blue-600" />
      <h3 class="text-lg font-semibold" style:color="var(--color-text)">T.O (정원) 관리</h3>
    </div>
  </div>

  <!-- 전체 요약 -->
  <div class="mb-6 p-4 rounded-lg" style:background="var(--color-surface-elevated)">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm" style:color="var(--color-text-secondary)">전체 현황</p>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-3xl font-bold" style:color="var(--color-text)">
            {totalStats.current}
          </span>
          <span class="text-lg" style:color="var(--color-text-secondary)">
            / {totalStats.headcount}명
          </span>
        </div>
      </div>
      <div class="text-right">
        <div class="flex items-center gap-2 justify-end">
          {#if totalStats.difference > 0}
            <TrendingUpIcon class="w-5 h-5 text-red-500" />
            <span class="text-lg font-bold text-red-500">+{totalStats.difference}</span>
          {:else if totalStats.difference < 0}
            <TrendingDownIcon class="w-5 h-5 text-green-500" />
            <span class="text-lg font-bold text-green-500">{totalStats.difference}</span>
          {:else}
            <span class="text-lg font-bold text-green-500">정원</span>
          {/if}
        </div>
        <p class="text-sm mt-1" style:color="var(--color-text-secondary)">
          {totalStats.percentage}%
        </p>
      </div>
    </div>
  </div>

  <!-- 부서별 상세 -->
  <div class="space-y-2">
    {#each headcountData as data (data.department)}
      <div
        class="flex items-center justify-between p-3 rounded-lg border"
        style:border-color="var(--color-border)"
        style:background="var(--color-surface)"
      >
        <div class="flex-1">
          <p class="font-medium" style:color="var(--color-text)">{data.department}</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-sm font-medium" style:color="var(--color-text)">
              {data.current} / {data.headcount}명
            </p>
            <p class="text-xs" style:color="var(--color-text-secondary)">
              {data.percentage}%
            </p>
          </div>
          {#if data.status === 'over'}
            <ThemeBadge variant="error">초과 {data.difference}</ThemeBadge>
          {:else if data.status === 'under'}
            <ThemeBadge variant="success">여유 {Math.abs(data.difference)}</ThemeBadge>
          {:else}
            <ThemeBadge variant="info">정원</ThemeBadge>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if headcountData.length === 0}
    <div class="text-center p-8">
      <p class="text-sm" style:color="var(--color-text-secondary)">
        부서 정보가 없습니다. 먼저 부서를 등록해주세요.
      </p>
    </div>
  {/if}
</ThemeCard>
