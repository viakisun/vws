<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import {
    AlertCircleIcon,
    Code2Icon,
    CpuIcon,
    DatabaseIcon,
    ExternalLinkIcon,
    FileTextIcon,
    GitBranchIcon,
    HardDriveIcon,
    MonitorIcon,
    NetworkIcon,
    ServerIcon,
    SettingsIcon,
    ShieldIcon,
    SmartphoneIcon,
  } from 'lucide-svelte'

  interface Props {
    technicalSpecs: any[]
    loading?: boolean
  }

  let { technicalSpecs = [], loading = false }: Props = $props()

  // 기술 사양 카테고리에 따른 아이콘
  function getCategoryIcon(category: string) {
    switch (category?.toLowerCase()) {
      case 'hardware':
      case '하드웨어':
        return CpuIcon
      case 'software':
      case '소프트웨어':
        return Code2Icon
      case 'database':
      case '데이터베이스':
        return DatabaseIcon
      case 'network':
      case '네트워크':
        return NetworkIcon
      case 'security':
      case '보안':
        return ShieldIcon
      case 'ui/ux':
      case '인터페이스':
        return MonitorIcon
      case 'mobile':
      case '모바일':
        return SmartphoneIcon
      case 'infrastructure':
      case '인프라':
        return ServerIcon
      case 'storage':
      case '스토리지':
        return HardDriveIcon
      case 'api':
        return GitBranchIcon
      case 'documentation':
      case '문서화':
        return FileTextIcon
      default:
        return SettingsIcon
    }
  }

  // 기술 사양 카테고리에 따른 색상
  function getCategoryColor(category: string): string {
    switch (category?.toLowerCase()) {
      case 'hardware':
      case '하드웨어':
        return 'primary'
      case 'software':
      case '소프트웨어':
        return 'success'
      case 'database':
      case '데이터베이스':
        return 'warning'
      case 'network':
      case '네트워크':
        return 'info'
      case 'security':
      case '보안':
        return 'error'
      case 'ui/ux':
      case '인터페이스':
        return 'secondary'
      default:
        return 'muted'
    }
  }

  // 통계 계산
  const stats = $derived.by(() => {
    const total = technicalSpecs.length
    const byCategory = technicalSpecs.reduce(
      (acc, spec) => {
        const category = (spec as any).category || '기타'
        acc[category] = (acc[category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total,
      byCategory,
    }
  })

  // 카테고리별 필터링
  let categoryFilter = $state<string>('all')
  const categoryOptions = $derived.by(() => {
    const categories = ['all', ...Object.keys(stats.byCategory)]
    return categories.map((cat) => ({
      value: cat,
      label: cat === 'all' ? '전체' : cat,
    }))
  })

  // 필터링된 기술 사양 목록
  const filteredSpecs = $derived.by(() => {
    if (categoryFilter === 'all') return technicalSpecs
    return technicalSpecs.filter((spec) => (spec as any).category === categoryFilter)
  })

  // 사양값 포맷팅
  function formatSpecValue(value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return String(value || 'N/A')
  }

  // 사양값 타입에 따른 표시 방식
  function getSpecValueType(value: any): 'text' | 'boolean' | 'number' | 'array' {
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (Array.isArray(value)) return 'array'
    return 'text'
  }
</script>

<div class="rd-dev-technical-specs-view">
  <!-- 통계 카드 -->
  <div class="stats-section mb-6">
    <ThemeCard class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">기술 사양 현황</h3>
        <SettingsIcon size={24} class="text-primary" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="stat-item">
          <div class="stat-value">{stats.total}</div>
          <div class="stat-label">총 사양 항목</div>
        </div>

        {#each Object.entries(stats.byCategory).slice(0, 3) as [category, count]}
          <div class="stat-item">
            <div class="stat-value">{count}</div>
            <div class="stat-label">{category}</div>
          </div>
        {/each}
      </div>
    </ThemeCard>
  </div>

  <!-- 카테고리별 통계 -->
  {#if Object.keys(stats.byCategory).length > 0}
    <div class="category-stats mb-6">
      <ThemeCard class="p-4">
        <h4 class="font-semibold mb-3">카테고리별 기술 사양</h4>
        <div class="flex flex-wrap gap-2">
          {#each Object.entries(stats.byCategory) as [category, count]}
            <ThemeBadge variant="default" class="flex items-center gap-1">
              {category} ({count})
            </ThemeBadge>
          {/each}
        </div>
      </ThemeCard>
    </div>
  {/if}

  <!-- 필터 -->
  <div class="filters-section mb-6">
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex items-center gap-2">
        <label for="category-filter" class="text-sm font-medium">카테고리 필터:</label>
        <select
          id="category-filter"
          bind:value={categoryFilter}
          class="px-3 py-1 border border-border rounded-md bg-surface text-text"
        >
          {#each categoryOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="flex gap-2 ml-auto">
        <ThemeButton variant="secondary" size="sm">
          <FileTextIcon size={16} class="mr-1" />
          사양서 생성
        </ThemeButton>
        <ThemeButton variant="secondary" size="sm">
          <ExternalLinkIcon size={16} class="mr-1" />
          내보내기
        </ThemeButton>
      </div>
    </div>
  </div>

  <!-- 기술 사양 목록 -->
  <div class="specs-container">
    {#if loading}
      <div class="loading-state">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p class="text-muted-foreground mt-2">기술 사양을 불러오는 중...</p>
      </div>
    {:else if filteredSpecs.length === 0}
      <ThemeCard class="p-8 text-center">
        <SettingsIcon size={48} class="mx-auto text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold mb-2">기술 사양이 없습니다</h3>
        <p class="text-muted-foreground">
          {categoryFilter === 'all'
            ? '등록된 기술 사양이 없습니다.'
            : '선택한 카테고리의 사양이 없습니다.'}
        </p>
      </ThemeCard>
    {:else}
      <div class="specs-grid">
        {#each filteredSpecs as spec (spec.id)}
          {@const CategoryIcon = getCategoryIcon(spec.category || '')}

          <ThemeCard class="spec-card">
            <!-- 사양 헤더 -->
            <div class="spec-header">
              <div class="spec-title-section">
                <div class="flex items-start gap-3">
                  <CategoryIcon size={24} class="text-primary mt-1 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-lg mb-1">{spec.spec_name}</h4>
                    {#if spec.category}
                      <ThemeBadge variant="default" size="sm" class="mb-2">
                        {spec.category}
                      </ThemeBadge>
                    {/if}
                  </div>
                </div>
              </div>
            </div>

            <!-- 사양 설명 -->
            {#if spec.description}
              <div class="spec-description mt-4">
                <h5 class="font-medium text-sm mb-2">설명</h5>
                <p class="text-sm text-muted-foreground leading-relaxed">
                  {spec.description}
                </p>
              </div>
            {/if}

            <!-- 사양 세부 정보 -->
            <div class="spec-details mt-4">
              <h5 class="font-medium text-sm mb-3">세부 사양</h5>
              <div class="spec-details-grid">
                {#each Object.entries(spec.specifications || {}) as [key, value]}
                  {@const valueType = getSpecValueType(value)}
                  <div class="spec-detail-item">
                    <span class="spec-detail-key">{key}:</span>
                    <span
                      class="spec-detail-value"
                      class:spec-detail-boolean={valueType === 'boolean'}
                      class:spec-detail-number={valueType === 'number'}
                      class:spec-detail-array={valueType === 'array'}
                    >
                      {#if valueType === 'boolean'}
                        <ThemeBadge variant={value ? 'success' : 'error'} size="sm">
                          {formatSpecValue(value)}
                        </ThemeBadge>
                      {:else if valueType === 'number'}
                        <span class="font-mono text-primary">{formatSpecValue(value)}</span>
                      {:else if valueType === 'array'}
                        <div class="flex flex-wrap gap-1">
                          {#each value as any[] as item}
                            <ThemeBadge variant="default" size="sm">{item}</ThemeBadge>
                          {/each}
                        </div>
                      {:else}
                        {formatSpecValue(value)}
                      {/if}
                    </span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- 요구사항 -->
            {#if spec.requirements && spec.requirements.length > 0}
              <div class="spec-requirements mt-4">
                <h5 class="font-medium text-sm mb-2">요구사항</h5>
                <ul class="space-y-1">
                  {#each spec.requirements as requirement}
                    <li class="text-sm text-muted-foreground flex items-start gap-2">
                      <span class="text-primary mt-1">•</span>
                      <span>{requirement}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- 제약사항 -->
            {#if spec.constraints && spec.constraints.length > 0}
              <div class="spec-constraints mt-4">
                <h5 class="font-medium text-sm mb-2">제약사항</h5>
                <ul class="space-y-1">
                  {#each spec.constraints as constraint}
                    <li class="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertCircleIcon size={14} class="text-warning mt-1 flex-shrink-0" />
                      <span>{constraint}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- 액션 버튼 -->
            <div class="spec-actions mt-4 pt-4 border-t border-border">
              <div class="flex gap-2">
                <ThemeButton variant="secondary" size="sm" class="flex-1">상세보기</ThemeButton>
                <ThemeButton variant="primary" size="sm">사양 수정</ThemeButton>
              </div>
            </div>
          </ThemeCard>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .rd-dev-technical-specs-view {
    @apply flex flex-col;
  }

  .rd-dev-technical-specs-view > * + * {
    @apply mt-6;
  }

  .stats-section {
    @apply bg-surface border border-border rounded-lg;
  }

  .stat-item {
    @apply text-center;
  }

  .stat-value {
    @apply text-2xl font-bold text-primary mb-1;
  }

  .stat-label {
    @apply text-sm text-muted-foreground;
  }

  .category-stats {
    @apply bg-surface border border-border rounded-lg;
  }

  .filters-section {
    @apply bg-surface border border-border rounded-lg p-4;
  }

  .specs-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
    gap: 1.5rem;
  }

  .spec-card {
    @apply border border-border hover:border-primary/50 transition-colors duration-200;
  }

  .spec-header {
    @apply flex justify-between items-start gap-4;
  }

  .spec-title-section {
    @apply flex-1 min-w-0;
  }

  .spec-description {
    @apply bg-surface/50 rounded-lg p-3;
  }

  .spec-details {
    @apply bg-muted/30 rounded-lg p-3;
  }

  .spec-details-grid {
    @apply grid grid-cols-1 gap-2;
  }

  .spec-detail-item {
    @apply flex justify-between items-start gap-2;
  }

  .spec-detail-key {
    @apply text-sm font-medium text-muted-foreground flex-shrink-0;
  }

  .spec-detail-value {
    @apply text-sm text-text text-right;
  }

  .spec-detail-boolean {
    @apply flex justify-end;
  }

  .spec-detail-number {
    @apply font-mono;
  }

  .spec-detail-array {
    @apply flex justify-end;
  }

  .spec-requirements {
    @apply bg-muted/20 rounded-lg p-3;
  }

  .spec-constraints {
    @apply bg-error/10 rounded-lg p-3;
  }

  .spec-actions {
    @apply border-t border-border;
  }

  .loading-state {
    @apply flex flex-col items-center justify-center py-12;
  }
</style>
