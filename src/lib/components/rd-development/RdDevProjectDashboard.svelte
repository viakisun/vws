<!--
  R&D Development Project Dashboard
  프로젝트 전체 현황을 한눈에 보여주는 통합 대시보드
-->

<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import {
    AlertCircleIcon,
    AlertTriangleIcon,
    CalendarIcon,
    CheckCircle2Icon,
    ClockIcon,
    FileTextIcon,
    TrendingUpIcon,
    UsersIcon,
  } from 'lucide-svelte'

  interface Props {
    project: any
    phases: any[]
    deliverables: any[]
    kpis: any[]
    kpiStats: any
    scenarios: any[]
    upcomingEvents: any[]
    institutions: any[]
    class?: string
  }

  let {
    project,
    phases,
    deliverables,
    kpis,
    kpiStats,
    scenarios,
    upcomingEvents,
    institutions,
    class: className = '',
  }: Props = $props()

  // 전체 진행률 계산
  const overallProgress = $derived.by(() => {
    if (!deliverables || deliverables.length === 0) return 0
    const completed = deliverables.filter((d: any) => d.status === 'completed').length
    return Math.round((completed / deliverables.length) * 100)
  })

  // 단계별 상태 분석
  const phaseStatus = $derived.by(() => {
    const now = new Date()
    const active = phases.filter((p: any) => {
      const start = new Date(p.start_date)
      const end = new Date(p.end_date)
      return start <= now && now <= end
    }).length
    const completed = phases.filter((p: any) => new Date(p.end_date) < now).length
    const upcoming = phases.length - active - completed

    return { active, completed, upcoming, total: phases.length }
  })

  // 산출물 상태 분석
  const deliverableStatus = $derived.by(() => {
    const completed = deliverables.filter((d: any) => d.status === 'completed').length
    const inProgress = deliverables.filter((d: any) => d.status === 'in_progress').length
    const delayed = deliverables.filter((d: any) => d.status === 'delayed').length
    const planned = deliverables.filter((d: any) => d.status === 'planned').length

    return { completed, inProgress, delayed, planned, total: deliverables.length }
  })

  // KPI 달성률
  const kpiAchievementRate = $derived.by(() => {
    if (!kpiStats || kpiStats.total === 0) return 0
    return Math.round((kpiStats.achieved / kpiStats.total) * 100)
  })

  // 위험 알림 (지연된 산출물 + 지연된 KPI)
  const risks = $derived.by(() => {
    const delayedDeliverables = deliverables.filter((d: any) => d.status === 'delayed')
    const delayedKpis = kpis.filter((k: any) => k.status === '지연')

    return {
      count: delayedDeliverables.length + delayedKpis.length,
      deliverables: delayedDeliverables,
      kpis: delayedKpis,
    }
  })

  // 다가오는 이벤트 (7일 이내)
  const urgentEvents = $derived.by(() => {
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
    return upcomingEvents.filter((e: any) => {
      const eventDate = new Date(e.event_date)
      return eventDate <= sevenDaysLater
    })
  })

  // 검증 시나리오 상태
  const scenarioStatus = $derived.by(() => {
    const completed = scenarios.filter((s: any) => s.status === '완료').length
    const inProgress = scenarios.filter((s: any) => s.status === '진행중').length
    const planned = scenarios.filter((s: any) => s.status === '계획').length

    return { completed, inProgress, planned, total: scenarios.length }
  })

  // 진행률 바 색상
  function getProgressColor(rate: number): string {
    if (rate >= 70) return 'bg-success'
    if (rate >= 40) return 'bg-warning'
    return 'bg-error'
  }
</script>

