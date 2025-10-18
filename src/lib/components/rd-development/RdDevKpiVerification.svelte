<script lang="ts">
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import {
    AlertCircleIcon,
    AlertTriangleIcon,
    CheckCircle2Icon,
    ChevronDownIcon,
    ChevronUpIcon,
    TargetIcon,
  } from 'lucide-svelte'

  interface Props {
    kpis: any[]
    kpiStats: any
    scenarios: any[]
    testLocations: any[]
    class?: string
  }

  let { kpis, kpiStats, scenarios, testLocations, class: className = '' }: Props = $props()

  const achievementRate = $derived.by(() => {
    if (!kpiStats || kpiStats.total === 0) return 0
    return Math.round((kpiStats.achieved / kpiStats.total) * 100)
  })

  const groupedKpis = $derived.by(() => {
    const groups: Record<string, any[]> = {}
    kpis.forEach((kpi: any) => {
      const category = kpi.kpi_category || '기타'
      if (!groups[category]) groups[category] = []
      groups[category].push(kpi)
    })
    return groups
  })

  let expandedCategories = $state<Set<string>>(new Set())

  function toggleCategory(category: string) {
    if (expandedCategories.has(category)) {
      expandedCategories.delete(category)
    } else {
      expandedCategories.add(category)
    }
    expandedCategories = new Set(expandedCategories)
  }

  function getKpiStatusColor(status: string): string {
    switch (status) {
      case '목표달성':
      case '달성':
        return 'green'
      case '진행중':
      case '미측정':
        return 'blue'
      case '지연':
        return 'red'
      default:
        return 'gray'
    }
  }

  function getScenarioStatusColor(status: string): string {
    switch (status) {
      case '완료':
        return 'green'
      case '진행중':
        return 'blue'
      case '준비중':
      case '계획':
        return 'gray'
      case '실패':
        return 'red'
      default:
        return 'gray'
    }
  }

  function getTestLocationName(locationId: string | null): string {
    if (!locationId) return '미정'
    const location = testLocations.find((l: any) => l.id === locationId)
    return location?.location_name || '미정'
  }

  const delayedKpis = $derived(kpis.filter((k: any) => k.status === '지연'))
  const failedScenarios = $derived(scenarios.filter((s: any) => s.status === '실패'))
  const hasRisks = $derived(delayedKpis.length > 0 || failedScenarios.length > 0)
</script>

