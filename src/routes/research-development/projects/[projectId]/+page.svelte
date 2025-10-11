<script lang="ts">
  import { browser } from '$app/environment'
  import { page } from '$app/state'
  import PermissionGate from '$lib/components/auth/PermissionGate.svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ResearchDevelopmentDetailView from '$lib/components/research-development/ResearchDevelopmentDetailView.svelte'
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
    title={project?.title || '프로젝트 상세'}
    subtitle={project?.code || ''}
    actions={[
      {
        label: '목록으로',
        variant: 'secondary' as const,
        icon: ArrowLeftIcon,
        href: '/research-development',
      },
    ]}
  >
    {#if loading}
      <div class="text-center py-12">
        <div style:color="var(--color-text-secondary)">로딩 중...</div>
      </div>
    {:else if project}
      <ResearchDevelopmentDetailView selectedProject={project} />
    {:else}
      <div class="text-center py-12">
        <p style:color="var(--color-text-secondary)">프로젝트를 찾을 수 없습니다.</p>
      </div>
    {/if}
  </PageLayout>
</PermissionGate>
