<script lang="ts">
  import RdDevCollaborationTimeline from '$lib/components/rd-development/RdDevCollaborationTimeline.svelte'
  import RdDevCurrentStatus from '$lib/components/rd-development/RdDevCurrentStatus.svelte'
  import RdDevDeliverablesRoadmap from '$lib/components/rd-development/RdDevDeliverablesRoadmap.svelte'
  import RdDevDeveloperGuide from '$lib/components/rd-development/RdDevDeveloperGuide.svelte'
  import RdDevKpiVerification from '$lib/components/rd-development/RdDevKpiVerification.svelte'
  import RdDevProductOverview from '$lib/components/rd-development/RdDevProductOverview.svelte'
  import RdDevProjectMetadata from '$lib/components/rd-development/RdDevProjectMetadata.svelte'
  import { AlertTriangleIcon } from 'lucide-svelte'

  let { data } = $props()

  let project = $state<any | null>(data.project)
  let phases = $state<any[]>(data.phases || [])
  let deliverables = $state<any[]>(data.deliverables || [])
  let institutions = $state<any[]>(data.institutions || [])
  let viaRoles = $state<any[]>(data.viaRoles || [])
  let timelineData = $state<any | null>(data.timelineData || null)
  let technicalSpecs = $state<any[]>(data.technicalSpecs || [])
  let kpis = $state<any[]>(data.kpis || [])
  let kpiStats = $state<any | null>(data.kpiStats || null)
  let scenarios = $state<any[]>(data.scenarios || [])
  let testLocations = $state<any[]>(data.testLocations || [])
  let upcomingEvents = $state<any[]>(data.upcomingEvents || [])
  let error = $state<string | null>(data.error || null)

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

  function getProjectTypeColor(status: string): string {
    switch (status) {
      case 'active':
        return 'green'
      case 'completed':
        return 'blue'
      case 'planning':
        return 'gray'
      case 'delayed':
        return 'red'
      default:
        return 'gray'
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return '진행중'
      case 'completed':
        return '완료'
      case 'planning':
        return '기획'
      case 'delayed':
        return '지연'
      default:
        return status
    }
  }

  function formatCurrency(amount: number | null | undefined): string {
    if (!amount) return '-'
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

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
    }
  })
</script>

<svelte:head>
  <title>{project?.title || 'R&D 개발 프로젝트'} - 상세 정보</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-6 space-y-6">
  {#if error || !project}
    <!-- Error State -->
    <div
      class="p-4 rounded-lg border"
      style:background="var(--color-surface)"
      style:border-color="var(--color-error)"
    >
      <div class="flex items-center gap-3">
        <AlertTriangleIcon size={20} />
        <p style:color="var(--color-error)">
          {error || '프로젝트를 찾을 수 없습니다'}
        </p>
      </div>
    </div>
  {:else}
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm" style:color="var(--color-text-tertiary)">
      <a href="/rd-development" class="hover:underline">R&D 개발</a>
      <span>/</span>
      <span style:color="var(--color-text-secondary)">{project.title}</span>
    </div>

    <!-- Project Header Card -->
    <div
      class="p-6 rounded-lg border"
      style:background="var(--color-surface)"
      style:border-color="var(--color-border)"
    >
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold" style:color="var(--color-text-primary)">
              {project.title}
            </h1>
            {#if project.project_status}
              {@const statusColor = getProjectTypeColor(project.project_status)}
              <span
                class="px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap"
                style="background: var(--color-{statusColor}-light); color: var(--color-{statusColor}-dark); border-color: var(--color-{statusColor})"
              >
                {getStatusText(project.project_status)}
              </span>
            {/if}
            <span
              class="px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap"
              style:background="var(--color-blue-light)"
              style:color="var(--color-blue-dark)"
              style:border-color="var(--color-blue)"
            >
              {getProjectTypeLabel(project.project_type)}
            </span>
          </div>
          {#if project.description}
            <p class="text-sm" style:color="var(--color-text-secondary)">
              {project.description}
            </p>
          {/if}
        </div>
      </div>

      <!-- Stats Grid -->
      {#if stats}
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4"
          style:border-top="1px solid var(--color-border)"
        >
          <div>
            <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
              완료율
            </div>
            <div class="text-2xl font-bold" style:color="var(--color-primary)">
              {stats.completionRate}%
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
              산출물
            </div>
            <div class="text-2xl font-bold" style:color="var(--color-text-primary)">
              {stats.completedDeliverables}/{stats.totalDeliverables}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
              단계
            </div>
            <div class="text-2xl font-bold" style:color="var(--color-text-primary)">
              {stats.phasesCount}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
              협력기관
            </div>
            <div class="text-2xl font-bold" style:color="var(--color-text-primary)">
              {stats.institutionsCount}
            </div>
          </div>
        </div>
      {/if}

      <!-- Project Details -->
      <div class="flex items-center gap-6 pt-4" style:border-top="1px solid var(--color-border)">
        {#if project.sponsor}
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold" style:color="var(--color-text-tertiary)"
              >발주처</span
            >
            <span class="text-sm font-medium" style:color="var(--color-text-primary)">
              {project.sponsor}
            </span>
          </div>
        {/if}
        {#if project.budget_total}
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold" style:color="var(--color-text-tertiary)">
              총 예산
            </span>
            <span class="text-sm font-medium" style:color="var(--color-text-primary)">
              {formatCurrency(project.budget_total)}
            </span>
          </div>
        {/if}
        {#if project.start_date && project.end_date}
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold" style:color="var(--color-text-tertiary)">
              기간
            </span>
            <span class="text-sm font-medium" style:color="var(--color-text-primary)">
              {new Date(project.start_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
              })} ~
              {new Date(project.end_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Current Status -->
    <RdDevCurrentStatus {project} {phases} {deliverables} {kpis} {upcomingEvents} />

    <!-- Product Overview -->
    <RdDevProductOverview {project} {viaRoles} {deliverables} {institutions} />

    <!-- Collaboration Timeline -->
    <RdDevCollaborationTimeline {project} {phases} {deliverables} {institutions} />

    <!-- KPI & Verification -->
    <RdDevKpiVerification {kpis} {kpiStats} {scenarios} {testLocations} />

    <!-- Deliverables Roadmap -->
    <RdDevDeliverablesRoadmap {phases} {deliverables} {institutions} />

    <!-- Developer Guide -->
    <RdDevDeveloperGuide {phases} {technicalSpecs} {testLocations} {viaRoles} />

    <!-- Project Metadata -->
    <RdDevProjectMetadata {project} {institutions} {viaRoles} {technicalSpecs} />
  {/if}
</div>
