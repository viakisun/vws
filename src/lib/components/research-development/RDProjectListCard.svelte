<script lang="ts">
  import RDDetailView from '$lib/components/research-development/RDDetailView.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type { Project } from '$lib/types/index'
  import { FlaskConicalIcon, PlusIcon } from '@lucide/svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  interface Props {
    projects?: Project[]
    selectedProject?: Project | null
    selectedProjectId?: string
    loading?: boolean
    error?: string | null
    budgetRefreshKey?: number
  }

  let {
    projects = [],
    selectedProject = null,
    selectedProjectId = '',
    loading = false,
    error = null,
    budgetRefreshKey = 0,
  }: Props = $props()

  // 간소화된 상태 한글 변환
  function getStatusLabel(status: string) {
    switch (status) {
      case 'active':
        return '진행'
      case 'planning':
        return '기획'
      case 'completed':
        return '완료'
      default:
        return status
    }
  }

  // 프로젝트 선택
  function selectProject(project: Project) {
    dispatch('project-selected', { project })
  }

  // 프로젝트 생성 버튼 클릭
  function handleCreateProject() {
    dispatch('create-project')
  }

  // 프로젝트 삭제 이벤트 처리
  function handleProjectDeleted(event: CustomEvent<{ projectId: string }>) {
    const { projectId } = event.detail

    // 삭제된 프로젝트가 현재 선택된 프로젝트라면 선택 해제
    if (selectedProject && (selectedProject as Project).id === projectId) {
      selectedProject = null
      selectedProjectId = ''
    }

    // 프로젝트 목록에서 삭제된 프로젝트 제거
    projects = projects.filter((p: Project) => p.id !== projectId)

    // 상위 컴포넌트에 삭제 이벤트 전달
    dispatch('project-deleted', { projectId })
  }

  // 프로젝트 새로고침 이벤트 처리
  function handleRefresh() {
    dispatch('refresh')
  }

  // 프로젝트 업데이트 이벤트 처리
  function handleProjectUpdated(event: CustomEvent<{ projectId: string; updatedProject: any }>) {
    dispatch('project-updated', event.detail)
  }

  // 예산 모달 표시 이벤트 처리
  function handleShowBudgetModal() {
    dispatch('show-budget-modal')
  }
</script>

<div class="space-y-6">
  <!-- 프로젝트 선택 헤더 -->
  <ThemeCard>
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="flex flex-col sm:flex-row gap-4 flex-1">
        <div class="relative flex-1 max-w-md">
          <select
            bind:value={selectedProjectId}
            onchange={(e: Event & { currentTarget: HTMLSelectElement }) => {
              const project = projects.find((p: any) => p.id === e.currentTarget.value)
              if (project) selectProject(project)
            }}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">
              {#if loading}
                로딩 중...
              {:else if projects.length === 0}
                프로젝트 없음 (0개)
              {:else}
                프로젝트 선택 ({projects.length}개)
              {/if}
            </option>
            {#each projects as project (project.id)}
              <option value={project.id}>
                {project.title} ({getStatusLabel(project.status)})
              </option>
            {/each}
          </select>
        </div>

        <!-- 프로젝트 통계 표시 -->
        {#if projects.length > 0}
          <div class="flex items-center space-x-4 text-sm text-gray-600">
            <span>총 {projects.length}개</span>
            <span>•</span>
            <span>활성: {projects.filter((p: any) => p.status === 'active').length}개</span>
            <span>•</span>
            <span>완료: {projects.filter((p: any) => p.status === 'completed').length}개</span>
          </div>
        {/if}
      </div>
      <div class="flex gap-2">
        <ThemeButton variant="primary" size="sm" onclick={handleCreateProject} disabled={loading}>
          <PlusIcon size={16} class="mr-2" />
          새 프로젝트
        </ThemeButton>
      </div>
    </div>
  </ThemeCard>

  <!-- 프로젝트 상세 정보 -->
  {#if selectedProject}
    <div class="space-y-6">
      <!-- 프로젝트 기본 정보 -->
      <RDDetailView
        {selectedProject}
        externalRefreshTrigger={budgetRefreshKey}
      />
    </div>
  {:else if projects.length === 0 && !loading && !error}
    <ThemeCard>
      <div class="text-center py-12">
        <FlaskConicalIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">프로젝트가 없습니다</h3>
        <p class="mt-1 text-sm text-gray-500">새 프로젝트를 생성하여 시작하세요.</p>
        <div class="mt-6">
          <ThemeButton variant="primary" onclick={handleCreateProject}>
            <PlusIcon size={16} class="mr-2" />
            첫 프로젝트 생성
          </ThemeButton>
        </div>
      </div>
    </ThemeCard>
  {:else}
    <ThemeCard>
      <div class="text-center py-12">
        <FlaskConicalIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">프로젝트를 선택하세요</h3>
        <p class="mt-1 text-sm text-gray-500">
          위에서 프로젝트를 선택하면 상세 정보를 볼 수 있습니다.
        </p>
      </div>
    </ThemeCard>
  {/if}
</div>
