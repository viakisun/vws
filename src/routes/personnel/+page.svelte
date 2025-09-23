<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Modal from '$lib/components/ui/Modal.svelte'
  import { formatKRW } from '$lib/utils/format'
  import { personnelStore } from '$lib/stores/personnel'
  import { quarterlyPersonnelBudgets, budgetThresholds } from '$lib/stores/rnd'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import type { Personnel, Participation } from '$lib/types'
  let quarter = $state('2025-Q3')
  let selectedId = $state<string | null>(null)
  let query = $state('')
  let orgFilter = $state('')
  let statusFilter = $state('') as '' | '재직' | '신규' | '퇴사예정'
  let lastQuery = $state('')

  function personQuarterCost(p: Personnel): number {
    // 우선 순위: 참여 항목별 quarterlyBreakdown → 연봉 기반 추정치(분기)
    const breakdownSum = p.participations.reduce<number>(
      (sum: number, pp: Participation) => sum + (pp.quarterlyBreakdown?.[quarter] ?? 0),
      0
    )
    if (breakdownSum > 0) return breakdownSum
    // fallback: 연봉 * 참여율 / 4
    const est =
      ((p.annualSalaryKRW ?? 0) *
        (p.participations.reduce((s, pp) => s + pp.allocationPct, 0) / 100)) /
        4
    return Math.round(est)
  }
  function personQuarterBudget(p: Personnel): number {
    const map = $quarterlyPersonnelBudgets
    return p.participations.reduce<number>(
      (sum: number, pp: Participation) =>
        sum + (map[pp.projectId]?.[quarter] ?? 0) * (pp.allocationPct / 100),
      0
    )
  }

  // available quarters
  const quarters = $derived(
    Array.from(
      new Set(Object.values($quarterlyPersonnelBudgets).flatMap(m => Object.keys(m)))
    ).sort()
  )

  // read initial quarter from URL if present
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const urlQuarter = params.get('q')
    if (urlQuarter) {
      quarter = urlQuarter
    }
    lastQuery = params.toString()
  }

  const projectId = page.url.searchParams.get('projectId')
  const all = $derived($personnelStore)
  const filtered = $derived(
    all.filter(p => {
      const matchQuery = query
        ? p.name.includes(query) || p.id.includes(query) || p.organization.includes(query)
        : true
      const matchProject = projectId
        ? p.participations.some(pp => pp.projectId === projectId)
        : true
      const matchOrg = orgFilter ? p.organization === orgFilter : true
      const matchStatus = statusFilter ? p.status === statusFilter : true
      return matchQuery && matchProject && matchOrg && matchStatus
    })
  )
  const selected = $derived(all.find(p => p.id === selectedId))
  const orgOptions = $derived(Array.from(new Set(all.map(p => p.organization))))
  const totalCount = $derived(all.length)
  const activeCount = $derived(all.filter(p => p.status === '재직').length)

  // KPI summary for selected quarter and current filter
  const kpiTotalCost = $derived(filtered.reduce((s, p) => s + personQuarterCost(p), 0))
  const kpiTotalBudget = $derived(filtered.reduce((s, p) => s + personQuarterBudget(p), 0))
  const kpiUtil = $derived(
    kpiTotalBudget > 0 ? Math.round((kpiTotalCost / kpiTotalBudget) * 100) : 0
  )
  const overCount = $derived(
    filtered.filter(p => {
      const b = personQuarterBudget(p)
      return b > 0 && personQuarterCost(p) / b >= budgetThresholds.critical
    }).length
  )

  // URL sync for quarter only (q)
  $effect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (quarter) params.set('q', quarter)
      else params.delete('q')
      const newQuery = params.toString()
      if (newQuery !== lastQuery) {
        lastQuery = newQuery
        goto(`${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`, {
          replaceState: true,
          keepFocus: true,
          noScroll: true
        })
      }
    }
  })

  // skeleton loading for table
  let loading = $state(true)
  if (typeof window !== 'undefined') {
    setTimeout(() => (loading = false), 300)
  }
</script>

