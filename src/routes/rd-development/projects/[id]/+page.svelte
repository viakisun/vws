<!--
  R&D Development Project Detail Page
  프로젝트 상세 정보 및 탭 인터페이스
-->

<script lang="ts">
  import { page } from '$app/stores'
  import RdDevDeliverablesTable from '$lib/components/rd-development/RdDevDeliverablesTable.svelte'
  import RdDevInstitutionsPanel from '$lib/components/rd-development/RdDevInstitutionsPanel.svelte'
  import RdDevTechnicalSpecsView from '$lib/components/rd-development/RdDevTechnicalSpecsView.svelte'
  import RdDevTimeline from '$lib/components/rd-development/RdDevTimeline.svelte'
  import RdDevViaRolesDisplay from '$lib/components/rd-development/RdDevViaRolesDisplay.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import {
    RdDevDeliverableService,
    RdDevInstitutionService,
    RdDevPhaseService,
    RdDevProjectService,
    RdDevTimelineService,
    RdDevViaRoleService,
  } from '$lib/services/rd-development'
  import {
    AlertCircleIcon,
    ArrowLeftIcon,
    BuildingIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    Code2Icon,
    FileTextIcon,
    SettingsIcon,
    TargetIcon,
    UsersIcon,
  } from 'lucide-svelte'
  import { onMount } from 'svelte'

  let { data } = $props()

  let project = $state<any | null>(data.project)
  let phases = $state<any[]>(data.phases || [])
  let deliverables = $state<any[]>(data.deliverables || [])
  let institutions = $state<any[]>(data.institutions || [])
  let viaRoles = $state<any[]>(data.viaRoles || [])
  let timelineData = $state<any | null>(data.timelineData || null)
  let technicalSpecs = $state<any[]>([])
  let loading = $state(true)
  let error = $state<string | null>(data.error || null)

  // 탭 상태
  let activeTab = $state('overview')

  // 탭 설정
  const tabs = [
    { id: 'overview', label: '개요', icon: Code2Icon },
    { id: 'timeline', label: '타임라인', icon: CalendarIcon },
    { id: 'deliverables', label: '산출물', icon: FileTextIcon },
    { id: 'institutions', label: '참여기관', icon: BuildingIcon },
    { id: 'via-roles', label: 'VIA 역할', icon: UsersIcon },
    { id: 'technical-specs', label: '기술사양', icon: SettingsIcon },
  ]

  const projectService = new RdDevProjectService()
  const phaseService = new RdDevPhaseService()
  const deliverableService = new RdDevDeliverableService()
  const institutionService = new RdDevInstitutionService()
  const viaRoleService = new RdDevViaRoleService()
  const timelineService = new RdDevTimelineService()

  onMount(async () => {
    if (!project && !error) {
      await loadProjectDetails()
    } else {
      loading = false
    }
  })

  async function loadProjectDetails() {
    try {
      loading = true
      error = null

      const projectId = $page.params.id

      const [projectData, phasesData, deliverablesData, institutionsData, viaRolesData] =
        await Promise.all([
          projectService.getProjectById(projectId),
          phaseService.getPhasesByProjectId(projectId),
          deliverableService.getDeliverables({ project_id: projectId }),
          institutionService.getInstitutionsByProjectId(projectId),
          viaRoleService.getViaRolesByProjectId(projectId),
        ])

      if (!projectData) {
        error = '프로젝트를 찾을 수 없습니다'
        return
      }

      project = projectData
      phases = phasesData
      deliverables = deliverablesData
      institutions = institutionsData
      viaRoles = viaRolesData
    } catch (err) {
      error = err instanceof Error ? err.message : '프로젝트 정보를 불러오는데 실패했습니다'
      console.error('Failed to load project details:', err)
    } finally {
      loading = false
    }
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

  function getProjectTypeColor(type: string): string {
    switch (type) {
      case 'worker_follow_amr':
        return 'primary'
      case 'smartfarm_multirobot':
        return 'success'
      default:
        return 'default'
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'success'
      case 'completed':
        return 'info'
      case 'planning':
        return 'warning'
      case 'delayed':
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

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return CheckCircleIcon
      case 'delayed':
        return AlertCircleIcon
      case 'in_progress':
        return ClockIcon
      default:
        return TargetIcon
    }
  }

  // 통계 계산
  const stats = $derived.by(() => {
    if (!project) return null

    const completedDeliverables = deliverables.filter((d: any) => d.status === 'completed').length
    const totalDeliverables = deliverables.length
    const completionRate =
      totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0

    return {
      totalDeliverables,
      completedDeliverables,
      completionRate,
      phasesCount: phases.length,
      institutionsCount: institutions.length,
      viaRolesCount: viaRoles.length,
    }
  })
</script>

<svelte:head>
  <title>{project?.title || 'R&D 개발 프로젝트'} - 상세 정보</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
  <!-- 뒤로가기 버튼 -->
  <div class="mb-6">
    <ThemeButton variant="ghost" size="sm" onclick={() => window.history.back()}>
      <ArrowLeftIcon size={16} class="mr-2" />
      목록으로 돌아가기
    </ThemeButton>
  </div>

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
      <ThemeButton variant="secondary" onclick={loadProjectDetails}>다시 시도</ThemeButton>
    </ThemeCard>
  {/if}

  <!-- 프로젝트 정보 -->
  {#if project && !loading && !error}
    <!-- 프로젝트 헤더 -->
    <div class="mb-8">
      <div class="flex items-start gap-4 mb-4">
        <div class="p-3 rounded-lg bg-primary/10">
          <Code2Icon size={32} class="text-primary" />
        </div>
        <div class="flex-1">
          <h1 class="text-3xl font-bold mb-2">{project.title || '프로젝트 제목 없음'}</h1>
          <div class="flex items-center gap-2 mb-3">
            <ThemeBadge variant={getProjectTypeColor(project.project_type) as any}>
              {getProjectTypeLabel(project.project_type)}
            </ThemeBadge>
            <ThemeBadge variant={getStatusColor(project.project_status || 'planning') as any}>
              {project.project_status || 'planning'}
            </ThemeBadge>
          </div>
          {#if project.description}
            <p class="text-muted-foreground">{project.description}</p>
          {/if}
        </div>
      </div>

      <!-- 프로젝트 통계 -->
      {#if stats}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ThemeCard class="p-4 text-center">
            <div class="text-2xl font-bold text-primary mb-1">{stats.completionRate}%</div>
            <div class="text-sm text-muted-foreground">완료율</div>
          </ThemeCard>
          <ThemeCard class="p-4 text-center">
            <div class="text-2xl font-bold text-success mb-1">
              {stats.completedDeliverables}/{stats.totalDeliverables}
            </div>
            <div class="text-sm text-muted-foreground">완료된 산출물</div>
          </ThemeCard>
          <ThemeCard class="p-4 text-center">
            <div class="text-2xl font-bold text-info mb-1">{stats.phasesCount}</div>
            <div class="text-sm text-muted-foreground">단계</div>
          </ThemeCard>
          <ThemeCard class="p-4 text-center">
            <div class="text-2xl font-bold text-warning mb-1">{stats.institutionsCount}</div>
            <div class="text-sm text-muted-foreground">참여기관</div>
          </ThemeCard>
        </div>
      {/if}
    </div>

    <!-- 탭 인터페이스 -->
    <ThemeTabs {tabs} bind:activeTab variant="underline" size="md" class="mb-6">
      {#if activeTab === 'overview'}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 프로젝트 기본 정보 -->
          <ThemeCard class="p-6">
            <h3 class="text-lg font-semibold mb-4">프로젝트 기본 정보</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-muted-foreground">프로젝트 코드:</span>
                <span class="font-medium">{project.code || '-'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">총 기간:</span>
                <span class="font-medium">{project.total_duration_months}개월</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">시작일:</span>
                <span class="font-medium">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString('ko-KR')
                    : '-'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">종료일:</span>
                <span class="font-medium">
                  {project.end_date ? new Date(project.end_date).toLocaleDateString('ko-KR') : '-'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">후원기관:</span>
                <span class="font-medium">{project.sponsor || '-'}</span>
              </div>
            </div>
          </ThemeCard>

          <!-- 예산 정보 -->
          <ThemeCard class="p-6">
            <h3 class="text-lg font-semibold mb-4">예산 정보</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-muted-foreground">정부지원:</span>
                <span class="font-medium">{formatFunding(project.government_funding)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">기관부담:</span>
                <span class="font-medium">{formatFunding(project.institution_funding)}</span>
              </div>
              <div class="flex justify-between border-t pt-3">
                <span class="text-muted-foreground font-semibold">총 예산:</span>
                <span class="font-bold text-lg">
                  {formatFunding(
                    (project.government_funding || 0) + (project.institution_funding || 0),
                  )}
                </span>
              </div>
            </div>
          </ThemeCard>

          <!-- 단계 정보 -->
          {#if phases.length > 0}
            <ThemeCard class="p-6 lg:col-span-2">
              <h3 class="text-lg font-semibold mb-4">프로젝트 단계</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each phases as phase (phase.id)}
                  <div class="border border-border rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <ThemeBadge variant={getStatusColor(phase.status) as any}>
                        {phase.status}
                      </ThemeBadge>
                      <span class="font-medium"
                        >Phase {phase.phase_number}-Year {phase.year_number}</span
                      >
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {new Date(phase.start_date).toLocaleDateString('ko-KR')} ~
                      {new Date(phase.end_date).toLocaleDateString('ko-KR')}
                    </div>
                    {#if phase.objectives && phase.objectives.length > 0}
                      <div class="mt-2">
                        <p class="text-xs text-muted-foreground mb-1">주요 목표:</p>
                        <ul class="text-xs space-y-1">
                          {#each phase.objectives.slice(0, 2) as objective}
                            <li class="text-muted-foreground">• {objective}</li>
                          {/each}
                          {#if phase.objectives.length > 2}
                            <li class="text-muted-foreground">
                              • 외 {phase.objectives.length - 2}개
                            </li>
                          {/if}
                        </ul>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </ThemeCard>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'timeline'}
        <RdDevTimeline
          phases={timelineData?.phases || []}
          milestones={timelineData?.current_quarter ? [] : []}
          {deliverables}
          currentQuarter={timelineData?.current_quarter}
        />
      {/if}

      {#if activeTab === 'deliverables'}
        <RdDevDeliverablesTable {deliverables} {loading} />
      {/if}

      {#if activeTab === 'institutions'}
        <RdDevInstitutionsPanel {institutions} {loading} />
      {/if}

      {#if activeTab === 'via-roles'}
        <RdDevViaRolesDisplay {viaRoles} {loading} />
      {/if}

      {#if activeTab === 'technical-specs'}
        <RdDevTechnicalSpecsView {technicalSpecs} {loading} />
      {/if}
    </ThemeTabs>
  {/if}
</div>
