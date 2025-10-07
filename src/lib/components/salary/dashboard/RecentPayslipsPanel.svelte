<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { formatCurrency } from '$lib/utils/format'
  import type { Payslip } from '$lib/types/salary'

  interface Props {
    payslips: Payslip[]
  }

  let { payslips = [] }: Props = $props()

  // 최근 3개월 급여명세서 (기간별로 그룹화)
  const recentPeriods = $derived.by(() => {
    const periodMap = new Map<string, { payslips: Payslip[]; total: number; count: number }>()

    payslips.forEach((p) => {
      const existing = periodMap.get(p.period)
      if (existing) {
        existing.payslips.push(p)
        existing.total += p.totalPayments || 0
        existing.count++
      } else {
        periodMap.set(p.period, {
          payslips: [p],
          total: p.totalPayments || 0,
          count: 1,
        })
      }
    })

    return Array.from(periodMap.entries())
      .map(([period, data]) => ({
        period,
        count: data.count,
        total: data.total,
        status: data.payslips.every((p) => p.status === 'paid') ? '지급완료' : '계산완료',
      }))
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, 3)
  })
</script>

<ThemeCard class="p-6">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-lg font-semibold" style:color="var(--color-text)">최근 급여명세서</h3>
      <p class="text-sm mt-1" style:color="var(--color-text-secondary)">최근 3개월 급여 현황</p>
    </div>
  </div>

  <div class="space-y-3">
    {#each recentPeriods as { period, count, total, status } (period)}
      <div
        class="p-3 rounded-lg border"
        style:border-color="var(--color-border)"
        style:background-color="var(--color-surface)"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium" style:color="var(--color-text)">{period}</p>
            <p class="text-sm" style:color="var(--color-text-secondary)">
              {count}명 · {formatCurrency(total)}
            </p>
          </div>
          <span
            class="px-3 py-1 rounded-full text-sm font-medium {status === '지급완료'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'}"
          >
            {status}
          </span>
        </div>
      </div>
    {:else}
      <div class="text-center py-8" style:color="var(--color-text-secondary)">
        <p class="text-sm">급여명세서가 없습니다.</p>
      </div>
    {/each}
  </div>
</ThemeCard>
