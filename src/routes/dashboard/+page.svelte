<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Progress from '$lib/components/ui/Progress.svelte'
  import Modal from '$lib/components/ui/Modal.svelte'
  import { TrendingUpIcon, BriefcaseIcon, CoinsIcon, AlertTriangleIcon } from '@lucide/svelte'
  import { projectsStore, budgetAlerts, overallBudget } from '$lib/stores/rnd'
  import { personnelStore, estimateMonthlyCostKRW } from '$lib/stores/personnel'
  import { formatKRW } from '$lib/utils/format'

  type Kpi = { label: string; value: number | string; icon: any; numeric?: number }

  let statusFilter = $state('') as '' | '정상' | '진행중' | '지연' | '위험' | '완료'
  let query = $state('')
  let selectedId = $state<string | null>(null)

  const ob = $derived($overallBudget)
  const kpis = $derived([
    { label: '총 프로젝트', value: $projectsStore.length, icon: BriefcaseIcon },
    {
      label: '예산 집행률',
      value: `${(ob.utilization * 100).toFixed(1)}%`,
      numeric: ob.utilization * 100,
      icon: CoinsIcon
    },
    {
      label: '평균 진행률',
      value: `${Math.round($projectsStore.reduce((s, p) => s + p.progressPct, 0) / Math.max($projectsStore.length, 1))}%`,
      numeric:
        $projectsStore.reduce((s, p) => s + p.progressPct, 0) / Math.max($projectsStore.length, 1),
      icon: TrendingUpIcon
    },
    {
      label: '리스크 경고',
      value: $projectsStore.filter(p => p.status === '위험' || p.status === '지연').length,
      icon: AlertTriangleIcon
    }
  ] as Kpi[])

  const allProjects = $derived($projectsStore)
  const filtered = $derived(
    allProjects.filter(
      p =>
        (statusFilter ? p.status === statusFilter : true) &&
          (query ? p.name.toLowerCase().includes(query.toLowerCase()) : true)
    )
  )
  const selected = $derived(allProjects.find(p => p.id === selectedId))
  const selectedMembers = $derived(
    selected
      ? $personnelStore.filter(pr => pr.participations.some(pp => pp.projectId === selected.id))
      : []
  )
  const selectedCostMonthly = $derived(
    selectedMembers.reduce((sum, pr) => {
      const part = pr.participations.find(pp => pp.projectId === selected?.id)
      return (
        sum +
        (pr.annualSalaryKRW && part
          ? estimateMonthlyCostKRW(pr.annualSalaryKRW, part.allocationPct)
          : 0)
      )
    }, 0)
  )
  function openDetail(id: string) {
    selectedId = id
  }
  function closeDetail() {
    selectedId = null
  }
</script>

<div class="space-y-6">
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {#each kpis as k, i (i)}
      <Card>
        <div class="kpi">
          <div>
            <p class="text-caption">{k.label}</p>
            <div class="text-2xl font-bold">{k.value}</div>
          </div>
          {#if k.icon}
            {@const IconComponent = k.icon}
            <IconComponent class="text-primary" />
          {/if}
        </div>
        {#if k.numeric}
          <div class="mt-3">
            <Progress value={k.numeric} />
          </div>
        {/if}
      </Card>
    {/each}
  </div>

  <Card header="프로젝트 현황">
    <div class="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center">
      <input
        class="w-full sm:w-64 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        placeholder="프로젝트 검색"
        bind:value={query}
      />
      <select
        class="w-full sm:w-48 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
        bind:value={statusFilter}
      >
        <option value="">상태: 전체</option>
        <option value="정상">정상</option>
        <option value="진행중">진행중</option>
        <option value="지연">지연</option>
        <option value="위험">위험</option>
        <option value="완료">완료</option>
      </select>
    </div>
    <div class="divide-y">
      {#each filtered as p, i (i)}
        <button
          type="button"
          class="w-full text-left flex items-center justify-between gap-4 py-3 hover:bg-gray-50 rounded-md px-2"
          onclick={() => openDetail(p.id)}
        >
          <div>
            <div class="text-sm font-semibold">{p.name}</div>
            <div class="text-caption">{p.id}</div>
          </div>
          <div class="w-48">
            <Progress value={p.progressPct} />
          </div>
          <div class="hidden sm:block text-sm text-right">
            <div>예산 {formatKRW(p.budgetKRW)}</div>
            <div class="text-caption">집행 {formatKRW(p.spentKRW)}</div>
          </div>
          <Badge
            color={p.status === '지연'
              ? 'yellow'
              : p.status === '진행중'
              ? 'blue'
              : p.status === '위험'
              ? 'red'
              : 'green'}>{p.status}</Badge
          >
        </button>
      {/each}
    </div>
  </Card>

  {#if $budgetAlerts.length}
    <Card header="예산 경보">
      <ul class="space-y-2 text-sm">
        {#each $budgetAlerts as a, i (i)}
          <li class="flex items-center justify-between">
            <span>{a.name}</span>
            <Badge color={a.level === 'over' ? 'red' : a.level === 'critical' ? 'yellow' : 'yellow'}
            >
              {(a.utilization * 100).toFixed(1)}%
            </Badge>
          </li>
        {/each}
      </ul>
    </Card>
  {/if}

  <Modal
    open={!!selected}
    title={selected?.name ?? ''}
    maxWidth="max-w-2xl"
    onClose={closeDetail}>
    {#if selected}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <Badge
            color={selected.status === '지연'
              ? 'yellow'
              : selected.status === '진행중'
              ? 'blue'
              : selected.status === '위험'
              ? 'red'
              : 'green'}>{selected.status}</Badge
          >
          <div class="w-52"><Progress value={selected.progressPct} /></div>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-caption">예산</div>
            <div class="font-semibold">{formatKRW(selected.budgetKRW)}</div>
          </div>
          <div>
            <div class="text-caption">집행</div>
            <div class="font-semibold">{formatKRW(selected.spentKRW)}</div>
          </div>
          <div>
            <div class="text-caption">기간</div>
            <div class="font-semibold">{selected.startDate} ~ {selected.dueDate}</div>
          </div>
          <div>
            <div class="text-caption">부서</div>
            <div class="font-semibold">{selected.organization}</div>
          </div>
        </div>
        <div>
          <div class="text-caption mb-1">리스크</div>
          {#if selected.risks.length === 0}
            <div class="text-sm text-gray-500">등록된 리스크 없음</div>
          {:else}
            <ul class="list-disc pl-5 text-sm space-y-1">
              {#each selected.risks as r, i (i)}
                <li>
                  <span class="font-medium">[{r.severity}]</span>
                  {r.description} <span class="text-caption">({r.impact}/{r.status})</span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <div>
          <div class="text-caption mb-1">인건비 요약</div>
          <div class="text-sm">
            참여 인원 {selectedMembers.length}명 · 월 추정 {formatKRW(selectedCostMonthly)}
          </div>
          <div class="mt-2">
            <a
              class="text-primary hover:underline"
              href={`/personnel?projectId=${selected.id}`}
            >상세 보기 (인건비 관리로 이동)</a
            >
          </div>
        </div>
      </div>
    {/if}
  </Modal>
</div>
