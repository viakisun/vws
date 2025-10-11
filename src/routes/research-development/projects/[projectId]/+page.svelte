<script lang="ts">
  import { browser } from '$app/environment'
  import { page } from '$app/state'
  import PermissionGate from '$lib/components/auth/PermissionGate.svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import RDDetailView from '$lib/components/research-development/RDDetailView.svelte'
  import {
    getRDPriorityColor,
    getRDPriorityText,
    getRDResearchTypeText,
    getRDSponsorTypeText,
    getRDStatusColor,
    getRDStatusText,
  } from '$lib/components/research-development/utils/rd-status-utils'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import { PermissionAction, Resource } from '$lib/stores/permissions'
  import { logger } from '$lib/utils/logger'
  import { ArrowLeftIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  const projectId = page.params.projectId
  let project: any = $state(null)
  let loading = $state(true)

  onMount(async () => {
    if (browser) {
      await loadProject()
    }
  })

  async function loadProject() {
    try {
      loading = true
      const response = await fetch(`/api/research-development/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          project = data.data
        }
      }
    } catch (err) {
      logger.error('프로젝트 로드 실패:', err)
    } finally {
      loading = false
    }
  }
</script>

<PermissionGate resource={Resource.PROJECT_PROJECTS} action={PermissionAction.READ}>
  <PageLayout
    title={project?.project_task_name || project?.projectTaskName || project?.title || '프로젝트 상세'}
    subtitle={`${project?.title || ''} ${project?.code ? `(${project.code})` : ''}`}
    actions={[
      {
        label: '목록으로',
        variant: 'secondary' as const,
        icon: ArrowLeftIcon,
        href: '/research-development',
      },
    ]}
  >
    {#snippet headerExtra()}
      {#if project && !loading}
        <div class="flex items-center gap-2">
          <ThemeBadge variant={getRDStatusColor(project.status)} size="md">
            {getRDStatusText(project.status)}
          </ThemeBadge>
          <ThemeBadge variant={getRDPriorityColor(project.priority)} size="md">
            {getRDPriorityText(project.priority)}
          </ThemeBadge>
          <ThemeBadge variant="info" size="md">
            {getRDSponsorTypeText(project.sponsor_type || project.sponsorType)}
          </ThemeBadge>
          <ThemeBadge variant="primary" size="md">
            {getRDResearchTypeText(project.research_type || project.researchType)}
          </ThemeBadge>
        </div>
      {/if}
    {/snippet}

    {#if loading}
      <div class="text-center py-12">
        <div style:color="var(--color-text-secondary)">로딩 중...</div>
      </div>
    {:else if project}
      <RDDetailView selectedProject={project} />
    {:else}
      <div class="text-center py-12">
        <p style:color="var(--color-text-secondary)">프로젝트를 찾을 수 없습니다.</p>
      </div>
    {/if}
  </PageLayout>
</PermissionGate>
