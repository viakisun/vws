<script lang="ts">
  import { browser } from '$app/environment'
  import { page } from '$app/state'
  import PermissionGate from '$lib/components/auth/PermissionGate.svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ProjectDetailView from '$lib/components/project-management/ProjectDetailView.svelte'
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
      const response = await fetch(`/api/project-management/projects/${projectId}`)
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
    title={project?.title || '프로젝트 상세'}
    subtitle={project?.code || ''}
    actions={[
      {
        label: '목록으로',
        variant: 'secondary' as const,
        icon: ArrowLeftIcon,
        href: '/project-management',
      },
    ]}
  >
    {#if loading}
      <div class="text-center py-12">
        <div style:color="var(--color-text-secondary)">로딩 중...</div>
      </div>
    {:else if project}
      <ProjectDetailView selectedProject={project} />
    {:else}
      <div class="text-center py-12">
        <p style:color="var(--color-text-secondary)">프로젝트를 찾을 수 없습니다.</p>
      </div>
    {/if}
  </PageLayout>
</PermissionGate>
