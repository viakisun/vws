<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Progress from '$lib/components/ui/Progress.svelte'
  import { page } from '$app/state'
  import { projectsStore, quarterlyPersonnelBudgets } from '$lib/stores/rnd'
  import { personnelStore } from '$lib/stores/personnel'
  import { formatKRW } from '$lib/utils/format'
  import type { Personnel } from '$lib/types'

  const projectId = page.params.projectId as string
  const project = $derived($projectsStore.find((p) => p.id === projectId))
  const people = $derived(
    $personnelStore.filter((p) => p.participations.some((pp) => pp.projectId === projectId)),
  )

  function currentQuarterLabel(): string {
    const d = new Date()
    const y = d.getFullYear()
    const qn = Math.floor(d.getMonth() / 3) + 1
    return `${y}-Q${qn}`
  }
  const quarter = $state(currentQuarterLabel())
  const budgetMap = $derived(
    ($quarterlyPersonnelBudgets[projectId as string] ?? {}) as Record<string, number>,
  )

  function allocOf(person: Personnel): number {
    const pp = person.participations.find((x) => x.projectId === projectId)
    return pp ? pp.allocationPct : 0
  }
  function quarterCost(person: Personnel): number {
    const breakdown =
      person.participations.find((x) => x.projectId === projectId)?.quarterlyBreakdown?.[quarter] ??
      0
    if (breakdown > 0) return breakdown
    const alloc = allocOf(person)
    const est = ((person.annualSalaryKRW ?? 0) * (alloc / 100)) / 4
    return Math.round(est)
  }
  function quarterBudget(person: Personnel): number {
    const alloc = allocOf(person)
    const base = budgetMap?.[quarter] ?? 0
    return Math.round(base * (alloc / 100))
  }

  const totalBudget = $derived(
    Object.entries(budgetMap).reduce((s, [k, v]) => (k === quarter ? s + v : s), 0),
  )
  const totalCost = $derived(people.reduce((s, p) => s + quarterCost(p), 0))
  const util = $derived(totalBudget > 0 ? Math.round((totalCost / totalBudget) * 100) : 0)

  let loading = $state(true)
  if (typeof window !== 'undefined') {
    setTimeout(() => (loading = false), 300)
  }
</script>

<h3 class="text-lg font-semibold mb-3">Project Personnel · {projectId}</h3>

{#if !project}
  <div class="text-sm text-red-700">프로젝트를 찾을 수 없습니다.</div>
{:else}
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <Card>
      <div class="kpi">
        <div>
          <div class="text-caption">분기 예산</div>
          <div class="text-2xl font-bold">
            {formatKRW(budgetMap?.[quarter] ?? 0)}
          </div>
        </div>
      </div>
    </Card>
    <Card>
      <div class="kpi">
        <div>
          <div class="text-caption">분기 추정 인건비</div>
          <div class="text-2xl font-bold">{formatKRW(totalCost)}</div>
        </div>
      </div>
    </Card>
    <Card>
      <div class="kpi">
        <div>
          <div class="text-caption">예산 대비</div>
          <div class="text-2xl font-bold">{util}%</div>
          <div class="mt-3"><Progress value={util} /></div>
        </div>
      </div>
    </Card>
  </div>

  <Card header="참여 인력">
    {#if loading}
      <div class="space-y-2">
        {#each Array(8) as _, idx (idx)}
          <!-- TODO: replace index key with a stable id when model provides one -->
          <div class="h-8 bg-gray-100 animate-pulse rounded"></div>
        {/each}
      </div>
    {:else}
      <div class="overflow-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 text-left text-gray-600">
            <tr>
              <th class="px-3 py-2">사번</th>
              <th class="px-3 py-2">이름</th>
              <th class="px-3 py-2">참여율</th>
              <th class="px-3 py-2">{quarter} 인건비</th>
              <th class="px-3 py-2">예산대비</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            {#each people as p, i (i)}
              {@const alloc = allocOf(p)}
              {@const qc = quarterCost(p)}
              {@const qb = quarterBudget(p)}
              {@const ratio = qb > 0 ? Math.round((qc / qb) * 100) : 0}
              <tr>
                <td class="px-3 py-2">{p.id}</td>
                <td class="px-3 py-2">{p.name}</td>
                <td class="px-3 py-2 tabular-nums">{alloc}%</td>
                <td class="px-3 py-2">{formatKRW(qc)}</td>
                <td class="px-3 py-2">
                  {#if qb > 0}
                    <Badge
                      color={ratio >= 100
                        ? 'red'
                        : ratio >= 95
                          ? 'yellow'
                          : ratio >= 80
                            ? 'yellow'
                            : 'green'}>{ratio}%</Badge
                    >
                  {:else}
                    -
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </Card>
{/if}
