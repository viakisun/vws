<!--
  R&D Development Verification Scenarios View
  검증 시나리오 상세 보기
-->

<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import {
    AlertCircleIcon,
    CheckCircle2Icon,
    ClipboardCheckIcon,
    ClockIcon,
    MapPinIcon,
    XCircleIcon,
  } from 'lucide-svelte'

  interface Props {
    scenarios: any[]
    testLocations?: any[]
    loading?: boolean
    class?: string
  }

  let {
    scenarios = [],
    testLocations = [],
    loading = false,
    class: className = '',
  }: Props = $props()

  // 상태별 색상
  function getStatusColor(status: string): string {
    switch (status) {
      case '완료':
        return 'success'
      case '진행중':
        return 'warning'
      case '준비중':
        return 'info'
      case '실패':
        return 'error'
      default:
        return 'default'
    }
  }

  // 상태별 아이콘
  function getStatusIcon(status: string) {
    switch (status) {
      case '완료':
        return CheckCircle2Icon
      case '진행중':
        return ClockIcon
      case '준비중':
        return ClipboardCheckIcon
      case '실패':
        return XCircleIcon
      default:
        return AlertCircleIcon
    }
  }

  // 테스트 장소 찾기
  function getTestLocationName(locationId: string | null): string {
    if (!locationId) return '미정'
    const location = testLocations.find((l: any) => l.id === locationId)
    return location?.location_name || '미정'
  }
</script>

<div class="rd-dev-scenarios {className}">
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span class="ml-2 text-muted-foreground">시나리오 로딩 중...</span>
    </div>
  {:else if scenarios.length === 0}
    <ThemeCard class="p-6 text-center">
      <p class="text-muted-foreground">등록된 검증 시나리오가 없습니다.</p>
    </ThemeCard>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each scenarios as scenario}
        {@const StatusIcon = getStatusIcon(scenario.status)}

        <ThemeCard class="p-6 hover:shadow-lg transition-shadow">
          <!-- 시나리오 헤더 -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold mb-2">{scenario.scenario_name}</h3>
              {#if scenario.scenario_description}
                <p class="text-sm text-muted-foreground mb-3">{scenario.scenario_description}</p>
              {/if}
            </div>
            <ThemeBadge variant={getStatusColor(scenario.status) as any} class="ml-2">
              <StatusIcon size={14} class="mr-1" />
              {scenario.status}
            </ThemeBadge>
          </div>

          <!-- 테스트 정보 -->
          <div class="space-y-2 mb-4 text-sm">
            {#if scenario.test_date}
              <div class="flex items-center gap-2 text-muted-foreground">
                <ClockIcon size={16} />
                <span>테스트 일정: {new Date(scenario.test_date).toLocaleDateString('ko-KR')}</span>
              </div>
            {/if}
            <div class="flex items-center gap-2 text-muted-foreground">
              <MapPinIcon size={16} />
              <span>테스트 장소: {getTestLocationName(scenario.test_location_id)}</span>
            </div>
          </div>

          <!-- 시나리오 단계 -->
          {#if scenario.scenario_steps && scenario.scenario_steps.length > 0}
            <div class="border-t border-border pt-4">
              <div class="text-sm font-medium mb-3">테스트 단계</div>
              <div class="space-y-2">
                {#each scenario.scenario_steps.slice(0, 5) as step, index}
                  <div class="flex items-start gap-2 text-sm">
                    <div
                      class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary"
                    >
                      {index + 1}
                    </div>
                    <div class="flex-1 pt-0.5">{step}</div>
                  </div>
                {/each}
                {#if scenario.scenario_steps.length > 5}
                  <div class="text-xs text-muted-foreground text-center pt-2">
                    외 {scenario.scenario_steps.length - 5}개 단계
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <!-- 테스트 결과 (완료된 경우) -->
          {#if scenario.status === '완료' && scenario.test_results && Object.keys(scenario.test_results).length > 0}
            <div class="border-t border-border pt-4 mt-4">
              <div class="text-sm font-medium mb-2 text-success">테스트 결과</div>
              <div class="text-sm text-muted-foreground bg-success/5 p-3 rounded">검증 완료됨</div>
            </div>
          {/if}

          <!-- 실패 시 -->
          {#if scenario.status === '실패'}
            <div class="border-t border-border pt-4 mt-4">
              <div class="text-sm font-medium mb-2 text-error">실패 사유</div>
              <div class="text-sm text-muted-foreground bg-error/5 p-3 rounded">재검증 필요</div>
            </div>
          {/if}
        </ThemeCard>
      {/each}
    </div>
  {/if}
</div>

<style>
  .rd-dev-scenarios {
    @apply w-full;
  }
</style>
