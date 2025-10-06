<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { CalendarIcon, DollarSignIcon, EditIcon, TrashIcon } from '@lucide/svelte'

  let {
    selectedProject,
    budgetRefreshTrigger = 0,
    onEditProject,
    onShowBudgetModal,
    onDeleteProject,
  }: {
    selectedProject: any
    budgetRefreshTrigger?: number
    onEditProject: () => void
    onShowBudgetModal: () => void
    onDeleteProject: () => void
  } = $props()

  function getStatusColor(
    status: string,
  ): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'ghost' | 'default' {
    const statusMap: Record<
      string,
      'primary' | 'success' | 'warning' | 'error' | 'info' | 'ghost' | 'default'
    > = {
      active: 'success',
      planning: 'info',
      completed: 'default',
      cancelled: 'error',
      suspended: 'warning',
    }
    return statusMap[status] || 'default'
  }

  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      active: '진행중',
      planning: '기획중',
      completed: '완료',
      cancelled: '취소',
      suspended: '중단',
    }
    return statusMap[status] || status
  }

  function getPriorityColor(
    priority: string,
  ): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'ghost' | 'default' {
    const priorityMap: Record<
      string,
      'primary' | 'success' | 'warning' | 'error' | 'info' | 'ghost' | 'default'
    > = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      critical: 'error',
    }
    return priorityMap[priority] || 'default'
  }

  function getPriorityText(priority: string): string {
    const priorityMap: Record<string, string> = {
      low: '낮음',
      medium: '보통',
      high: '높음',
      critical: '긴급',
    }
    return priorityMap[priority] || priority
  }

  function getSponsorTypeText(type: string): string {
    const sponsorMap: Record<string, string> = {
      government: '정부',
      private: '민간',
      internal: '자체',
    }
    return sponsorMap[type] || type
  }

  function getResearchTypeText(type: string): string {
    const researchMap: Record<string, string> = {
      basic: '기초연구',
      applied: '응용연구',
      development: '개발연구',
    }
    return researchMap[type] || type
  }
</script>

<ThemeCard class="p-6">
  <!-- 헤더: 제목과 액션 버튼 -->
  <div class="flex items-start justify-between mb-6">
    <div class="flex-1">
      <!-- 프로젝트 제목과 코드 -->
      <div class="flex items-center gap-3 mb-3">
        <h2 class="text-2xl font-bold text-gray-900">
          {selectedProject.title}
        </h2>
        <span class="text-sm text-gray-500 font-mono">{selectedProject.code}</span>
      </div>

      <!-- 상태 및 우선순위 태그 -->
      <div class="flex items-center gap-2 mb-3">
        <ThemeBadge variant={getStatusColor(selectedProject.status)} size="md">
          {getStatusText(selectedProject.status)}
        </ThemeBadge>
        <ThemeBadge variant={getPriorityColor(selectedProject.priority)} size="md">
          {getPriorityText(selectedProject.priority)}
        </ThemeBadge>
        <ThemeBadge variant="info" size="md">
          {getSponsorTypeText(selectedProject.sponsor_type || selectedProject.sponsorType)}
        </ThemeBadge>
        <ThemeBadge variant="primary" size="md">
          {getResearchTypeText(selectedProject.research_type || selectedProject.researchType)}
        </ThemeBadge>
      </div>

      {#if selectedProject.description}
        <p class="text-gray-700 mb-3 whitespace-pre-line">{selectedProject.description}</p>
      {/if}

      <!-- 프로젝트 기간 (연차 정보 기반) -->
      <div class="flex items-center text-sm text-gray-600">
        <CalendarIcon size={16} class="mr-2 text-orange-600" />
        <span id="project-period">연차 정보를 불러오는 중...</span>
      </div>
    </div>

    <!-- 액션 버튼 -->
    <div class="flex gap-2 ml-4">
      <ThemeButton variant="primary" size="sm" onclick={onEditProject}>
        <EditIcon size={16} class="mr-2" />
        정보 수정
      </ThemeButton>
      <ThemeButton variant="primary" size="sm" onclick={onShowBudgetModal}>
        <DollarSignIcon size={16} class="mr-2" />
        예산 수정
      </ThemeButton>
      <ThemeButton variant="error" size="sm" onclick={onDeleteProject}>
        <TrashIcon size={16} class="mr-2" />
        삭제
      </ThemeButton>
    </div>
  </div>

  <!-- 사업비 예산 -->
  <div class="bg-gray-50 rounded-lg p-6">
    {#await import('$lib/components/project-management/ProjectBudgetSummary.svelte')}
      <div class="flex items-center justify-center py-4">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600 text-sm">로딩 중...</span>
      </div>
    {:then { default: ProjectBudgetSummary }}
      <ProjectBudgetSummary
        projectId={selectedProject.id}
        compact={true}
        refreshTrigger={budgetRefreshTrigger}
      />
    {:catch}
      <div class="text-center py-4 text-gray-500">
        <p class="text-sm">예산 정보를 불러올 수 없습니다.</p>
      </div>
    {/await}
  </div>
</ThemeCard>
