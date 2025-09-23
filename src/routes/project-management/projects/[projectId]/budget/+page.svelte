<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import Progress from '$lib/components/ui/Progress.svelte'
  import { projectsStore, expenseDocsStore } from '$lib/stores/rnd'
  import { page } from '$app/state'
  import { formatKRW } from '$lib/utils/format'

  const projectId = page.params.projectId
  const project = $derived($projectsStore.find(p => p.id === projectId))
  const docs = $derived($expenseDocsStore.filter(d => d.projectId === projectId))
  const utilization = $derived(
    project ? Math.round((project.spentKRW / project.budgetKRW) * 100) : 0
  )
  const categoryHints = $derived(
    (function () {
      const m: Record<string, number> = {}
      for (const d of docs) m[d.category] = (m[d.category] ?? 0) + (d.amountKRW ?? 0)
      return m
    })()
  )

  let loading = $state(true)
  if (typeof window !== 'undefined') {
    setTimeout(() => (loading = false), 300)
  }
</script>

<h3 class="text-lg font-semibold mb-3">Budget Management · {projectId}</h3>

{#if !project}
  <div class="text-sm text-red-700">프로젝트를 찾을 수 없습니다.</div>
{:else}
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <Card>
      <div class="kpi">
        <div>
          <div class="text-caption">총 예산</div>
          <div class="text-2xl font-bold">{formatKRW(project.budgetKRW)}</div>
        </div>
      </div>
    </Card>
    <Card>
      <div class="kpi">
        <div>
          <div class="text-caption">집행</div>
          <div class="text-2xl font-bold">{formatKRW(project.spentKRW)}</div>
        </div>
      </div>
    </Card>
    <Card>
      <div class="kpi">
        <div>
          <div class="text-caption">집행률</div>
          <div class="text-2xl font-bold">{utilization}%</div>
          <div class="mt-3"><Progress value={utilization} /></div>
        </div>
      </div>
    </Card>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
    <Card header="카테고리 힌트(문서 기준)">
      {#if loading}
        <div class="space-y-2">
          {#each Array(4) as _}
            <div class="h-8 bg-gray-100 animate-pulse rounded"></div>
          {/each}
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-2 text-sm">
          {#each Object.entries(categoryHints) as [k, v]}
            <div class="flex items-center justify-between">
              <span>{k}</span><span class="tabular-nums">{formatKRW(v)}</span>
            </div>
          {/each}
          {#if Object.keys(categoryHints).length === 0}
            <div class="text-gray-500">문서가 없습니다</div>
          {/if}
        </div>
      {/if}
    </Card>

    <Card header="문서 내역">
      {#if loading}
        <div class="space-y-2">
          {#each Array(6) as _}
            <div class="h-8 bg-gray-100 animate-pulse rounded"></div>
          {/each}
        </div>
      {:else}
        <div class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-left text-gray-600">
              <tr>
                <th class="px-3 py-2">문서</th>
                <th class="px-3 py-2">분류</th>
                <th class="px-3 py-2">분기</th>
                <th class="px-3 py-2">금액</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              {#each docs as d}
                <tr>
                  <td class="px-3 py-2">{d.id} · {d.title}</td>
                  <td class="px-3 py-2">{d.category}</td>
                  <td class="px-3 py-2">{d.quarter}Q</td>
                  <td class="px-3 py-2">{d.amountKRW ? formatKRW(d.amountKRW) : '-'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </Card>
  </div>
{/if}
