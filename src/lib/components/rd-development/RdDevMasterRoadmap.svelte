<!--
  R&D Development Master Roadmap
  전체 프로젝트 로드맵 (2025.04 ~ 2027.12)
-->

<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { CheckCircle2Icon, CircleIcon, ClockIcon } from 'lucide-svelte'

  interface Props {
    project: any
    phases: any[]
    deliverables: any[]
    kpis: any[]
    scenarios: any[]
    upcomingEvents: any[]
    class?: string
  }

  let {
    project,
    phases,
    deliverables,
    kpis,
    scenarios,
    upcomingEvents,
    class: className = '',
  }: Props = $props()

  // 프로젝트 시작/종료일 (phases에서 계산)
  const projectStart = $derived.by(() => {
    if (phases.length === 0) return new Date('2025-04-01')
    const dates = phases.map((p: any) => new Date(p.start_date))
    return new Date(Math.min(...dates.map((d) => d.getTime())))
  })

  const projectEnd = $derived.by(() => {
    if (phases.length === 0) return new Date('2027-12-31')
    const dates = phases.map((p: any) => new Date(p.end_date))
    return new Date(Math.max(...dates.map((d) => d.getTime())))
  })

  // 전체 연도 및 분기 생성
  const timeline = $derived.by(() => {
    const years: { year: number; quarters: { quarter: string; label: string }[] }[] = []

    for (let year = projectStart.getFullYear(); year <= projectEnd.getFullYear(); year++) {
      const quarters = [
        { quarter: 'Q1', label: '1-3월' },
        { quarter: 'Q2', label: '4-6월' },
        { quarter: 'Q3', label: '7-9월' },
        { quarter: 'Q4', label: '10-12월' },
      ]
      years.push({ year, quarters })
    }

    return years
  })

  // 현재 분기 계산
  const currentQuarter = $derived.by(() => {
    const now = new Date()
    const month = now.getMonth() + 1
    const quarter = Math.ceil(month / 3)
    return { year: now.getFullYear(), quarter: `Q${quarter}` }
  })

  // 분기가 현재인지 확인
  function isCurrentQuarter(year: number, quarter: string): boolean {
    return year === currentQuarter.year && quarter === currentQuarter.quarter
  }

  // 분기가 과거인지 확인
  function isPastQuarter(year: number, quarter: string): boolean {
    const quarterNum = parseInt(quarter.substring(1))
    const currentQuarterNum = parseInt(currentQuarter.quarter.substring(1))

    if (year < currentQuarter.year) return true
    if (year === currentQuarter.year && quarterNum < currentQuarterNum) return true
    return false
  }

  // 단계별 색상
  function getPhaseColor(phaseNumber: number): string {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
    return colors[(phaseNumber - 1) % colors.length]
  }

  // 분기별 활동 매핑
  const quarterlyActivities = $derived.by(() => {
    const activities: Record<string, any[]> = {}

    // 단계별로 매핑
    phases.forEach((phase: any) => {
      const startDate = new Date(phase.start_date)
      const endDate = new Date(phase.end_date)

      for (let year = projectStart.getFullYear(); year <= projectEnd.getFullYear(); year++) {
        for (let q = 1; q <= 4; q++) {
          const quarterStart = new Date(year, (q - 1) * 3, 1)
          const quarterEnd = new Date(year, q * 3, 0)

          if (startDate <= quarterEnd && endDate >= quarterStart) {
            const key = `${year}-Q${q}`
            if (!activities[key]) activities[key] = []
            activities[key].push({
              type: 'phase',
              data: phase,
              isStart: startDate >= quarterStart && startDate <= quarterEnd,
              isEnd: endDate >= quarterStart && endDate <= quarterEnd,
            })
          }
        }
      }
    })

    // 산출물 추가
    deliverables
      .filter((d: any) => d.target_date)
      .forEach((deliverable: any) => {
        const targetDate = new Date(deliverable.target_date)
        const year = targetDate.getFullYear()
        const quarter = Math.ceil((targetDate.getMonth() + 1) / 3)
        const key = `${year}-Q${quarter}`

        if (!activities[key]) activities[key] = []
        activities[key].push({
          type: 'deliverable',
          data: deliverable,
        })
      })

    // KPI 측정일 추가
    kpis
      .filter((k: any) => k.measurement_date)
      .forEach((kpi: any) => {
        const measureDate = new Date(kpi.measurement_date)
        const year = measureDate.getFullYear()
        const quarter = Math.ceil((measureDate.getMonth() + 1) / 3)
        const key = `${year}-Q${quarter}`

        if (!activities[key]) activities[key] = []
        activities[key].push({
          type: 'kpi',
          data: kpi,
        })
      })

    // 시나리오 테스트일 추가
    scenarios
      .filter((s: any) => s.test_date)
      .forEach((scenario: any) => {
        const testDate = new Date(scenario.test_date)
        const year = testDate.getFullYear()
        const quarter = Math.ceil((testDate.getMonth() + 1) / 3)
        const key = `${year}-Q${quarter}`

        if (!activities[key]) activities[key] = []
        activities[key].push({
          type: 'scenario',
          data: scenario,
        })
      })

    return activities
  })

  // 분기별 활동 개수
  function getActivityCount(year: number, quarter: string): number {
    const key = `${year}-${quarter}`
    return quarterlyActivities[key]?.length || 0
  }

  // 분기에 단계가 있는지 확인
  function hasPhase(year: number, quarter: string): any[] {
    const key = `${year}-${quarter}`
    return quarterlyActivities[key]?.filter((a: any) => a.type === 'phase') || []
  }
