<!--
  R&D Development KPI Tracker Component
  KPI 추적 및 달성률 표시
-->

<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { AlertCircleIcon, CheckCircleIcon, ClockIcon, MinusCircleIcon } from 'lucide-svelte'

  interface Props {
    projectId: string
    kpis?: any[]
    stats?: any
    loading?: boolean
    class?: string
  }

  let {
    projectId,
    kpis = [],
    stats = null,
    loading = false,
    class: className = '',
  }: Props = $props()

  // 카테고리별 그룹화
  const groupedKpis = $derived.by(() => {
    const groups: Record<string, any[]> = {}
    kpis.forEach((kpi: any) => {
      if (!groups[kpi.kpi_category]) {
        groups[kpi.kpi_category] = []
      }
      groups[kpi.kpi_category].push(kpi)
    })
    return groups
  })

  // 상태별 색상
  function getStatusColor(status: string): string {
    switch (status) {
      case '목표달성':
        return 'success'
      case '진행중':
        return 'warning'
      case '지연':
        return 'error'
      default:
        return 'default'
    }
  }

  // 상태별 아이콘
  function getStatusIcon(status: string) {
    switch (status) {
      case '목표달성':
        return CheckCircleIcon
      case '진행중':
        return ClockIcon
      case '지연':
        return AlertCircleIcon
      default:
        return MinusCircleIcon
    }
  }

  // 상태별 라벨
  function getStatusLabel(status: string): string {
    return status
  }

  // 달성률 계산
  const achievementRate = $derived.by(() => {
    if (!stats || stats.total === 0) return 0
    return Math.round((stats.achieved / stats.total) * 100)
  })

  // 진행률 바 색상
  function getProgressColor(rate: number): string {
    if (rate >= 80) return 'bg-success'
    if (rate >= 50) return 'bg-warning'
    return 'bg-error'
  }
</script>

<div class="rd-dev-kpi-tracker {className}">
  <!-- 로딩 상태 -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span class="ml-2 text-muted-foreground">KPI 로딩 중...</span>
    </div>
  {:else}
    <!-- KPI 통계 요약 -->
    {#if stats}
      <ThemeCard class="p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">KPI 달성 현황</h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-primary mb-1">{achievementRate}%</div>
            <div class="text-sm text-muted-foreground">달성률</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-success mb-1">{stats.achieved}</div>
            <div class="text-sm text-muted-foreground">목표 달성</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-warning mb-1">{stats.in_progress}</div>
            <div class="text-sm text-muted-foreground">진행중</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-error mb-1">{stats.delayed}</div>
            <div class="text-sm text-muted-foreground">지연</div>
          </div>
        </div>

        <!-- 전체 진행률 바 -->
        <div class="mb-2">
          <div class="flex justify-between text-sm mb-1">
            <span>전체 진행률</span>
            <span class="font-medium">{stats.achieved} / {stats.total}</span>
          </div>
          <div class="w-full h-4 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-500 {getProgressColor(achievementRate)}"
              style="width: {achievementRate}%"
            ></div>
          </div>
        </div>
      </ThemeCard>
    {/if}

    <!-- 카테고리별 KPI 목록 -->
    {#if Object.keys(groupedKpis).length > 0}
      <div class="space-y-6">
        {#each Object.entries(groupedKpis) as [category, categoryKpis]}
          <ThemeCard class="p-6">
            <h4 class="text-lg font-semibold mb-4">{category}</h4>

            <div class="space-y-4">
              {#each categoryKpis as kpi}
                {@const StatusIcon = getStatusIcon(kpi.status)}

                <div class="border border-border rounded-lg p-4">
                  <!-- KPI 헤더 -->
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                      <h5 class="font-semibold mb-1">{kpi.kpi_name}</h5>
                      {#if kpi.kpi_description}
                        <p class="text-sm text-muted-foreground mb-2">{kpi.kpi_description}</p>
                      {/if}
                    </div>
                    <ThemeBadge variant={getStatusColor(kpi.status) as any} class="ml-2">
                      <StatusIcon size={14} class="mr-1" />
                      {getStatusLabel(kpi.status)}
                    </ThemeBadge>
                  </div>

                  <!-- 목표값 vs 현재값 -->
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div class="text-xs text-muted-foreground mb-1">목표값</div>
                      <div class="text-lg font-semibold text-primary">
                        {kpi.target_value || '-'}
                        {#if kpi.unit}
                          <span class="text-sm font-normal text-muted-foreground ml-1"
                            >{kpi.unit}</span
                          >
                        {/if}
                      </div>
                    </div>
                    <div>
                      <div class="text-xs text-muted-foreground mb-1">현재값</div>
                      <div
                        class="text-lg font-semibold"
                        class:text-success={kpi.status === '목표달성'}
                        class:text-warning={kpi.status === '진행중'}
                        class:text-error={kpi.status === '지연'}
                      >
                        {kpi.current_value || '미측정'}
                        {#if kpi.current_value && kpi.unit}
                          <span class="text-sm font-normal text-muted-foreground ml-1"
                            >{kpi.unit}</span
                          >
                        {/if}
                      </div>
                    </div>
                  </div>

                  <!-- 추가 정보 -->
                  <div class="text-xs text-muted-foreground space-y-1">
                    {#if kpi.measurement_date}
                      <div>
                        측정일: {new Date(kpi.measurement_date).toLocaleDateString('ko-KR')}
                      </div>
                    {/if}
                    {#if kpi.verification_method}
                      <div>
                        검증방법: {kpi.verification_method}
                      </div>
                    {/if}
                    {#if kpi.notes}
                      <div class="mt-2 p-2 bg-muted rounded text-xs">
                        {kpi.notes}
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </ThemeCard>
        {/each}
      </div>
    {:else}
      <ThemeCard class="p-6 text-center">
        <p class="text-muted-foreground">등록된 KPI가 없습니다.</p>
      </ThemeCard>
    {/if}
  {/if}
</div>

<style>
  .rd-dev-kpi-tracker {
    @apply w-full;
  }
</style>