<div class="rd-dev-dashboard {className}">
  <!-- 프로젝트 전체 진행률 -->
  <ThemeCard class="p-6 mb-6 bg-gradient-to-br from-primary/5 to-primary/10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold">프로젝트 전체 진행률</h2>
      <div class="text-4xl font-bold text-primary">{overallProgress}%</div>
    </div>
    <div class="w-full h-6 bg-muted rounded-full overflow-hidden mb-2">
      <div
        class="h-full transition-all duration-500 {getProgressColor(overallProgress)}"
        style="width: {overallProgress}%"
      ></div>
    </div>
    <div class="text-sm text-muted-foreground">
      산출물 {deliverableStatus.completed} / {deliverableStatus.total} 완료
    </div>
  </ThemeCard>

  <!-- 주요 지표 그리드 -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- 단계 진행 -->
    <ThemeCard class="p-4">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm font-medium text-muted-foreground">프로젝트 단계</div>
        <CheckCircle2Icon size={20} class="text-primary" />
      </div>
      <div class="text-3xl font-bold mb-1">{phaseStatus.active}</div>
      <div class="text-xs text-muted-foreground">
        진행중 / 총 {phaseStatus.total}단계
      </div>
      <div class="mt-2 pt-2 border-t border-border text-xs">
        <span class="text-success">✓ {phaseStatus.completed} 완료</span>
        <span class="mx-2">•</span>
        <span class="text-muted-foreground">{phaseStatus.upcoming} 예정</span>
      </div>
    </ThemeCard>

    <!-- KPI 달성률 -->
    <ThemeCard class="p-4">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm font-medium text-muted-foreground">KPI 달성률</div>
        <TrendingUpIcon size={20} class="text-success" />
      </div>
      <div class="text-3xl font-bold mb-1">{kpiAchievementRate}%</div>
      <div class="text-xs text-muted-foreground">
        {kpiStats?.achieved || 0} / {kpiStats?.total || 0} 목표 달성
      </div>
      <div class="mt-2 pt-2 border-t border-border text-xs">
        <span class="text-warning">⏳ {kpiStats?.in_progress || 0} 진행중</span>
        <span class="mx-2">•</span>
        <span class="text-error">⚠ {kpiStats?.delayed || 0} 지연</span>
      </div>
    </ThemeCard>

    <!-- 검증 시나리오 -->
    <ThemeCard class="p-4">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm font-medium text-muted-foreground">검증 시나리오</div>
        <FileTextIcon size={20} class="text-info" />
      </div>
      <div class="text-3xl font-bold mb-1">{scenarioStatus.completed}</div>
      <div class="text-xs text-muted-foreground">
        완료 / 총 {scenarioStatus.total}개
      </div>
      <div class="mt-2 pt-2 border-t border-border text-xs">
        <span class="text-warning">⏳ {scenarioStatus.inProgress} 진행중</span>
        <span class="mx-2">•</span>
        <span class="text-muted-foreground">{scenarioStatus.planned} 계획</span>
      </div>
    </ThemeCard>

    <!-- 참여 기관 -->
    <ThemeCard class="p-4">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm font-medium text-muted-foreground">참여 기관</div>
        <UsersIcon size={20} class="text-warning" />
      </div>
      <div class="text-3xl font-bold mb-1">{institutions.length}</div>
      <div class="text-xs text-muted-foreground">협력 기관</div>
      <div class="mt-2 pt-2 border-t border-border text-xs space-y-1">
        {#each institutions.slice(0, 2) as inst}
          <div class="truncate text-muted-foreground">{inst.institution_name}</div>
        {/each}
        {#if institutions.length > 2}
          <div class="text-muted-foreground">외 {institutions.length - 2}개 기관</div>
        {/if}
      </div>
    </ThemeCard>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- 위험 알림 -->
    <ThemeCard class="p-6">
      <div class="flex items-center gap-2 mb-4">
        <AlertTriangleIcon size={20} class="text-error" />
        <h3 class="text-lg font-semibold">위험 알림</h3>
        {#if risks.count > 0}
          <ThemeBadge variant="error">{risks.count}</ThemeBadge>
        {/if}
      </div>

      {#if risks.count === 0}
        <div class="text-center py-8 text-success">
          <CheckCircle2Icon size={48} class="mx-auto mb-2 opacity-50" />
          <p class="font-medium">현재 위험 요소 없음</p>
          <p class="text-sm text-muted-foreground mt-1">모든 작업이 계획대로 진행 중입니다</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#if risks.deliverables.length > 0}
            <div>
              <div class="text-sm font-medium mb-2 text-error">
                지연된 산출물 ({risks.deliverables.length})
              </div>
              <div class="space-y-2">
                {#each risks.deliverables.slice(0, 3) as deliverable}
                  <div class="flex items-start gap-2 text-sm p-2 bg-error/5 rounded">
                    <AlertCircleIcon size={16} class="text-error flex-shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <div class="font-medium">{deliverable.title}</div>
                      {#if deliverable.target_date}
                        <div class="text-xs text-muted-foreground">
                          목표: {new Date(deliverable.target_date).toLocaleDateString('ko-KR')}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
                {#if risks.deliverables.length > 3}
                  <div class="text-xs text-muted-foreground text-center">
                    외 {risks.deliverables.length - 3}개 산출물
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          {#if risks.kpis.length > 0}
            <div>
              <div class="text-sm font-medium mb-2 text-error">
                지연된 KPI ({risks.kpis.length})
              </div>
              <div class="space-y-2">
                {#each risks.kpis.slice(0, 3) as kpi}
                  <div class="flex items-start gap-2 text-sm p-2 bg-error/5 rounded">
                    <AlertCircleIcon size={16} class="text-error flex-shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <div class="font-medium">{kpi.kpi_name}</div>
                      <div class="text-xs text-muted-foreground">
                        목표: {kpi.target_value}
                        {kpi.unit}
                      </div>
                    </div>
                  </div>
                {/each}
                {#if risks.kpis.length > 3}
                  <div class="text-xs text-muted-foreground text-center">
                    외 {risks.kpis.length - 3}개 KPI
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </ThemeCard>

    <!-- 다가오는 일정 -->
    <ThemeCard class="p-6">
      <div class="flex items-center gap-2 mb-4">
        <CalendarIcon size={20} class="text-warning" />
        <h3 class="text-lg font-semibold">다가오는 일정</h3>
        {#if urgentEvents.length > 0}
          <ThemeBadge variant="warning">{urgentEvents.length}</ThemeBadge>
        {/if}
      </div>

      {#if upcomingEvents.length === 0}
        <div class="text-center py-8 text-muted-foreground">
          <CalendarIcon size={48} class="mx-auto mb-2 opacity-50" />
          <p>예정된 일정이 없습니다</p>
        </div>
      {:else}
        <div class="space-y-3 max-h-80 overflow-y-auto">
          {#each upcomingEvents.slice(0, 10) as event}
            {@const eventDate = new Date(event.event_date)}
            {@const daysUntil = Math.ceil(
              (eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
            )}
            {@const isUrgent = daysUntil <= 7}

            <div
              class="flex items-start gap-3 p-3 rounded-lg border {isUrgent
                ? 'bg-warning/5 border-warning'
                : 'border-border'}"
            >
              <div class="flex-shrink-0 text-center">
                <div class="text-2xl font-bold" class:text-warning={isUrgent}>
                  {eventDate.getDate()}
                </div>
                <div class="text-xs text-muted-foreground">
                  {eventDate.toLocaleDateString('ko-KR', { month: 'short' })}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <ThemeBadge
                    variant={event.event_type === 'KPI측정'
                      ? 'primary'
                      : event.event_type === '산출물마감'
                        ? 'error'
                        : 'default'}
                    size="sm"
                  >
                    {event.event_type}
                  </ThemeBadge>
                  {#if isUrgent}
                    <span class="text-xs text-warning font-medium">
                      {daysUntil === 0 ? '오늘' : `${daysUntil}일 후`}
                    </span>
                  {/if}
                </div>
                <div class="font-medium text-sm truncate">{event.event_title}</div>
                {#if event.event_description}
                  <div class="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {event.event_description}
                  </div>
                {/if}
              </div>
              {#if isUrgent}
                <ClockIcon size={16} class="text-warning flex-shrink-0" />
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </ThemeCard>
  </div>

  <!-- 산출물 현황 상세 -->
  <ThemeCard class="p-6">
    <h3 class="text-lg font-semibold mb-4">산출물 현황</h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="text-center p-4 rounded-lg bg-success/10">
        <div class="text-3xl font-bold text-success mb-1">{deliverableStatus.completed}</div>
        <div class="text-sm text-muted-foreground">완료</div>
      </div>
      <div class="text-center p-4 rounded-lg bg-warning/10">
        <div class="text-3xl font-bold text-warning mb-1">{deliverableStatus.inProgress}</div>
        <div class="text-sm text-muted-foreground">진행중</div>
      </div>
      <div class="text-center p-4 rounded-lg bg-error/10">
        <div class="text-3xl font-bold text-error mb-1">{deliverableStatus.delayed}</div>
        <div class="text-sm text-muted-foreground">지연</div>
      </div>
      <div class="text-center p-4 rounded-lg bg-muted">
        <div class="text-3xl font-bold mb-1">{deliverableStatus.planned}</div>
        <div class="text-sm text-muted-foreground">계획</div>
      </div>
    </div>
  </ThemeCard>
</div>

<style>
  .rd-dev-dashboard {
    @apply w-full;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
