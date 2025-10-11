<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { CalendarIcon, DollarSignIcon, EditIcon, TrashIcon } from '@lucide/svelte'
  import {
    getRDPriorityColor,
    getRDPriorityText,
    getRDResearchTypeText,
    getRDSponsorTypeText,
    getRDStatusColor,
    getRDStatusText,
  } from './utils/rd-status-utils'

  /**
   * Props 인터페이스
   * 연구개발사업 헤더 컴포넌트의 속성 정의
   */
  interface Props {
    /** 선택된 연구개발사업 */
    selectedProject: any
    /** 예산 새로고침 트리거 */
    budgetRefreshTrigger?: number
    /** 연구개발사업 정보 수정 핸들러 */
    onEditProject: () => void
    /** 예산 수정 모달 표시 핸들러 */
    onShowBudgetModal: () => void
    /** 연구개발사업 삭제 핸들러 */
    onDeleteProject: () => void
  }

  const {
    selectedProject,
    budgetRefreshTrigger = 0,
    onEditProject,
    onShowBudgetModal,
    onDeleteProject,
  }: Props = $props()
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
        <ThemeBadge variant={getRDStatusColor(selectedProject.status)} size="md">
          {getRDStatusText(selectedProject.status)}
        </ThemeBadge>
        <ThemeBadge variant={getRDPriorityColor(selectedProject.priority)} size="md">
          {getRDPriorityText(selectedProject.priority)}
        </ThemeBadge>
        <ThemeBadge variant="info" size="md">
          {getRDSponsorTypeText(selectedProject.sponsor_type || selectedProject.sponsorType)}
        </ThemeBadge>
        <ThemeBadge variant="primary" size="md">
          {getRDResearchTypeText(selectedProject.research_type || selectedProject.researchType)}
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
    {#await import('$lib/components/research-development/RDFundingStructure.svelte')}
      <div class="flex items-center justify-center py-4">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600 text-sm">로딩 중...</span>
      </div>
    {:then { default: RDFundingStructure }}
      <RDFundingStructure
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