<Card header="인력 비용 관리">
  <div class="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center">
    <input
      class="w-full sm:w-64 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      placeholder="검색 (이름/사번/부서)"
      bind:value={query}
    />
    <select
      class="w-full sm:w-48 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
      bind:value={orgFilter}
    >
      <option value="">전체 부서</option>
      {#each orgOptions as o}
        <option value={o}>{o}</option>
      {/each}
    </select>
    <select
      class="w-full sm:w-48 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
      bind:value={statusFilter}
    >
      <option value="">전체 상태</option>
      <option value="재직">재직</option>
      <option value="신규">신규</option>
      <option value="퇴사예정">퇴사예정</option>
    </select>
    <select
      class="w-full sm:w-40 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
      bind:value={quarter}
    >
      {#each quarters as q}
        <option value={q}>{q}</option>
      {/each}
    </select>
    {#if projectId}
      <Badge color="blue">프로젝트 필터: {projectId}</Badge>
    {/if}
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
    <div class="card">
      <div class="text-caption">분기 인건비 합계</div>
      <div class="text-lg font-semibold">{kpiTotalCost.toLocaleString()}원</div>
    </div>
    <div class="card">
      <div class="text-caption">분기 예산 합계</div>
      <div class="text-lg font-semibold">{kpiTotalBudget.toLocaleString()}원</div>
    </div>
    <div class="card">
      <div class="text-caption">예산 대비 집행률</div>
      <div class="text-lg font-semibold">{kpiUtil}%</div>
    </div>
  </div>
  <div class="text-caption mb-2">
    임계치 {Math.round(budgetThresholds.warning * 100)}%/{Math.round(
      budgetThresholds.critical * 100
    )}% 기준, 위험 인원 {overCount}명
  </div>
  {#if loading}
    <div class="space-y-2">
      {#each Array(8) as _}
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
            <th class="px-3 py-2">부서</th>
            <th class="px-3 py-2">직급</th>
            <th class="px-3 py-2">연봉</th>
            <th class="px-3 py-2">프로젝트</th>
            <th class="px-3 py-2">{quarter} 인건비</th>
            <th class="px-3 py-2">예산대비</th>
            <th class="px-3 py-2">상태</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          {#each filtered as p}
            <tr
              class="hover:bg-gray-50 cursor-pointer"
              onclick={() => (selectedId = p.id)}>
              <td class="px-3 py-2">{p.id}</td>
              <td class="px-3 py-2">{p.name}</td>
              <td class="px-3 py-2">{p.organization}</td>
              <td class="px-3 py-2">{p.role}</td>
              <td class="px-3 py-2">{p.annualSalaryKRW ? formatKRW(p.annualSalaryKRW) : '-'}</td>
              <td class="px-3 py-2">{p.participations.length}건</td>
              <td class="px-3 py-2">{formatKRW(personQuarterCost(p))}</td>
              <td class="px-3 py-2">
                {#if personQuarterBudget(p) > 0}
                  {@const util = personQuarterCost(p) / personQuarterBudget(p)}
                  <Badge
                    color={util >= budgetThresholds.over
                      ? 'red'
                      : util >= budgetThresholds.critical
                      ? 'yellow'
                      : util >= budgetThresholds.warning
                      ? 'yellow'
                      : 'green'}>{Math.round(util * 100)}%</Badge
                  >
                {:else}
                  -
                {/if}
              </td>
              <td class="px-3 py-2"
              ><Badge color={p.status === '퇴사예정' ? 'yellow' : 'green'}>{p.status}</Badge></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>

<Modal
  open={!!selected}
  title={selected?.name ?? ''}
  onClose={() => (selectedId = null)}>
  {#if selected}
    <div class="space-y-3 text-sm">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="text-caption">사번</div>
          <div class="font-semibold">{selected.id}</div>
        </div>
        <div>
          <div class="text-caption">부서/직급</div>
          <div class="font-semibold">{selected.organization} · {selected.role}</div>
        </div>
        <div>
          <div class="text-caption">연봉</div>
          <div class="font-semibold">
            {selected.annualSalaryKRW ? formatKRW(selected.annualSalaryKRW) : '-'}
          </div>
        </div>
      </div>
      <div>
        <div class="text-caption mb-1">프로젝트 참여</div>
        <ul class="list-disc pl-5 space-y-1">
          {#each selected.participations as pp}
            <li>
              {pp.projectId} · {pp.allocationPct}% · {pp.startDate}{pp.endDate
                ? ` ~ ${pp.endDate}`
                : ''}
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
</Modal>