<div
  class="p-6 rounded-lg border {className}"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <SectionHeader title="KPI & 검증 현황" count={kpis.length} />

  <!-- KPI Dashboard -->
  <div class="grid grid-cols-4 gap-4 mb-6">
    <div class="p-4 rounded-lg text-center" style:background="var(--color-primary-light)">
      <div class="text-3xl font-bold mb-1" style:color="var(--color-primary)">
        {achievementRate}%
      </div>
      <div class="text-xs font-semibold" style:color="var(--color-text-tertiary)">달성률</div>
    </div>
    <div class="p-4 rounded-lg text-center" style:background="var(--color-green-light)">
      <div class="text-3xl font-bold mb-1" style:color="var(--color-green)">
        {kpiStats?.achieved || 0}
      </div>
      <div class="text-xs font-semibold" style:color="var(--color-text-tertiary)">목표 달성</div>
    </div>
    <div class="p-4 rounded-lg text-center" style:background="var(--color-blue-light)">
      <div class="text-3xl font-bold mb-1" style:color="var(--color-blue)">
        {kpiStats?.in_progress || 0}
      </div>
      <div class="text-xs font-semibold" style:color="var(--color-text-tertiary)">진행중</div>
    </div>
    <div class="p-4 rounded-lg text-center" style:background="var(--color-red-light)">
      <div class="text-3xl font-bold mb-1" style:color="var(--color-red)">
        {kpiStats?.delayed || 0}
      </div>
      <div class="text-xs font-semibold" style:color="var(--color-text-tertiary)">지연</div>
    </div>
  </div>

  <!-- Progress Bar -->
  <div class="mb-6">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-semibold" style:color="var(--color-text-primary)">전체 진행률</span>
      <span class="text-sm" style:color="var(--color-text-secondary)">
        {kpiStats?.achieved || 0} / {kpiStats?.total || 0} 달성
      </span>
    </div>
    <div class="h-3 rounded-full overflow-hidden" style="background: var(--color-background)">
      <div
        class="h-full transition-all duration-500"
        style="width: {achievementRate}%; background: {achievementRate >= 80
          ? 'var(--color-green)'
          : achievementRate >= 50
            ? 'var(--color-blue)'
            : 'var(--color-red)'}"
      ></div>
    </div>
  </div>

  <!-- KPI Categories -->
  {#if Object.keys(groupedKpis).length > 0}
    <div class="mb-6">
      <h3 class="text-base font-medium mb-3" style:color="var(--color-text-primary)">
        카테고리별 KPI
      </h3>

      <div class="space-y-2">
        {#each Object.entries(groupedKpis) as [category, categoryKpis]}
          <div
            class="rounded-lg border overflow-hidden"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
          >
            <button
              type="button"
              class="w-full flex items-center justify-between p-4 transition hover:opacity-80"
              style:background="var(--color-background)"
              onclick={() => toggleCategory(category)}
            >
              <div class="flex items-center gap-3">
                <TargetIcon size={18} />
                <span class="font-medium" style:color="var(--color-text-primary)">{category}</span>
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded"
                  style:background="var(--color-blue-light)"
                  style:color="var(--color-blue)"
                >
                  {categoryKpis.length}
                </span>
              </div>
              {#if expandedCategories.has(category)}
                <ChevronUpIcon size={18} />
              {:else}
                <ChevronDownIcon size={18} />
              {/if}
            </button>

            {#if expandedCategories.has(category)}
              <div class="p-4 space-y-3">
                {#each categoryKpis as kpi}
                  {@const statusColor = getKpiStatusColor(kpi.status)}
                  <div
                    class="p-4 rounded-lg border"
                    style:background="var(--color-surface)"
                    style:border-color="var(--color-border)"
                  >
                    <div class="flex items-start justify-between gap-3 mb-2">
                      <div
                        class="text-sm font-medium flex-1"
                        style:color="var(--color-text-primary)"
                      >
                        {kpi.kpi_name}
                      </div>
                      <span
                        class="px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap"
                        style:background="var(--color-{statusColor}-light)"
                        style:color="var(--color-{statusColor})"
                      >
                        {kpi.status || '미측정'}
                      </span>
                    </div>
                    {#if kpi.kpi_description}
                      <p class="text-xs mb-3" style:color="var(--color-text-secondary)">
                        {kpi.kpi_description}
                      </p>
                    {/if}
                    <div class="grid grid-cols-2 gap-3">
                      <div class="p-3 rounded" style:background="var(--color-background)">
                        <div
                          class="text-xs font-semibold mb-1"
                          style:color="var(--color-text-tertiary)"
                        >
                          목표
                        </div>
                        <div class="text-base font-bold" style:color="var(--color-primary)">
                          {kpi.target_value || '-'}
                          {#if kpi.unit}<span class="text-xs font-normal ml-1">{kpi.unit}</span
                            >{/if}
                        </div>
                      </div>
                      <div class="p-3 rounded" style:background="var(--color-background)">
                        <div
                          class="text-xs font-semibold mb-1"
                          style:color="var(--color-text-tertiary)"
                        >
                          현재
                        </div>
                        <div class="text-base font-bold" style:color="var(--color-text-primary)">
                          {kpi.current_value || '미측정'}
                          {#if kpi.current_value && kpi.unit}<span class="text-xs font-normal ml-1"
                              >{kpi.unit}</span
                            >{/if}
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Verification Scenarios -->
  {#if scenarios.length > 0}
    <div class="mb-6">
      <h3 class="text-base font-medium mb-3" style:color="var(--color-text-primary)">
        검증 시나리오 ({scenarios.length})
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each scenarios as scenario}
          {@const statusColor = getScenarioStatusColor(scenario.status)}
          <div
            class="p-4 rounded-lg border transition hover:border-blue-300 hover:shadow-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="text-sm font-medium flex-1" style:color="var(--color-text-primary)">
                {scenario.scenario_name}
              </div>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap"
                style:background="var(--color-{statusColor}-light)"
                style:color="var(--color-{statusColor})"
              >
                {scenario.status || '계획'}
              </span>
            </div>
            {#if scenario.scenario_description}
              <p class="text-xs mb-3" style:color="var(--color-text-secondary)">
                {scenario.scenario_description}
              </p>
            {/if}
            <div class="flex items-center gap-3 text-xs" style:color="var(--color-text-tertiary)">
              {#if scenario.test_date}
                <span>
                  {new Date(scenario.test_date).toLocaleDateString('ko-KR')}
                </span>
              {/if}
              <span>
                {getTestLocationName(scenario.test_location_id)}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Risk Indicators -->
  {#if hasRisks}
    <div
      class="p-4 rounded-lg border"
      style:background="var(--color-red-light)"
      style:border-color="var(--color-red)"
    >
      <div class="flex items-center gap-2 mb-3">
        <AlertTriangleIcon size={20} />
        <h3 class="text-base font-semibold" style:color="var(--color-red)">위험 지표</h3>
      </div>

      <div class="space-y-2">
        {#if delayedKpis.length > 0}
          <div>
            <div class="text-sm font-medium mb-2" style:color="var(--color-text-primary)">
              지연된 KPI: {delayedKpis.length}개
            </div>
            <div class="space-y-1">
              {#each delayedKpis as kpi}
                <div
                  class="flex items-center gap-2 text-xs"
                  style:color="var(--color-text-secondary)"
                >
                  <AlertCircleIcon size={14} />
                  <span>{kpi.kpi_name}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if failedScenarios.length > 0}
          <div>
            <div class="text-sm font-medium mb-2" style:color="var(--color-text-primary)">
              실패한 검증: {failedScenarios.length}개
            </div>
            <div class="space-y-1">
              {#each failedScenarios as scenario}
                <div
                  class="flex items-center gap-2 text-xs"
                  style:color="var(--color-text-secondary)"
                >
                  <AlertCircleIcon size={14} />
                  <span>{scenario.scenario_name}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div
      class="text-center py-8 rounded-lg"
      style:background="var(--color-green-light)"
      style:border="1px solid var(--color-green)"
    >
      <CheckCircle2Icon size={48} class="mx-auto mb-2" />
      <div class="text-base font-semibold mb-1" style:color="var(--color-green)">
        현재 위험 요소 없음
      </div>
      <div class="text-sm" style:color="var(--color-text-secondary)">
        모든 KPI와 검증이 계획대로 진행 중입니다
      </div>
    </div>
  {/if}
</div>
