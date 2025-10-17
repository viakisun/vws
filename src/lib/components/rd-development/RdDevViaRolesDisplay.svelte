<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import {
    AlertCircleIcon,
    BarChart3Icon,
    CheckCircleIcon,
    ClockIcon,
    Code2Icon,
    DatabaseIcon,
    ExternalLinkIcon,
    FileTextIcon,
    GlobeIcon,
    MonitorIcon,
    SettingsIcon,
    ShieldIcon,
    SmartphoneIcon,
    UsersIcon,
  } from 'lucide-svelte'

  interface Props {
    viaRoles: any[]
    loading?: boolean
  }

  let { viaRoles = [], loading = false }: Props = $props()

  // 역할 카테고리에 따른 아이콘
  function getCategoryIcon(category: string) {
    switch (category?.toLowerCase()) {
      case 'platform':
      case '플랫폼':
        return Code2Icon
      case 'data':
      case '데이터':
        return DatabaseIcon
      case 'ui/ux':
      case '인터페이스':
        return MonitorIcon
      case 'integration':
      case '통합':
        return GlobeIcon
      case 'security':
      case '보안':
        return ShieldIcon
      case 'analytics':
      case '분석':
        return BarChart3Icon
      case 'mobile':
      case '모바일':
        return SmartphoneIcon
      case 'documentation':
      case '문서화':
        return FileTextIcon
      default:
        return SettingsIcon
    }
  }

  // 역할 카테고리에 따른 색상
  function getCategoryColor(category: string): string {
    switch (category?.toLowerCase()) {
      case 'platform':
      case '플랫폼':
        return 'primary'
      case 'data':
      case '데이터':
        return 'success'
      case 'ui/ux':
      case '인터페이스':
        return 'warning'
      case 'integration':
      case '통합':
        return 'info'
      case 'security':
      case '보안':
        return 'error'
      case 'analytics':
      case '분석':
        return 'default'
      default:
        return 'muted'
    }
  }

  // 진행 상태에 따른 아이콘
  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return CheckCircleIcon
      case 'in_progress':
        return ClockIcon
      case 'planned':
        return AlertCircleIcon
      default:
        return ClockIcon
    }
  }

  // 진행 상태에 따른 색상
  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'primary'
      case 'planned':
        return 'info'
      default:
        return 'muted'
    }
  }

  // 진행 상태 한국어 변환
  function getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return '완료'
      case 'in_progress':
        return '진행중'
      case 'planned':
        return '예정'
      default:
        return '미정'
    }
  }

  // 통계 계산
  const stats = $derived.by(() => {
    const total = viaRoles.length
    const completed = viaRoles.filter((role: any) => role.status === 'completed').length
    const inProgress = viaRoles.filter((role: any) => role.status === 'in_progress').length
    const planned = viaRoles.filter((role: any) => role.status === 'planned').length

    const byCategory = viaRoles.reduce(
      (acc: Record<string, number>, role: any) => {
        const category = role.category || '기타'
        acc[category] = (acc[category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total,
      completed,
      inProgress,
      planned,
      byCategory,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
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

  // 필터링된 역할 목록
  const filteredRoles = $derived.by(() => {
    if (categoryFilter === 'all') return viaRoles
    return viaRoles.filter((role: any) => role.category === categoryFilter)
  })
</script>

<div class="rd-dev-via-roles-display">
  <!-- 통계 카드 -->
  <div class="stats-section mb-6">
    <ThemeCard class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">VIA 역할 현황</h3>
        <UsersIcon size={24} class="text-primary" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="stat-item">
          <div class="stat-value">{stats.total}</div>
          <div class="stat-label">총 역할</div>
        </div>

        <div class="stat-item">
          <div class="stat-value">{stats.completionRate}%</div>
          <div class="stat-label">완료율</div>
        </div>

        <div class="stat-item">
          <div class="stat-value">{stats.completed}</div>
          <div class="stat-label">완료</div>
        </div>

        <div class="stat-item">
          <div class="stat-value">{stats.inProgress}</div>
          <div class="stat-label">진행중</div>
        </div>

        <div class="stat-item">
          <div class="stat-value">{stats.planned}</div>
          <div class="stat-label">예정</div>
        </div>
      </div>
    </ThemeCard>
  </div>

  <!-- 카테고리별 통계 -->
  {#if Object.keys(stats.byCategory).length > 0}
    <div class="category-stats mb-6">
      <ThemeCard class="p-4">
        <h4 class="font-semibold mb-3">카테고리별 역할</h4>
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
          역할 보고서
        </ThemeButton>
        <ThemeButton variant="secondary" size="sm">
          <ExternalLinkIcon size={16} class="mr-1" />
          내보내기
        </ThemeButton>
      </div>
    </div>
  </div>

  <!-- 역할 목록 -->
  <div class="roles-container">
    {#if loading}
      <div class="loading-state">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p class="text-muted-foreground mt-2">VIA 역할을 불러오는 중...</p>
      </div>
    {:else if filteredRoles.length === 0}
      <ThemeCard class="p-8 text-center">
        <UsersIcon size={48} class="mx-auto text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold mb-2">VIA 역할이 없습니다</h3>
        <p class="text-muted-foreground">
          {categoryFilter === 'all'
            ? '등록된 VIA 역할이 없습니다.'
            : '선택한 카테고리의 역할이 없습니다.'}
        </p>
      </ThemeCard>
    {:else}
      <div class="roles-grid">
        {#each filteredRoles as viaRole (viaRole.id)}
          {@const CategoryIcon = getCategoryIcon(viaRole.category || '')}
          {@const StatusIcon = getStatusIcon(viaRole.status)}

          <ThemeCard class="role-card">
            <!-- 역할 헤더 -->
            <div class="role-header">
              <div class="role-title-section">
                <div class="flex items-start gap-3">
                  <CategoryIcon size={24} class="text-primary mt-1 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-lg mb-1">{viaRole.role_title}</h4>
                    {#if viaRole.category}
                      <ThemeBadge variant="default" size="sm" class="mb-2">
                        {viaRole.category}
                      </ThemeBadge>
                    {/if}
                  </div>
                </div>
              </div>

              <div class="role-status">
                <ThemeBadge variant="default" class="flex items-center gap-1">
                  <StatusIcon size={12} />
                  {getStatusText(viaRole.status)}
                </ThemeBadge>
              </div>
            </div>

            <!-- 역할 설명 -->
            {#if viaRole.role_description}
              <div class="role-description mt-4">
                <h5 class="font-medium text-sm mb-2">역할 설명</h5>
                <p class="text-sm text-muted-foreground leading-relaxed">
                  {viaRole.role_description}
                </p>
              </div>
            {/if}

            <!-- 주요 활동 -->
            {#if viaRole.key_activities && viaRole.key_activities.length > 0}
              <div class="role-activities mt-4">
                <h5 class="font-medium text-sm mb-2">주요 활동</h5>
                <ul class="space-y-1">
                  {#each viaRole.key_activities as activity}
                    <li class="text-sm text-muted-foreground flex items-start gap-2">
                      <span class="text-primary mt-1">•</span>
                      <span>{activity}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- 기술 스택 -->
            {#if viaRole.technology_stack && viaRole.technology_stack.length > 0}
              <div class="role-technologies mt-4">
                <h5 class="font-medium text-sm mb-2">기술 스택</h5>
                <div class="flex flex-wrap gap-1">
                  {#each viaRole.technology_stack as tech}
                    <ThemeBadge variant="default" size="sm">{tech}</ThemeBadge>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- 산출물 -->
            {#if viaRole.expected_outputs && viaRole.expected_outputs.length > 0}
              <div class="role-outputs mt-4">
                <h5 class="font-medium text-sm mb-2">예상 산출물</h5>
                <ul class="space-y-1">
                  {#each viaRole.expected_outputs as output}
                    <li class="text-sm text-muted-foreground flex items-start gap-2">
                      <FileTextIcon size={14} class="text-primary mt-1 flex-shrink-0" />
                      <span>{output}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- 액션 버튼 -->
            <div class="role-actions mt-4 pt-4 border-t border-border">
              <div class="flex gap-2">
                <ThemeButton variant="secondary" size="sm" class="flex-1">상세보기</ThemeButton>
                {#if viaRole.status !== 'completed'}
                  <ThemeButton variant="primary" size="sm">진행상황 업데이트</ThemeButton>
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
  .rd-dev-via-roles-display {
    display: flex;
    flex-direction: column;
  }

  .rd-dev-via-roles-display > * + * {
    margin-top: 1.5rem;
  }

  .stats-section {
    background-color: hsl(var(--surface));
    border: 1px solid hsl(var(--border));
    border-radius: 0.5rem;
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: hsl(var(--primary));
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
  }

  .category-stats {
    background-color: hsl(var(--surface));
    border: 1px solid hsl(var(--border));
    border-radius: 0.5rem;
  }

  .filters-section {
    background-color: hsl(var(--surface));
    border: 1px solid hsl(var(--border));
    border-radius: 0.5rem;
    padding: 1rem;
  }

  .roles-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .roles-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1024px) {
    .roles-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  :global(.role-card) {
    border: 1px solid hsl(var(--border));
    transition: border-color 200ms;
  }

  :global(.role-card:hover) {
    border-color: hsl(var(--primary) / 0.5);
  }

  .role-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .role-title-section {
    flex: 1 1 0%;
    min-width: 0;
  }

  .role-status {
    flex-shrink: 0;
  }

  .role-description {
    background-color: hsl(var(--surface) / 0.5);
    border-radius: 0.5rem;
    padding: 0.75rem;
  }

  .role-activities {
    background-color: hsl(var(--muted) / 0.3);
    border-radius: 0.5rem;
    padding: 0.75rem;
  }

  .role-technologies {
    background-color: hsl(var(--muted) / 0.2);
    border-radius: 0.5rem;
    padding: 0.75rem;
  }

  .role-outputs {
    background-color: hsl(var(--surface) / 0.3);
    border-radius: 0.5rem;
    padding: 0.75rem;
  }

  .role-actions {
    border-top: 1px solid hsl(var(--border));
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
  }
</style>
