<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import Progress from '$lib/components/ui/Progress.svelte'
  import { overallBudget, quarterlyPersonnelBudgets } from '$lib/stores/rnd'
  import { get } from 'svelte/store'
  const qb = get(quarterlyPersonnelBudgets)
  const quarterSet = new Set<string>()
  Object.values(qb).forEach(m => Object.keys(m).forEach(q => quarterSet.add(q)))
  const quarters = Array.from(quarterSet).sort()
  const ob = $derived($overallBudget)
  function sumQuarter(q: string): number {
    return Object.values(qb).reduce((s, m) => s + (m[q] ?? 0), 0)
  }
</script>

<h2 class="text-lg font-semibold mb-4">Consolidated Budget Overview</h2>

<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
  <Card>
    <div class="kpi">
      <div>
        <p class="text-caption">총 예산</p>
        <div class="text-2xl font-bold">{ob.totalBudgetKRW.toLocaleString()}원</div>
      </div>
    </div>
  </Card>
  <Card>
    <div class="kpi">
      <div>
        <p class="text-caption">총 집행</p>
        <div class="text-2xl font-bold">{ob.totalSpentKRW.toLocaleString()}원</div>
      </div>
    </div>
  </Card>
  <Card>
    <div class="kpi">
      <div>
        <p class="text-caption">집행률</p>
        <div class="text-2xl font-bold">{(ob.utilization * 100).toFixed(1)}%</div>
        <div class="mt-3"><Progress value={ob.utilization * 100} /></div>
      </div>
    </div>
  </Card>
</div>

<Card header="분기별 인건비 예산 합계">
  <div class="overflow-auto">
    <table class="min-w-full text-sm">
      <thead class="bg-gray-50 text-left text-gray-600">
        <tr>
          <th class="px-3 py-2">분기</th>
          <th class="px-3 py-2">예산 합계</th>
        </tr>
      </thead>
      <tbody class="divide-y">
        {#each quarters as q, i (i)}
          <tr>
            <td class="px-3 py-2">{q}</td>
            <td class="px-3 py-2 tabular-nums">{sumQuarter(q).toLocaleString()}원</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="text-caption mt-2">예산 데이터는 스토어 기준 합산입니다.</div>
</Card>
