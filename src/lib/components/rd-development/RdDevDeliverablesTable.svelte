<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type { RdDevDeliverable } from '$lib/types/rd-development'
  import {
    AlertCircleIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    ExternalLinkIcon,
    FileTextIcon,
    UserIcon,
  } from 'lucide-svelte'
  // import { format } from 'date-fns'
  // import { ko } from 'date-fns/locale'

  interface Props {
    deliverables: any[]
    loading?: boolean
  }

  let { deliverables = [], loading = false }: Props = $props()

  // 산출물 상태에 따른 아이콘
  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return CheckCircleIcon
      case 'in_progress':
        return ClockIcon
      case 'delayed':
        return AlertCircleIcon
      case 'planned':
      default:
        return CalendarIcon
    }
  }

  // 산출물 상태에 따른 색상
  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'primary'
      case 'delayed':
        return 'error'
      case 'planned':
      default:
        return 'info'
    }
  }

  // 산출물 상태에 따른 한국어 텍스트
  function getStatusText(status: string) {
    switch (status) {
      case 'completed':
        return '완료'
      case 'in_progress':
        return '진행중'
      case 'delayed':
        return '지연'
      case 'planned':
      default:
        return '예정'
    }
  }

  // 산출물 타입에 따른 아이콘
  function getTypeIcon(type: string) {
    switch (type) {
      case 'document':
        return FileTextIcon
      case 'software':
        return FileTextIcon
      case 'hardware':
        return FileTextIcon
      case 'report':
        return FileTextIcon
      default:
        return FileTextIcon
    }
  }

  // 날짜 포맷팅
  function formatDate(dateString: string | null): string {
    if (!dateString) return '미정'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return '미정'
    }
  }

  // 진행률 계산
  function calculateProgress(deliverable: RdDevDeliverable): number {
    if (deliverable.status === 'completed') return 100
    if (deliverable.status === 'in_progress') return 50
    if (deliverable.status === 'delayed') return 25
    return 0
  }

  // 상태별 필터링
  let statusFilter = $state<string>('all')
  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'planned', label: '예정' },
    { value: 'in_progress', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'delayed', label: '지연' },
  ]

  // 필터링된 산출물 목록
  const filteredDeliverables = $derived.by(() => {
    if (statusFilter === 'all') return deliverables
    return deliverables.filter((d) => d.status === statusFilter)
  })

  // 통계 계산
  const stats = $derived.by(() => {
    const total = deliverables.length
    const completed = deliverables.filter((d) => d.status === 'completed').length
    const inProgress = deliverables.filter((d) => d.status === 'in_progress').length
    const delayed = deliverables.filter((d) => d.status === 'delayed').length
    const planned = deliverables.filter((d) => d.status === 'planned').length

    return {
      total,
      completed,
      inProgress,
      delayed,
      planned,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  })
</script>

<div class="rd-dev-deliverables-table">
  <!-- 통계 카드 -->
  <div class="stats-grid mb-6">
    <ThemeCard class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">총 산출물</p>
          <p class="text-2xl font-bold">{stats.total}</p>
        </div>
        <FileTextIcon size={24} class="text-primary" />
      </div>
    </ThemeCard>

    <ThemeCard class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">완료율</p>
          <p class="text-2xl font-bold">{stats.completionRate}%</p>
        </div>
        <CheckCircleIcon size={24} class="text-success" />
      </div>
    </ThemeCard>

    <ThemeCard class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">진행중</p>
          <p class="text-2xl font-bold">{stats.inProgress}</p>
        </div>
        <ClockIcon size={24} class="text-primary" />
      </div>
    </ThemeCard>

    <ThemeCard class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">지연</p>
          <p class="text-2xl font-bold">{stats.delayed}</p>
        </div>
        <AlertCircleIcon size={24} class="text-error" />
      </div>
    </ThemeCard>
  </div>

  <!-- 필터 및 검색 -->
  <div class="filters-section mb-6">
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex items-center gap-2">
        <label for="status-filter" class="text-sm font-medium">상태별 필터:</label>
        <select
          id="status-filter"
          bind:value={statusFilter}
          class="px-3 py-1 border border-border rounded-md bg-surface text-text"
        >
          {#each statusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="flex gap-2 ml-auto">
        <ThemeButton variant="primary" size="sm">
          <FileTextIcon size={16} class="mr-1" />
          보고서 생성
        </ThemeButton>
        <ThemeButton variant="primary" size="sm">
          <ExternalLinkIcon size={16} class="mr-1" />
          내보내기
        </ThemeButton>
      </div>
    </div>
  </div>

  <!-- 산출물 테이블 -->
  <div class="deliverables-container">
    {#if loading}
      <div class="loading-state">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p class="text-muted-foreground mt-2">산출물을 불러오는 중...</p>
      </div>
    {:else if filteredDeliverables.length === 0}
      <ThemeCard class="p-8 text-center">
        <FileTextIcon size={48} class="mx-auto text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold mb-2">산출물이 없습니다</h3>
        <p class="text-muted-foreground">
          {statusFilter === 'all'
            ? '등록된 산출물이 없습니다.'
            : '선택한 상태의 산출물이 없습니다.'}
        </p>
      </ThemeCard>
    {:else}
      <div class="deliverables-grid">
        {#each filteredDeliverables as deliverable}
          {@const StatusIcon = getStatusIcon(deliverable.status)}
          {@const TypeIcon = getTypeIcon(deliverable.type)}
          {@const progress = calculateProgress(deliverable)}

          <ThemeCard class="deliverable-card">
            <div class="deliverable-header">
              <div class="deliverable-title-section">
                <div class="flex items-start gap-3">
                  <TypeIcon size={20} class="text-primary mt-1 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-lg line-clamp-2 mb-1">
                      {deliverable.title}
                    </h4>
                    <p class="text-sm text-muted-foreground line-clamp-2">
                      {deliverable.description}
                    </p>
                  </div>
                </div>
              </div>

              <div class="deliverable-status">
                <ThemeBadge variant="default" class="flex items-center gap-1">
                  <StatusIcon size={12} />
                  {getStatusText(deliverable.status)}
                </ThemeBadge>
              </div>
            </div>

            <!-- 진행률 바 -->
            <div class="progress-section mt-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium">진행률</span>
                <span class="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <div class="w-full bg-muted-foreground/20 rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full transition-all duration-300"
                  style="width: {progress}%"
                ></div>
              </div>
            </div>

            <!-- 메타 정보 -->
            <div class="deliverable-meta mt-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="meta-item">
                  <span class="text-muted-foreground">담당기관:</span>
                  <span class="font-medium">{deliverable.institution_name || '미정'}</span>
                </div>
                <div class="meta-item">
                  <span class="text-muted-foreground">타입:</span>
                  <span class="font-medium">{deliverable.type}</span>
                </div>
                <div class="meta-item">
                  <span class="text-muted-foreground">목표일:</span>
                  <span class="font-medium">{formatDate(deliverable.target_date)}</span>
                </div>
                <div class="meta-item">
                  <span class="text-muted-foreground">우선순위:</span>
                  <ThemeBadge variant="default" size="sm">
                    {deliverable.priority === 'high'
                      ? '높음'
                      : deliverable.priority === 'medium'
                        ? '보통'
                        : '낮음'}
                  </ThemeBadge>
                </div>
              </div>

              {#if deliverable.responsible_person}
                <div class="meta-item mt-3">
                  <span class="text-muted-foreground flex items-center gap-1">
                    <UserIcon size={14} />
                    담당자:
                  </span>
                  <span class="font-medium">{deliverable.responsible_person}</span>
                </div>
              {/if}
            </div>

            <!-- 액션 버튼 -->
            <div class="deliverable-actions mt-4 pt-4 border-t border-border">
              <div class="flex gap-2">
                <ThemeButton variant="primary" size="sm" class="flex-1">상세보기</ThemeButton>
                {#if deliverable.status !== 'completed'}
                  <ThemeButton variant="primary" size="sm">상태업데이트</ThemeButton>
                {/if}
              </div>
            </div>
          </ThemeCard>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .rd-dev-deliverables-table {
    @apply flex flex-col;
  }

  .rd-dev-deliverables-table > * + * {
    @apply mt-6;
  }

  .stats-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .filters-section {
    @apply bg-surface border border-border rounded-lg p-4;
  }

  .deliverables-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
    gap: 1.5rem;
  }

  .deliverable-card {
    @apply border border-border hover:border-primary/50 transition-colors duration-200;
  }

  .deliverable-header {
    @apply flex justify-between items-start gap-4;
  }

  .deliverable-title-section {
    @apply flex-1 min-w-0;
  }

  .deliverable-status {
    @apply flex-shrink-0;
  }

  .meta-item {
    @apply flex items-center justify-between;
  }

  .deliverable-actions {
    @apply border-t border-border;
  }

  .loading-state {
    @apply flex flex-col items-center justify-center py-12;
  }

  .line-clamp-2 {
    @apply overflow-hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
</style>