</script>

<div class="rd-dev-master-roadmap {className}">
  <ThemeCard class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2">마스터 로드맵</h2>
      <p class="text-muted-foreground">
        {projectStart.getFullYear()}.{String(projectStart.getMonth() + 1).padStart(2, '0')} ~
        {projectEnd.getFullYear()}.{String(projectEnd.getMonth() + 1).padStart(2, '0')}
        전체 일정
      </p>
    </div>

    <!-- 범례 -->
    <div class="flex flex-wrap gap-4 mb-6 p-4 bg-muted rounded-lg">
      {#each phases as phase}
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded {getPhaseColor(phase.phase_number)}"></div>
          <span class="text-sm">
            Phase {phase.phase_number}-Year {phase.year_number}
          </span>
        </div>
      {/each}
      <div class="flex items-center gap-2 ml-auto">
        <ClockIcon size={16} class="text-warning" />
        <span class="text-sm text-muted-foreground">현재 분기</span>
      </div>
    </div>

    <!-- 타임라인 그리드 -->
    <div class="overflow-x-auto">
      <div class="min-w-max">
        {#each timeline as yearData}
          <div class="mb-8">
            <!-- 연도 헤더 -->
            <div class="text-xl font-bold mb-4 sticky left-0 bg-background py-2">
              {yearData.year}년
            </div>

            <!-- 분기 그리드 -->
            <div class="grid grid-cols-4 gap-4">
              {#each yearData.quarters as quarterData}
                {@const activityCount = getActivityCount(yearData.year, quarterData.quarter)}
                {@const phaseActivities = hasPhase(yearData.year, quarterData.quarter)}
                {@const isCurrent = isCurrentQuarter(yearData.year, quarterData.quarter)}
                {@const isPast = isPastQuarter(yearData.year, quarterData.quarter)}

                <div
                  class="border-2 rounded-lg p-4 min-h-48 transition-all {isCurrent
                    ? 'border-warning bg-warning/5'
                    : 'border-border'}"
                  class:opacity-70={isPast}
                >
                  <!-- 분기 헤더 -->
                  <div class="flex items-center justify-between mb-3">
                    <div class="font-semibold">
                      {quarterData.quarter}
                      {#if isCurrent}
                        <ThemeBadge variant="warning" size="sm" class="ml-2">진행중</ThemeBadge>
                      {/if}
                    </div>
                    {#if activityCount > 0}
                      <ThemeBadge variant="default" size="sm">{activityCount}</ThemeBadge>
                    {/if}
                  </div>

                  <div class="text-xs text-muted-foreground mb-3">{quarterData.label}</div>

                  <!-- 단계 표시 -->
                  {#if phaseActivities.length > 0}
                    <div class="space-y-2 mb-3">
                      {#each phaseActivities as activity}
                        {@const phase = activity.data}
                        <div
                          class="p-2 rounded text-xs text-white {getPhaseColor(phase.phase_number)}"
                        >
                          <div class="font-medium">
                            P{phase.phase_number}-Y{phase.year_number}
                          </div>
                          {#if activity.isStart}
                            <div class="text-xs opacity-90">🟢 시작</div>
                          {/if}
                          {#if activity.isEnd}
                            <div class="text-xs opacity-90">🔴 종료</div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}

                  <!-- 활동 요약 -->
                  {#if activityCount > 0}
                    {@const key = `${yearData.year}-${quarterData.quarter}`}
                    {@const activities = quarterlyActivities[key] || []}
                    {@const deliverableCount = activities.filter(
                      (a: any) => a.type === 'deliverable',
                    ).length}
                    {@const kpiCount = activities.filter((a: any) => a.type === 'kpi').length}
                    {@const scenarioCount = activities.filter(
                      (a: any) => a.type === 'scenario',
                    ).length}

                    <div class="space-y-1 text-xs">
                      {#if deliverableCount > 0}
                        <div class="flex items-center gap-1 text-muted-foreground">
                          <CircleIcon size={8} class="fill-current" />
                          <span>산출물 {deliverableCount}개</span>
                        </div>
                      {/if}
                      {#if kpiCount > 0}
                        <div class="flex items-center gap-1 text-muted-foreground">
                          <CircleIcon size={8} class="fill-current" />
                          <span>KPI 측정 {kpiCount}개</span>
                        </div>
                      {/if}
                      {#if scenarioCount > 0}
                        <div class="flex items-center gap-1 text-muted-foreground">
                          <CircleIcon size={8} class="fill-current" />
                          <span>검증 {scenarioCount}건</span>
                        </div>
                      {/if}
                    </div>
                  {:else}
                    <div class="text-xs text-muted-foreground italic">활동 없음</div>
                  {/if}

                  <!-- 과거 분기 완료 표시 -->
                  {#if isPast && activityCount > 0}
                    <div class="mt-3 flex items-center gap-1 text-xs text-success">
                      <CheckCircle2Icon size={12} />
                      <span>완료</span>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </ThemeCard>
</div>

<style>
  .rd-dev-master-roadmap {
    @apply w-full;
  }

  /* 스크롤바 스타일링 */
  .overflow-x-auto::-webkit-scrollbar {
    height: 8px;
  }

  .overflow-x-auto::-webkit-scrollbar-track {
    background: transparent;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 4px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
  }
</style>
