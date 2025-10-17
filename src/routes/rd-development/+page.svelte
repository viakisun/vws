<!--
  R&D Development Projects List Page
  개발자 중심 R&D 프로젝트 목록
-->

<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemeSelect from '$lib/components/ui/ThemeSelect.svelte'
  import { buildRoute, Routes } from '$lib/config/routes.enum'
  // import { RdDevProjectService } from '$lib/services/rd-development' // 서버 사이드에서만 사용
  import type {
    RdDevProjectFilters,
    RdDevProjectStats,
    RdDevProjectType,
  } from '$lib/types/rd-development'
  import { CalendarIcon, Code2Icon, FilterIcon, TargetIcon, UsersIcon } from 'lucide-svelte'

  // 서버에서 로드된 데이터
  let { data } = $props()

  let projects = $state<any[]>(data.projects || [])
  let stats = $state<RdDevProjectStats | null>(data.stats || null)
  let loading = $state(false)
  let error = $state<string | null>(data.error || null)

  // 필터 상태 (서버에서 로드된 필터 사용)
  let filters = $state<RdDevProjectFilters>({
    project_type: data.filters?.project_type as RdDevProjectType | undefined,
    status: data.filters?.status || '',
    search: data.filters?.search || '',
    limit: data.filters?.limit || 50,
    offset: data.filters?.offset || 0,
  })

  // const projectService = new RdDevProjectService() // 서버 사이드에서만 사용

  // 프로젝트 타입 옵션
  const projectTypeOptions = [
    { value: '', label: '전체 프로젝트 타입' },
    { value: 'worker_follow_amr', label: '작업자 추종형 AMR' },
    { value: 'smartfarm_multirobot', label: '스마트팜 멀티로봇' },
  ]

  // 상태 옵션
  const statusOptions = [
    { value: '', label: '전체 상태' },
    { value: 'active', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'planning', label: '계획중' },
  ]

  // 통계 카드 데이터
  const statCards = $derived.by(() => {
    if (!stats) return []

    return [
      {
        title: '전체 프로젝트',
        value: stats.total_projects,
        icon: Code2Icon,
        color: 'primary' as const,
      },
      {
        title: '진행중 프로젝트',
        value: stats.active_projects,
        icon: TargetIcon,
        color: 'success' as const,
      },
      {
        title: '완료된 산출물',
        value: `${stats.completed_deliverables}/${stats.total_deliverables}`,
        icon: CalendarIcon,
        color: 'info' as const,
      },
      {
        title: '참여기관',
        value: stats.institutions_count,
        icon: UsersIcon,
        color: 'warning' as const,
      },
    ]
  })

  // 필터 변경 시 페이지 새로고침
  function loadData() {
    const params = new URLSearchParams()

    if (filters.project_type) {
      params.set('project_type', filters.project_type)
    }
    if (filters.status && filters.status !== '') {
      params.set('status', filters.status)
    }
    if (filters.search && filters.search !== '') {
      params.set('search', filters.search)
    }
    if (filters.limit && filters.limit !== 50) {
      params.set('limit', filters.limit.toString())
    }
    if (filters.offset && filters.offset !== 0) {
      params.set('offset', filters.offset.toString())
    }

    // 페이지 새로고침으로 서버에서 데이터 다시 로드
    const url = params.toString() ? `?${params.toString()}` : ''
    window.location.href = window.location.pathname + url
  }

  function handleFilterChange() {
    filters.offset = 0 // 필터 변경 시 첫 페이지로
    loadData()
  }

  function getProjectTypeLabel(type: string): string {
    switch (type) {
      case 'worker_follow_amr':
        return '작업자 추종형 AMR'
      case 'smartfarm_multirobot':
        return '스마트팜 멀티로봇'
      default:
        return type
    }
  }

  function getProjectTypeColor(type: string): 'primary' | 'success' | 'default' {
    switch (type) {
      case 'worker_follow_amr':
        return 'primary'
      case 'smartfarm_multirobot':
        return 'success'
      default:
        return 'default'
    }
  }

  function getStatusColor(status: string): 'success' | 'warning' | 'error' | 'primary' | 'default' {
    switch (status) {
      case 'active':
        return 'success'
      case 'completed':
        return 'primary'
      case 'planning':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  function formatFunding(amount?: number): string {
    if (!amount) return '-'
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount)
  }
</script>

<svelte:head>
  <title>R&D 개발 - 프로젝트 목록</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
  <!-- 페이지 헤더 -->
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-2">
      <Code2Icon size={32} class="text-primary" />
      <h1 class="text-3xl font-bold">R&D 개발</h1>
    </div>
    <p class="text-muted-foreground">개발자 중심 R&D 프로젝트 관리 및 진행 상황 추적</p>
  </div>

  <!-- 통계 카드 -->
  {#if stats && statCards.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {#each statCards as card}
        <ThemeCard class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground mb-1">{card.title}</p>
              <p class="text-2xl font-bold">{card.value}</p>
            </div>
            <div class="p-3 rounded-lg bg-{card.color}/10">
              <card.icon size={24} class="text-{card.color}" />
            </div>
          </div>
        </ThemeCard>
      {/each}
    </div>
  {/if}

  <!-- 필터 및 검색 -->
  <ThemeCard class="p-6 mb-6">
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- 검색 -->
      <div class="flex-1">
        <ThemeInput
          placeholder="프로젝트명 또는 설명으로 검색..."
          bind:value={filters.search}
          oninput={handleFilterChange}
        />
      </div>

      <!-- 프로젝트 타입 필터 -->
      <ThemeSelect
        options={projectTypeOptions}
        bind:value={filters.project_type}
        onchange={handleFilterChange}
        icon={FilterIcon}
      />

      <!-- 상태 필터 -->
      <ThemeSelect
        options={statusOptions}
        bind:value={filters.status}
        onchange={handleFilterChange}
        icon={TargetIcon}
      />
    </div>
  </ThemeCard>

  <!-- 로딩 상태 -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span class="ml-2 text-muted-foreground">로딩 중...</span>
    </div>
  {/if}

  <!-- 에러 상태 -->
  {#if error}
    <ThemeCard class="p-6 text-center">
      <div class="text-error mb-2">⚠️ 오류 발생</div>
      <p class="text-muted-foreground mb-4">{error}</p>
      <ThemeButton variant="secondary" onclick={loadData}>다시 시도</ThemeButton>
    </ThemeCard>
  {/if}

  <!-- 프로젝트 목록 -->
  {#if !loading && !error}
    {#if projects.length === 0}
      <ThemeCard class="p-12 text-center">
        <Code2Icon size={48} class="mx-auto mb-4 text-muted-foreground" />
        <h3 class="text-lg font-semibold mb-2">프로젝트가 없습니다</h3>
        <p class="text-muted-foreground">검색 조건에 맞는 R&D 개발 프로젝트를 찾을 수 없습니다.</p>
      </ThemeCard>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {#each projects as project (project.id)}
          <ThemeCard
            class="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            clickable={true}
            onclick={() =>
              (window.location.href = buildRoute(Routes.RD_DEVELOPMENT_PROJECT_DETAIL, {
                id: project.id,
              }))}
          >
            <!-- 프로젝트 헤더 -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-semibold mb-1 line-clamp-2">
                  {project.title || '프로젝트 제목 없음'}
                </h3>
                <div class="flex items-center gap-2 mb-2">
                  <ThemeBadge variant={getProjectTypeColor(project.project_type)}>
                    {getProjectTypeLabel(project.project_type)}
                  </ThemeBadge>
                  <ThemeBadge variant={getStatusColor(project.project_status || 'planning')}>
                    {project.project_status || 'planning'}
                  </ThemeBadge>
                </div>
              </div>
            </div>

            <!-- 프로젝트 정보 -->
            <div class="space-y-3">
              <!-- 기간 -->
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon size={16} />
                <span>
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString('ko-KR')
                    : '-'} ~
                  {project.end_date ? new Date(project.end_date).toLocaleDateString('ko-KR') : '-'}
                </span>
              </div>

              <!-- 참여기관 수 -->
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersIcon size={16} />
                <span>참여기관 {stats?.institutions_count || 0}개</span>
              </div>

              <!-- 예산 정보 (간단히) -->
              {#if project.government_funding || project.institution_funding}
                <div class="text-sm">
                  <span class="text-muted-foreground">총 예산: </span>
                  <span class="font-medium">
                    {formatFunding(
                      (project.government_funding || 0) + (project.institution_funding || 0),
                    )}
                  </span>
                </div>
              {/if}

              <!-- 설명 -->
              {#if project.description}
                <p class="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              {/if}
            </div>

            <!-- 액션 버튼 -->
            <div class="mt-4 pt-4 border-t border-border">
              <ThemeButton variant="secondary" size="sm" class="w-full">상세 보기</ThemeButton>
            </div>
          </ThemeCard>
        {/each}
      </div>

      <!-- 페이지네이션 (필요시 추가) -->
      {#if projects.length >= (filters.limit || 50)}
        <div class="mt-8 text-center">
          <p class="text-sm text-muted-foreground">
            더 많은 프로젝트를 보려면 검색 조건을 조정해보세요.
          </p>
        </div>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
