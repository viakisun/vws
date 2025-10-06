<script lang="ts">
  /**
   * ProjectDetailView - Refactored with 3-Stage Budget Flow
   *
   * 1단계: Budget Funding (예산 조달) - funding.*
   * 2단계: Budget Planning (예산 계획) - planning.*
   * 3단계: Budget Execution (예산 집행) - execution.*
   */

  import { logger } from '$lib/utils/logger'
  import { createEventDispatcher } from 'svelte'
  import { useProjectDetail } from './hooks/useProjectDetail.svelte'

  // UI Components
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ProjectBudgetModal from './ProjectBudgetModal.svelte'
  import ProjectMemberForm from './ProjectMemberForm.svelte'
  import EvidenceDetailModal from './EvidenceDetailModal.svelte'
  import EvidenceAddModal from './EvidenceAddModal.svelte'
  import ProjectEditModal from './ProjectEditModal.svelte'
  import ProjectDeleteConfirmModal from './ProjectDeleteConfirmModal.svelte'
  import BudgetUpdateConfirmModal from './BudgetUpdateConfirmModal.svelte'
  import ValidationResultModal from './ValidationResultModal.svelte'

  // Utility functions
  import { formatCurrency, formatDate, formatDateForInput, formatNumber } from '$lib/utils/format'
  import { isKoreanName } from '$lib/utils/korean-name'
  import { calculateMonthlySalary } from '$lib/utils/salary-calculator'
  import * as budgetUtilsImported from './utils/budgetUtils'
  import * as memberUtilsImported from './utils/memberUtils'
  import * as projectUtilsImported from './utils/projectUtils'
  import * as evidenceUtilsImported from './utils/evidenceUtils'
  import * as calculationUtilsImported from './utils/calculationUtils'
  import * as dataTransformers from './utils/dataTransformers'

  // Icons
  import {
    AlertTriangleIcon,
    CalendarIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    DollarSignIcon,
    EditIcon,
    FileTextIcon,
    PlusIcon,
    RefreshCwIcon,
    ShieldAlertIcon,
    ShieldCheckIcon,
    TrashIcon,
    UserIcon,
    UsersIcon,
    XIcon,
  } from '@lucide/svelte'

  // ============================================================================
  // Props & Dispatcher
  // ============================================================================

  let {
    selectedProject,
    externalRefreshTrigger = 0,
  }: { selectedProject: any; externalRefreshTrigger?: number } = $props()

  const dispatch = createEventDispatcher()

  // ============================================================================
  // Initialize Project Detail Hook (3-Stage Architecture)
  // ============================================================================

  const pd = useProjectDetail({ selectedProject, externalRefreshTrigger })

  // Destructure for convenience
  const { store, funding, planning, execution, updateProjectPeriod, refresh } = pd

  // ============================================================================
  // Reactive Aliases for Template Compatibility
  // ============================================================================

  // Modal states
  const modalStates = $derived(store.modals)

  // Loading states
  const loadingStates = $derived(store.loading)

  // UI states
  const uiStates = $derived(store.ui)

  // Selected items
  const selectedItems = $derived(store.selected)

  // Forms
  const forms = $derived(store.forms)

  // Data
  const projectMembers = $derived(store.data.projectMembers)
  const projectBudgets = $derived(store.data.projectBudgets)
  const availableEmployees = $derived(store.data.availableEmployees)
  const _budgetCategories = $derived(store.data.budgetCategories)
  const _evidenceList = $derived(store.data.evidenceList)
  const _evidenceTypes = $derived(store.data.evidenceTypes)

  // Validation
  const validationData = $derived(store.validation)
  const memberValidationStatuses = $derived(store.data.memberValidationStatuses)
  const _memberValidation = $derived(store.data.memberValidation)
  const _memberValidationLastChecked = $derived(store.data.memberValidationLastChecked)

  // ============================================================================
  // Project Management Functions
  // ============================================================================

  async function updateProject() {
    if (!selectedProject?.id) return

    try {
      store.setLoading('updating', true)

      const response = await fetch(`/api/project-management/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: store.forms.project.title,
          code: store.forms.project.code,
          description: store.forms.project.description,
          status: store.forms.project.status,
          sponsorType: store.forms.project.sponsorType,
          priority: store.forms.project.priority,
          researchType: store.forms.project.researchType,
        }),
      })

      if (response.ok) {
        store.closeModal('editProject')
        refresh()
        alert('프로젝트가 수정되었습니다.')
      } else {
        alert('프로젝트 수정에 실패했습니다.')
      }
    } catch (error) {
      logger.error('프로젝트 수정 실패:', error)
      alert('프로젝트 수정 중 오류가 발생했습니다.')
    } finally {
      store.setLoading('updating', false)
    }
  }

  async function deleteProject() {
    if (!selectedProject?.id) return
    if (store.selected.deleteCode !== selectedProject.code) {
      alert('프로젝트 코드가 일치하지 않습니다.')
      return
    }

    try {
      store.setLoading('deleting', true)

      const response = await fetch(`/api/project-management/projects/${selectedProject.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        store.closeModal('deleteConfirm')
        refresh()
        alert('프로젝트가 삭제되었습니다.')
      } else {
        alert('프로젝트 삭제에 실패했습니다.')
      }
    } catch (error) {
      logger.error('프로젝트 삭제 실패:', error)
      alert('프로젝트 삭제 중 오류가 발생했습니다.')
    } finally {
      store.setLoading('deleting', false)
    }
  }

  // ============================================================================
  // Budget Functions (Funding - 1단계)
  // ============================================================================

  function openBudgetModal() {
    store.selected.budget = null
    store.resetForm('budget')

    // 다음 연차 번호 계산
    if (projectBudgets.length > 0) {
      const maxPeriod = Math.max(
        ...projectBudgets.map((b: any) => budgetUtilsImported.getPeriodNumber(b)),
      )
      store.forms.budget.periodNumber = maxPeriod + 1
    } else {
      store.forms.budget.periodNumber = 1
    }

    store.openModal('budget')
  }

  function openRestoreModal(budget: any) {
    store.selected.budgetForRestore = budget
    store.resetForm('restore')
    store.openModal('restore')
  }

  async function restoreResearchCosts() {
    if (!store.selected.budgetForRestore) return

    try {
      const response = await fetch(
        `/api/project-management/project-budgets/${store.selected.budgetForRestore.id}/restore-research-costs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personnelCostCash: Number(store.forms.restore.personnelCostCash || 0) * 1000,
            personnelCostInKind: Number(store.forms.restore.personnelCostInKind || 0) * 1000,
            researchMaterialCostCash:
              Number(store.forms.restore.researchMaterialCostCash || 0) * 1000,
            researchMaterialCostInKind:
              Number(store.forms.restore.researchMaterialCostInKind || 0) * 1000,
            researchActivityCostCash:
              Number(store.forms.restore.researchActivityCostCash || 0) * 1000,
            researchActivityCostInKind:
              Number(store.forms.restore.researchActivityCostInKind || 0) * 1000,
            researchStipendCash: Number(store.forms.restore.researchStipendCash || 0) * 1000,
            researchStipendInKind: Number(store.forms.restore.researchStipendInKind || 0) * 1000,
            indirectCostCash: Number(store.forms.restore.indirectCostCash || 0) * 1000,
            indirectCostInKind: Number(store.forms.restore.indirectCostInKind || 0) * 1000,
            restoreReason: store.forms.restore.restoreReason,
          }),
        },
      )

      if (response.ok) {
        const result = await response.json()
        store.closeModal('restore')
        store.selected.budgetForRestore = null
        await funding.loadBudgets()
        store.incrementBudgetRefresh()
        refresh()
        alert(result.message || '연구개발비가 성공적으로 복구되었습니다.')
      } else {
        const errorData = await response.json()
        alert(`연구개발비 복구 실패: ${errorData.message || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error) {
      logger.error('연구개발비 복구 실패:', error)
      alert('연구개발비 복구 중 오류가 발생했습니다.')
    }
  }

  // ============================================================================
  // Member Functions (Planning - 2단계)
  // ============================================================================
  // Direct delegation to planning hook

  // ============================================================================
  // Evidence Functions (Execution - 3단계)
  // ============================================================================
  // Direct delegation to execution hook

  // ============================================================================
  // Utility Functions for Template
  // ============================================================================

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

  // ============================================================================
  // Watch external project change
  // ============================================================================

  $effect(() => {
    if (selectedProject?.id) {
      updateProjectPeriod()
    }
  })

  // ============================================================================
  // Additional Helper Functions
  // ============================================================================

  function initProjectForm() {
    if (selectedProject) {
      store.forms.project = {
        title: selectedProject.title || '',
        code: projectUtilsImported.getProjectCode(selectedProject),
        description: projectUtilsImported.getProjectDescription(selectedProject),
        status: projectUtilsImported.getProjectStatus(selectedProject),
        sponsorType: projectUtilsImported.getProjectSponsorType(selectedProject),
        priority: selectedProject.priority || 'medium',
        researchType: selectedProject.research_type || selectedProject.researchType || 'applied',
      }
    }
  }

  async function updateMonthlyAmount() {
    if (
      !store.forms.member.employeeId ||
      !store.forms.member.participationRate ||
      !store.forms.member.startDate ||
      !store.forms.member.endDate
    ) {
      store.ui.calculatedMonthlyAmount = 0
      return
    }

    // 날짜가 변경되면 참여개월수도 자동으로 재계산
    const calculatedMonths = calculationUtilsImported.calculatePeriodMonths(
      store.forms.member.startDate,
      store.forms.member.endDate,
    )
    store.forms.member.participationMonths = calculatedMonths

    // 사용자가 수동으로 월간금액을 입력한 경우 자동 계산하지 않음
    if (store.ui.isManualMonthlyAmount) {
      store.ui.calculatedMonthlyAmount = dataTransformers.safeStringToNumber(
        store.forms.member.monthlyAmount,
        0,
      )
      return
    }

    try {
      const formattedStartDate = calculationUtilsImported.convertDateToISO(
        store.forms.member.startDate,
      )
      const formattedEndDate = calculationUtilsImported.convertDateToISO(store.forms.member.endDate)

      const calculatedAmount = await calculationUtilsImported.calculateMonthlyAmountFromContract(
        store.forms.member.employeeId,
        store.forms.member.participationRate,
        formattedStartDate,
        formattedEndDate,
      )

      logger.log('계산된 월간금액:', calculatedAmount)
      store.ui.calculatedMonthlyAmount = calculatedAmount
      store.forms.member.monthlyAmount = dataTransformers.safeNumberToString(calculatedAmount)
    } catch (error) {
      logger.error('월간금액 계산 중 오류:', error)
      store.ui.calculatedMonthlyAmount = 0
    }
  }

  async function validateEvidenceRegistration() {
    if (
      !store.forms.newEvidence.assigneeId ||
      !store.forms.newEvidence.dueDate ||
      !store.selected.budgetForEvidence?.id
    ) {
      store.validation.evidence = null
      return
    }

    const selectedCategory = store.validation.categories.find(
      (cat) => cat.id === store.forms.newEvidence.categoryId,
    )
    if (selectedCategory?.name !== '인건비') {
      store.validation.evidence = null
      return
    }

    try {
      store.setLoading('validatingEvidence', true)

      const response = await fetch(
        `/api/project-management/evidence-items/validate-employment?budgetId=${store.selected.budgetForEvidence.id}&assigneeId=${store.forms.newEvidence.assigneeId}&dueDate=${store.forms.newEvidence.dueDate}`,
      )

      if (response.ok) {
        const result = await response.json()
        store.validation.evidence = result.data
      }
    } catch (error) {
      logger.error('증빙 등록 검증 실패:', error)
    } finally {
      store.setLoading('validatingEvidence', false)
    }
  }

  function cancelBudgetUpdate() {
    store.closeModal('budgetUpdateConfirm')
    store.selected.budgetUpdateData = null
  }

  function confirmBudgetUpdate() {
    funding.updateBudget()
  }
</script>

{#if selectedProject}
  <div class="space-y-6">
    <!-- 프로젝트 기본 정보 -->
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
          <ThemeButton
            variant="primary"
            size="sm"
            onclick={() => {
              initProjectForm()
              modalStates.editProject = true
            }}
          >
            <EditIcon size={16} class="mr-2" />
            정보 수정
          </ThemeButton>
          <ThemeButton variant="primary" size="sm" onclick={() => dispatch('show-budget-modal')}>
            <DollarSignIcon size={16} class="mr-2" />
            예산 수정
          </ThemeButton>
          <ThemeButton variant="error" size="sm" onclick={() => (modalStates.deleteConfirm = true)}>
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
            refreshTrigger={uiStates.budgetRefreshTrigger}
          />
        {:catch _error}
          <div class="text-center py-4 text-gray-500">
            <p class="text-sm">예산 정보를 불러올 수 없습니다.</p>
          </div>
        {/await}
      </div>
    </ThemeCard>

    <!-- 연차별 사업비 관리 -->
    <ThemeCard class="p-6">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900">연구개발비</h3>
      </div>

      <!-- 단위 안내 -->
      <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            <span class="font-medium">금액 단위: 천원</span>
            <span class="ml-4 text-gray-600"> (현금) | (현물) </span>
          </div>
          <div class="text-xs text-gray-600">예: 1,000 = 1,000천원</div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-gray-200" style:min-width="100%">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                >연차</th
              >
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>인건비</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>연구재료비</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>연구활동비</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>연구수당</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>간접비</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>총 예산</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                >액션</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#key uiStates.budgetUpdateKey}
              {#each projectBudgets as budget, i (budget.id || i)}
                {@const _totalBudget =
                  budgetUtilsImported.getPersonnelCostCash(budget) +
                  budgetUtilsImported.getPersonnelCostInKind(budget) +
                  budgetUtilsImported.getResearchMaterialCostCash(budget) +
                  budgetUtilsImported.getResearchMaterialCostInKind(budget) +
                  budgetUtilsImported.getResearchActivityCostCash(budget) +
                  budgetUtilsImported.getResearchActivityCostInKind(budget) +
                  budgetUtilsImported.getResearchStipendCash(budget) +
                  budgetUtilsImported.getResearchStipendInKind(budget) +
                  budgetUtilsImported.getIndirectCostCash(budget) +
                  budgetUtilsImported.getIndirectCostInKind(budget)}
                {@const personnelCash =
                  Number(budgetUtilsImported.getPersonnelCostCash(budget)) || 0}
                {@const materialCash =
                  Number(budgetUtilsImported.getResearchMaterialCostCash(budget)) || 0}
                {@const activityCash =
                  Number(budgetUtilsImported.getResearchActivityCostCash(budget)) || 0}
                {@const stipendCash =
                  Number(budgetUtilsImported.getResearchStipendCash(budget)) || 0}
                {@const indirectCash = Number(budgetUtilsImported.getIndirectCostCash(budget)) || 0}
                {@const cashTotal =
                  personnelCash + materialCash + activityCash + stipendCash + indirectCash}
                {@const personnelInKind =
                  Number(budgetUtilsImported.getPersonnelCostInKind(budget)) || 0}
                {@const materialInKind =
                  Number(budgetUtilsImported.getResearchMaterialCostInKind(budget)) || 0}
                {@const activityInKind =
                  Number(budgetUtilsImported.getResearchActivityCostInKind(budget)) || 0}
                {@const stipendInKind =
                  Number(budgetUtilsImported.getResearchStipendInKind(budget)) || 0}
                {@const indirectInKind =
                  Number(budgetUtilsImported.getIndirectCostInKind(budget)) || 0}
                {@const inKindTotal =
                  personnelInKind +
                  materialInKind +
                  activityInKind +
                  stipendInKind +
                  indirectInKind}
                {@const mismatchInfo = calculationUtilsImported.checkBudgetMismatch(
                  budget,
                  projectBudgets,
                  selectedItems.evidencePeriod,
                )}
                <tr
                  class="hover:bg-gray-50 {mismatchInfo?.hasMismatch
                    ? 'bg-red-50 border-l-4 border-red-400'
                    : ''}"
                >
                  <!-- 연차 -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-24">
                    <div
                      class="text-sm cursor-help"
                      title={budgetUtilsImported.formatPeriodTooltip(budget)}
                    >
                      <div class="flex items-center gap-2">
                        <span class="font-medium"
                          >{budgetUtilsImported.formatPeriodDisplay(budget)}</span
                        >
                        {#if mismatchInfo?.hasMismatch}
                          <span
                            class="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded font-medium"
                          >
                            !
                          </span>
                        {/if}
                      </div>
                      <div class="text-xs text-gray-500 mt-1">현금 | 현물</div>
                    </div>
                  </td>
                  <!-- 인건비 (현금/현물) -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-medium">
                        {formatCurrency(personnelCash, false)}
                      </div>
                      <div class="text-sm text-gray-600">
                        {formatCurrency(personnelInKind, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 연구재료비 (현금/현물) -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-medium">
                        {formatCurrency(materialCash, false)}
                      </div>
                      <div class="text-sm text-gray-600">
                        {formatCurrency(materialInKind, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 연구활동비 (현금/현물) -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-medium">
                        {formatCurrency(activityCash, false)}
                      </div>
                      <div class="text-sm text-gray-600">
                        {formatCurrency(activityInKind, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 연구수당 (현금/현물) -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-medium">
                        {formatCurrency(stipendCash, false)}
                      </div>
                      <div class="text-sm text-gray-600">
                        {formatCurrency(stipendInKind, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 간접비 (현금/현물) -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-medium">
                        {formatCurrency(indirectCash, false)}
                      </div>
                      <div class="text-sm text-gray-600">
                        {formatCurrency(indirectInKind, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 총 예산 (현금/현물) -->
                  <td
                    class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right"
                  >
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-semibold">
                        {formatCurrency(cashTotal, false)}
                      </div>
                      <div class="text-sm text-gray-600 font-semibold">
                        {formatCurrency(inKindTotal, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 액션 -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm font-medium w-32">
                    <div class="flex space-x-1 justify-center">
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => funding.editBudget(budget)}
                      >
                        <EditIcon size={16} class="text-blue-600 mr-1" />
                        수정
                      </ThemeButton>
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => funding.removeBudget(budget.id)}
                      >
                        <TrashIcon size={16} class="text-red-600 mr-1" />
                        삭제
                      </ThemeButton>
                    </div>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="7" class="px-4 py-12 text-center text-gray-500">
                    <DollarSignIcon size={48} class="mx-auto mb-2 text-gray-300" />
                    <p>등록된 사업비가 없습니다.</p>
                  </td>
                </tr>
              {/each}
            {/key}

            <!-- 합계 행 -->
            {#if projectBudgets && projectBudgets.length > 0}
              {@const totals = calculationUtilsImported.calculateBudgetTotals(projectBudgets)}
              <tr class="bg-gray-100 border-t-2 border-gray-300">
                <!-- 연차 -->
                <td class="px-6 py-6 whitespace-nowrap text-sm text-gray-900 w-24">
                  <div class="text-center">
                    <div class="font-medium">합계</div>
                    <div class="text-xs text-gray-600">
                      {projectBudgets.length}개 연차
                    </div>
                  </div>
                </td>
                <!-- 인건비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.personnelCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.personnelInKind, false)}
                    </div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">
                      소계: {formatCurrency(
                        (totals.personnelCash || 0) + (totals.personnelInKind || 0),
                        false,
                      )}
                    </div>
                  </div>
                </td>
                <!-- 연구재료비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.researchMaterialCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.researchMaterialInKind, false)}
                    </div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">
                      소계: {formatCurrency(
                        (totals.researchMaterialCash || 0) + (totals.researchMaterialInKind || 0),
                        false,
                      )}
                    </div>
                  </div>
                </td>
                <!-- 연구활동비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.researchActivityCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.researchActivityInKind, false)}
                    </div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">
                      소계: {formatCurrency(
                        (totals.researchActivityCash || 0) + (totals.researchActivityInKind || 0),
                        false,
                      )}
                    </div>
                  </div>
                </td>
                <!-- 연구수당 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.researchStipendCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.researchStipendInKind, false)}
                    </div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">
                      소계: {formatCurrency(
                        (totals.researchStipendCash || 0) + (totals.researchStipendInKind || 0),
                        false,
                      )}
                    </div>
                  </div>
                </td>
                <!-- 간접비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.indirectCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.indirectInKind, false)}
                    </div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">
                      소계: {formatCurrency(
                        (totals.indirectCash || 0) + (totals.indirectInKind || 0),
                        false,
                      )}
                    </div>
                  </div>
                </td>
                <!-- 총 예산 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.totalCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.totalInKind, false)}
                    </div>
                    <div class="text-base text-gray-900 font-bold border-t-2 pt-2">
                      총계: {formatCurrency(totals.totalBudget, false)}
                    </div>
                  </div>
                </td>
                <!-- 액션 -->
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium w-32">
                  <div class="text-sm text-gray-500 text-center">-</div>
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>

      <!-- 불일치 경고 섹션 -->
      {#if projectBudgets.some((budget) => calculationUtilsImported.checkBudgetMismatch(budget, projectBudgets, selectedItems.evidencePeriod)?.hasMismatch)}
        <div class="mt-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
          <div class="text-sm text-red-700">
            <span class="font-medium">!</span>
            다음 연차의 예산과 연구개발비가 일치하지 않습니다:
            <div class="mt-2 space-y-1">
              {#each projectBudgets.filter((budget) => calculationUtilsImported.checkBudgetMismatch(budget, projectBudgets, selectedItems.evidencePeriod)?.hasMismatch) as budget}
                {@const mismatchInfo = calculationUtilsImported.checkBudgetMismatch(
                  budget,
                  projectBudgets,
                  selectedItems.evidencePeriod,
                )}
                <div class="text-xs text-red-600">
                  {budgetUtilsImported.formatPeriodDisplay(budget)}: 예산 {formatNumber(
                    mismatchInfo?.annualBudgetTotal || 0,
                    true,
                  )} vs 연구개발비 {formatNumber(mismatchInfo?.researchCostTotal || 0, true)}
                  <div class="ml-2 mt-1 text-gray-500">
                    현금: {formatNumber(mismatchInfo?.annualBudgetCash || 0, true)} vs {formatNumber(
                      mismatchInfo?.researchCostCash || 0,
                      true,
                    )}
                  </div>
                  <div class="ml-2 text-gray-500">
                    현물: {formatNumber(mismatchInfo?.annualBudgetInKind || 0, true)} vs {formatNumber(
                      mismatchInfo?.researchCostInKind || 0,
                      true,
                    )}
                  </div>
                </div>
              {/each}
            </div>
            <div class="mt-2 text-xs text-red-600 font-medium">
              해당 연차의 연구개발비를 수정해주세요.
            </div>
          </div>
        </div>
      {/if}
    </ThemeCard>
  </div>

  <!-- 사업비 추가/편집 모달 -->
  <ProjectBudgetModal
    bind:open={modalStates.budget}
    editingBudget={selectedItems.budget}
    budgetForm={forms.budget}
    onclose={() => {
      modalStates.budget = false
      selectedItems.budget = null
      forms.budget = {
        periodNumber: 1,
        startDate: '',
        endDate: '',
        personnelCostCash: '',
        researchMaterialCostCash: '',
        researchActivityCostCash: '',
        researchStipendCash: '',
        indirectCostCash: '',
        personnelCostInKind: '',
        researchMaterialCostInKind: '',
        researchActivityCostInKind: '',
        researchStipendInKind: '',
        indirectCostInKind: '',
      }
    }}
    onsubmit={async () =>
      selectedItems.budget ? await funding.updateBudget() : await funding.addBudget()}
    oncancel={() => {
      modalStates.budget = false
      selectedItems.budget = null
      forms.budget = {
        periodNumber: 1,
        startDate: '',
        endDate: '',
        personnelCostCash: '',
        researchMaterialCostCash: '',
        researchActivityCostCash: '',
        researchStipendCash: '',
        indirectCostCash: '',
        personnelCostInKind: '',
        researchMaterialCostInKind: '',
        researchActivityCostInKind: '',
        researchStipendInKind: '',
        indirectCostInKind: '',
      }
    }}
    {formatNumber}
    handleNumberInput={(e, callback) =>
      calculationUtilsImported.handleNumberInput(e, callback, formatNumber)}
  />

  <!-- 연구원 추가 폼 카드 -->
  <ProjectMemberForm
    bind:visible={loadingStates.addingMember}
    memberForm={forms.member}
    bind:isManualMonthlyAmount={uiStates.isManualMonthlyAmount}
    {availableEmployees}
    {formatNumber}
    oncancel={planning.cancelAddMember}
    onsubmit={planning.addMember}
    onupdateMonthlyAmount={updateMonthlyAmount}
  />

  <!-- 프로젝트 멤버 관리 -->
  <ThemeCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">참여연구원</h3>
      <div class="flex items-center gap-2">
        <ThemeButton
          onclick={planning.startAddMember}
          size="sm"
          disabled={loadingStates.addingMember || selectedItems.member !== null}
        >
          <PlusIcon size={16} class="mr-2" />
          연구원 추가
        </ThemeButton>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
              >이름</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40"
              >기간</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
              >참여개월수</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
              >계약월급여</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
              >참여율</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
              >현금</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
              >현물</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40"
              >액션</th
            >
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each projectMembers as member, i (i)}
            <tr
              class="hover:bg-gray-50 {selectedItems.member && selectedItems.member.id === member.id
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 shadow-sm'
                : ''}"
            >
              <!-- 이름 -->
              <td class="px-4 py-4 whitespace-nowrap w-48">
                <div class="flex items-center">
                  <UserIcon size={20} class="text-gray-400 mr-2" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <div class="text-sm font-medium text-gray-900 truncate">
                        {member.employee_name ||
                          memberUtilsImported.formatKoreanName(
                            memberUtilsImported.getMemberEmployeeName(member),
                          )}
                      </div>
                      <ThemeBadge variant="info" size="sm">{member.role}</ThemeBadge>
                    </div>
                    <div class="text-xs text-gray-500 truncate">
                      {member.employee_department || member.employeeDepartment} / {member.employee_position ||
                        member.employeePosition}
                    </div>
                  </div>
                </div>
              </td>

              <!-- 기간 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-40">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-medium text-blue-700 w-8">시작:</span>
                      <input
                        type="date"
                        bind:value={forms.member.startDate}
                        class="flex-1 px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        onchange={() => {
                          uiStates.isManualMonthlyAmount = false
                          updateMonthlyAmount()
                        }}
                      />
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-medium text-blue-700 w-8">종료:</span>
                      <input
                        type="date"
                        bind:value={forms.member.endDate}
                        class="flex-1 px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        onchange={() => {
                          uiStates.isManualMonthlyAmount = false
                          updateMonthlyAmount()
                        }}
                      />
                    </div>
                  </div>
                {:else}
                  <div class="space-y-1">
                    <div class="text-xs text-gray-600">
                      {formatDate(memberUtilsImported.getMemberStartDate(member))}
                    </div>
                    <div class="text-xs text-gray-600">
                      {formatDate(memberUtilsImported.getMemberEndDate(member))}
                    </div>
                  </div>
                {/if}
              </td>

              <!-- 참여개월수 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-24 text-center">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <input
                    type="number"
                    value={forms.member.participationMonths ||
                      calculationUtilsImported.calculatePeriodMonths(
                        memberUtilsImported.getMemberStartDate(member),
                        memberUtilsImported.getMemberEndDate(member),
                      )}
                    oninput={(e) => {
                      const value = parseInt(e.currentTarget.value) || 0
                      forms.member.participationMonths = value
                    }}
                    class="w-16 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-center"
                    min="1"
                    max="120"
                  />
                {:else}
                  {member.participationMonths ||
                    calculationUtilsImported.calculatePeriodMonths(
                      memberUtilsImported.getMemberStartDate(member),
                      memberUtilsImported.getMemberEndDate(member),
                    )}개월
                {/if}
              </td>

              <!-- 계약월급여 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 text-right">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <input
                    type="text"
                    value={formatNumber(forms.member.contractMonthlySalary, false)}
                    oninput={(e) => {
                      const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
                      forms.member.contractMonthlySalary = rawValue || '0'
                      e.currentTarget.value = formatNumber(rawValue, false)

                      // 계약월급여 변경 시 현금/현물 자동 계산
                      const participationMonths =
                        forms.member.participationMonths ||
                        calculationUtilsImported.calculatePeriodMonths(
                          forms.member.startDate,
                          forms.member.endDate,
                        )

                      // 총 금액 계산 (Utils 사용)
                      const totalAmount = dataTransformers.calculateMemberContribution(
                        rawValue,
                        forms.member.participationRate,
                        participationMonths,
                      )

                      // 현금/현물 자동 분배 (Utils 사용)
                      const distributed = dataTransformers.distributeMemberAmount(
                        totalAmount,
                        forms.member.cashAmount,
                        forms.member.inKindAmount,
                      )
                      forms.member.cashAmount = distributed.cashAmount
                      forms.member.inKindAmount = distributed.inKindAmount
                    }}
                    class="w-24 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                    placeholder="0"
                  />
                {:else}
                  {formatNumber(
                    calculationUtilsImported.calculateContractMonthlySalary(member),
                    true,
                  )}
                {/if}
              </td>

              <!-- 참여율 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-24">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <div class="relative">
                    <input
                      type="number"
                      bind:value={forms.member.participationRate}
                      class="w-16 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      min="0"
                      max="100"
                      step="0.1"
                      onchange={() => {
                        uiStates.isManualMonthlyAmount = false
                        updateMonthlyAmount()
                      }}
                    />
                    <span
                      class="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none"
                      >%</span
                    >
                  </div>
                {:else}
                  <div class="text-center">
                    {member.participation_rate || member.participationRate || 0}%
                  </div>
                {/if}
              </td>

              <!-- 현금 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 text-right">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <input
                    type="text"
                    value={formatNumber(forms.member.cashAmount || '0', false)}
                    oninput={(e) => {
                      const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
                      forms.member.cashAmount = rawValue || '0'
                      e.currentTarget.value = formatNumber(rawValue, false)
                    }}
                    class="w-24 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                    placeholder="0"
                  />
                {:else}
                  {formatNumber(
                    dataTransformers.safeStringToNumber(
                      dataTransformers.extractCashAmount(member),
                      0,
                    ),
                    true,
                  )}
                {/if}
              </td>

              <!-- 현물 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 text-right">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <input
                    type="text"
                    value={formatNumber(forms.member.inKindAmount || '0', false)}
                    oninput={(e) => {
                      const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
                      forms.member.inKindAmount = rawValue || '0'
                      e.currentTarget.value = formatNumber(rawValue, false)
                    }}
                    class="w-24 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                    placeholder="0"
                  />
                {:else}
                  {formatNumber(
                    dataTransformers.safeStringToNumber(
                      dataTransformers.extractInKindAmount(member),
                      0,
                    ),
                    true,
                  )}
                {/if}
              </td>
              <!-- 검증 상태 칼럼 제거 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex space-x-1 justify-center">
                  {#if selectedItems.member && selectedItems.member.id === member.id}
                    <div class="flex space-x-1">
                      <button
                        type="button"
                        onclick={planning.updateMember}
                        class="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 shadow-sm"
                        title="저장"
                      >
                        <CheckIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onclick={planning.cancelEditMember}
                        class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 shadow-sm"
                        title="취소"
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  {:else}
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => planning.editMember(member)}
                      disabled={selectedItems.member !== null}
                    >
                      <EditIcon size={16} class="text-blue-600 mr-1" />
                      수정
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => planning.removeMember(member.id)}
                      disabled={selectedItems.member !== null}
                    >
                      <TrashIcon size={16} class="text-red-600 mr-1" />
                      삭제
                    </ThemeButton>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}

          {#if projectMembers.length === 0 && !loadingStates.addingMember}
            <tr>
              <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                <UsersIcon size={48} class="mx-auto mb-2 text-gray-300" />
                <p>참여 연구원이 없습니다.</p>
              </td>
            </tr>
          {/if}

          <!-- 합계 행 -->
          {#if projectMembers.length > 0}
            {@const totals = calculationUtilsImported.calculateTableTotals(projectMembers)}
            <tr class="bg-gray-50 border-t-2 border-gray-300">
              <td class="px-4 py-3 text-sm font-semibold text-gray-900" colspan="5">
                <div class="flex items-center">
                  <div class="text-sm font-bold text-gray-800">합계</div>
                </div>
              </td>

              <!-- 현금 합계 -->
              <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                {formatNumber(totals.totalCashAmount, true)}
              </td>

              <!-- 현물 합계 -->
              <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                {formatNumber(totals.totalInKindAmount, true)}
              </td>

              <!-- 액션 (합계 행에는 없음) -->
              <td class="px-4 py-3 text-sm text-gray-500">
                <div class="text-center">-</div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </ThemeCard>

  <!-- 증빙 관리 -->
  <ThemeCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <h3 class="text-lg font-semibold text-gray-900">증빙 관리</h3>
        {#if projectBudgets.length > 0}
          <select
            bind:value={selectedItems.evidencePeriod}
            class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each projectBudgets as budget, i (i)}
              <option value={budgetUtilsImported.getPeriodNumber(budget)}>
                {budgetUtilsImported.formatPeriodDisplay(budget)}
              </option>
            {/each}
          </select>
        {/if}
      </div>
      <ThemeButton onclick={() => (modalStates.evidence = true)} size="sm">
        <PlusIcon size={16} class="mr-2" />
        증빙 추가
      </ThemeButton>
    </div>

    {#if projectBudgets.length > 0}
      {@const currentBudget =
        projectBudgets.find(
          (b) => budgetUtilsImported.getPeriodNumber(b) === selectedItems.evidencePeriod,
        ) || projectBudgets[0]}
      {@const budgetCategories = dataTransformers.transformBudgetToCategories(currentBudget)}

      {#if loadingStates.loadingEvidence}
        <div class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          ></div>
          <p class="mt-2 text-sm text-gray-500">증빙 데이터를 로드하는 중...</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each budgetCategories as budgetCategory, i (i)}
            {@const categoryItems = validationData.items.filter(
              (item) => item.category_name === budgetCategory.name,
            )}
            {@const totalAmount = budgetCategory.cash + budgetCategory.inKind}
            {@const totalItems = categoryItems.length}
            {@const completedItems = categoryItems.filter(
              (item) => item.status === 'completed',
            ).length}
            {@const inProgressItems = categoryItems.filter(
              (item) => item.status === 'in_progress',
            ).length}
            {@const overallProgress =
              totalItems > 0 ? Math.floor((completedItems / totalItems) * 100) : 0}

            <div class="border border-gray-200 rounded-lg">
              <!-- 카테고리 헤더 -->
              <button
                type="button"
                class="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 w-full text-left"
                onclick={() =>
                  (uiStates.expandedEvidenceSections[budgetCategory.type] =
                    !uiStates.expandedEvidenceSections[budgetCategory.type])}
                onkeydown={(e) =>
                  e.key === 'Enter' &&
                  (uiStates.expandedEvidenceSections[budgetCategory.type] =
                    !uiStates.expandedEvidenceSections[budgetCategory.type])}
              >
                <div class="flex items-center space-x-3">
                  {#if uiStates.expandedEvidenceSections[budgetCategory.type]}
                    <ChevronDownIcon size={16} class="text-gray-500" />
                  {:else}
                    <ChevronRightIcon size={16} class="text-gray-500" />
                  {/if}
                  <div>
                    <h4 class="text-md font-medium text-gray-900">
                      {budgetCategory.name}
                    </h4>
                    <div class="text-xs text-gray-500">
                      예산: {formatCurrency(totalAmount)} | 증빙: {totalItems}개 | 완료: {completedItems}개
                      | 진행중: {inProgressItems}개
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  <div class="flex items-center">
                    <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        class="h-2 rounded-full {overallProgress >= 100
                          ? 'bg-green-600'
                          : overallProgress >= 70
                            ? 'bg-blue-600'
                            : overallProgress >= 30
                              ? 'bg-yellow-500'
                              : 'bg-red-500'}"
                        style:width="{Math.min(overallProgress, 100)}%"
                      ></div>
                    </div>
                    <span class="text-xs text-gray-600">{overallProgress}%</span>
                  </div>
                  <ThemeButton
                    variant="ghost"
                    size="sm"
                    onclick={() => execution.openEvidenceDetail(budgetCategory)}
                  >
                    <PlusIcon size={14} class="mr-1" />
                    추가
                  </ThemeButton>
                </div>
              </button>

              <!-- 카테고리 내용 -->
              {#if uiStates.expandedEvidenceSections[budgetCategory.type]}
                <div class="p-4 border-t border-gray-200">
                  {#if categoryItems.length > 0}
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                          <tr>
                            <th
                              class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
                              >증빙 항목</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                              >금액</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                              >담당자</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                              >진행률</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                              >마감일</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                              >상태</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                              >액션</th
                            >
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          {#each categoryItems as item, i (i)}
                            {@const isOverdue =
                              new Date(item.due_date) < new Date() && item.status !== 'completed'}
                            <tr class="hover:bg-gray-50">
                              <!-- 증빙 항목 -->
                              <td
                                class="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900"
                              >
                                {item.name}
                              </td>

                              <!-- 금액 -->
                              <td
                                class="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center"
                              >
                                <span class="font-medium">{formatCurrency(item.budget_amount)}</span
                                >
                              </td>

                              <!-- 담당자 -->
                              <td
                                class="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center"
                              >
                                <span class="text-gray-600"
                                  >{memberUtilsImported.formatAssigneeNameFromFields(item)}</span
                                >
                              </td>

                              <!-- 진행률 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                                <div class="flex items-center">
                                  <div class="w-12 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      class="h-2 rounded-full {item.progress >= 100
                                        ? 'bg-green-600'
                                        : item.progress >= 70
                                          ? 'bg-blue-600'
                                          : item.progress >= 30
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'}"
                                      style:width="{Math.min(item.progress, 100)}%"
                                    ></div>
                                  </div>
                                  <span class="text-xs text-gray-600">{item.progress}%</span>
                                </div>
                              </td>

                              <!-- 마감일 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-center">
                                <span
                                  class="text-xs {isOverdue
                                    ? 'text-red-600 font-medium'
                                    : 'text-gray-600'}"
                                >
                                  {item.due_date ? formatDate(item.due_date) : '-'}
                                </span>
                              </td>

                              <!-- 상태 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-center">
                                <span
                                  class="px-2 py-1 text-xs font-medium rounded-full {item.status ===
                                  'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : item.status === 'planned'
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-yellow-100 text-yellow-800'}"
                                >
                                  {item.status === 'completed'
                                    ? '완료'
                                    : item.status === 'in_progress'
                                      ? '진행중'
                                      : item.status === 'planned'
                                        ? '계획'
                                        : '검토중'}
                                </span>
                              </td>

                              <!-- 액션 -->
                              <td
                                class="px-3 py-3 whitespace-nowrap text-sm font-medium text-center"
                              >
                                <div class="flex space-x-1 justify-center">
                                  <ThemeButton
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => execution.openEvidenceDetail(item)}
                                  >
                                    <EditIcon size={12} class="mr-1" />
                                    상세
                                  </ThemeButton>
                                </div>
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {:else}
                    <div class="text-center py-8 text-gray-500">
                      <FileTextIcon size={48} class="mx-auto mb-2 text-gray-300" />
                      <p>등록된 증빙 항목이 없습니다.</p>
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        class="mt-2"
                        onclick={() => execution.openEvidenceDetail(budgetCategory)}
                      >
                        <PlusIcon size={14} class="mr-1" />
                        첫 번째 증빙 추가
                      </ThemeButton>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="text-center py-8 text-gray-500">
        <FileTextIcon size={48} class="mx-auto mb-2 text-gray-300" />
        <p>등록된 사업비가 없어 증빙을 관리할 수 없습니다.</p>
      </div>
    {/if}
  </ThemeCard>

  <!-- 증빙 상세 모달 -->
  <EvidenceDetailModal
    bind:visible={modalStates.evidenceDetail}
    selectedItem={selectedItems.evidenceItem}
    {formatCurrency}
    {formatDate}
    onclose={() => (modalStates.evidenceDetail = false)}
  />

  <!-- 증빙 추가 모달 -->
  <EvidenceAddModal
    bind:visible={modalStates.evidence}
    evidenceForm={forms.newEvidence}
    evidenceCategories={validationData.categories}
    {availableEmployees}
    isValidatingEvidence={loadingStates.validatingEvidence}
    evidenceValidation={validationData.evidence}
    isUpdating={loadingStates.updating}
    onclose={() => (modalStates.evidence = false)}
    onvalidate={validateEvidenceRegistration}
    onsubmit={execution.handleAddEvidenceItem}
  />

  <!-- 프로젝트 수정 모달 -->
  <ProjectEditModal
    bind:visible={modalStates.editProject}
    projectForm={forms.project}
    isUpdating={loadingStates.updating}
    onclose={() => (modalStates.editProject = false)}
    onupdate={updateProject}
  />

  <!-- 프로젝트 삭제 확인 모달 -->
  <ProjectDeleteConfirmModal
    bind:open={modalStates.deleteConfirm}
    onclose={() => {
      modalStates.deleteConfirm = false
      selectedItems.deleteCode = ''
    }}
    project={selectedProject}
    projectCode={selectedProject?.code || ''}
    deleteConfirmationCode={selectedItems.deleteCode}
    membersCount={projectMembers.length}
    budgetsCount={projectBudgets.length}
    isDeleting={loadingStates.deleting}
    onConfirm={deleteProject}
  />

  <!-- 검증 결과 모달 -->
  <ValidationResultModal
    bind:open={modalStates.validation}
    onclose={() => (modalStates.validation = false)}
    validationResults={validationData.results}
  />

  <!-- 예산 수정 확인 모달 -->
  <BudgetUpdateConfirmModal
    bind:open={modalStates.budgetUpdateConfirm}
    onclose={cancelBudgetUpdate}
    validationData={selectedItems.budgetUpdateData}
    onConfirm={confirmBudgetUpdate}
    onCancel={cancelBudgetUpdate}
  />
{/if}
