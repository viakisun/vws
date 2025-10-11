<script lang="ts">
  import { pushToast } from '$lib/stores/toasts'
  /**
   * ProjectDetailView - Orchestrator Component
   *
   * 1단계: Budget Funding (예산 조달) - funding.*
   * 2단계: Budget Planning (예산 계획) - planning.*
   * 3단계: Budget Execution (예산 집행) - execution.*
   */

  import { useActiveEmployees } from '$lib/hooks/employee/useActiveEmployees.svelte'
  import { logger } from '$lib/utils/logger'
  import { PencilIcon } from 'lucide-svelte'
  import { createEventDispatcher, onMount } from 'svelte'
  import { useRDDetail } from './hooks/useRDDetail.svelte'
  // Sub-components
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import RDEvidenceManagement from './RDEvidenceManagement.svelte'
  import RDExecutionPlan from './RDExecutionPlan.svelte'
  import RDProjectMemberTable from './RDProjectMemberTable.svelte'
  // Modal Components
  import RDBudgetUpdateConfirmModal from './RDBudgetUpdateConfirmModal.svelte'
  import RDEvidenceAddModal from './RDEvidenceAddModal.svelte'
  import RDEvidenceDetailModal from './RDEvidenceDetailModal.svelte'
  import RDProjectBudgetModal from './RDProjectBudgetModal.svelte'
  import RDProjectDeleteConfirmModal from './RDProjectDeleteConfirmModal.svelte'
  import RDProjectEditModal from './RDProjectEditModal.svelte'
  import RDProjectMemberForm from './RDProjectMemberForm.svelte'
  import RDValidationResultModal from './RDValidationResultModal.svelte'
  // Utility functions
  import { formatDate, formatNumber } from '$lib/utils/format'
  import * as calculationUtilsImported from './utils/rd-calculation-utils'
  import * as dataTransformers from './utils/rd-data-transformers'
  import { formatRDCurrency } from './utils/rd-format-utils'
  import * as projectUtilsImported from './utils/rd-project-utils'
  import {
    getRDPriorityColor,
    getRDPriorityText,
    getRDResearchTypeText,
    getRDSponsorTypeText,
    getRDStatusColor,
    getRDStatusText,
  } from './utils/rd-status-utils'

  // ============================================================================
  // Props & Dispatcher
  // ============================================================================

  const {
    selectedProject,
    externalRefreshTrigger = 0,
  }: { selectedProject: any; externalRefreshTrigger?: number } = $props()

  const dispatch = createEventDispatcher()

  // ============================================================================
  // Initialize Project Detail Hook (3-Stage Architecture)
  // ============================================================================

  const pd = useRDDetail({ selectedProject, externalRefreshTrigger })

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

  // Available Employees (참여연구원 제외 현직 직원)
  const activeEmployees = useActiveEmployees()

  // 참여연구원을 제외한 직원 목록을 $derived.by()로 직접 계산
  const availableEmployees = $derived.by(() => {
    const memberEmployeeIds = new Set(projectMembers.map((m: any) => m.employee_id || m.id))
    return activeEmployees.employees.filter((emp: any) => !memberEmployeeIds.has(emp.id))
  })

  // Validation
  const validationData = $derived(store.validation)

  // Load available employees on mount
  onMount(() => {
    activeEmployees.load()
  })

  // ============================================================================
  // Project Management Functions
  // ============================================================================

  async function updateProject() {
    if (!selectedProject?.id) return

    try {
      store.setLoading('updating', true)

      const response = await fetch(`/api/research-development/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: store.forms.project.title,
          code: store.forms.project.code,
          projectTaskName: store.forms.project.projectTaskName,
          sponsor: store.forms.project.sponsor,
          managerEmployeeId: store.forms.project.managerEmployeeId,
          description: store.forms.project.description,
          status: store.forms.project.status,
          sponsorType: store.forms.project.sponsorType,
          priority: store.forms.project.priority,
          researchType: store.forms.project.researchType,
          // 전담기관 정보
          dedicatedAgency: store.forms.project.dedicatedAgency,
          dedicatedAgencyContactName: store.forms.project.dedicatedAgencyContactName,
          dedicatedAgencyContactPhone: store.forms.project.dedicatedAgencyContactPhone,
          dedicatedAgencyContactEmail: store.forms.project.dedicatedAgencyContactEmail,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // 업데이트된 데이터로 selectedProject 갱신
        if (result.data) {
          Object.assign(selectedProject, result.data)
        }

        store.closeModal('editProject')
        refresh()
        pushToast('연구개발사업이 수정되었습니다.', 'success')
      } else {
        pushToast('연구개발사업 수정에 실패했습니다.', 'error')
      }
    } catch (error) {
      logger.error('연구개발사업 수정 실패:', error)
      pushToast('연구개발사업 수정 중 오류가 발생했습니다.', 'error')
    } finally {
      store.setLoading('updating', false)
    }
  }

  async function deleteProject() {
    if (!selectedProject?.id) return
    if (store.selected.deleteCode !== selectedProject.code) {
      pushToast('연구개발사업 코드가 일치하지 않습니다.', 'info')
      return
    }

    try {
      store.setLoading('deleting', true)

      const response = await fetch(`/api/research-development/projects/${selectedProject.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        store.closeModal('deleteConfirm')
        refresh()
        pushToast('연구개발사업이 삭제되었습니다.', 'success')
      } else {
        pushToast('연구개발사업 삭제에 실패했습니다.', 'error')
      }
    } catch (error) {
      logger.error('연구개발사업 삭제 실패:', error)
      pushToast('연구개발사업 삭제 중 오류가 발생했습니다.', 'error')
    } finally {
      store.setLoading('deleting', false)
    }
  }

  // ============================================================================
  // Additional Helper Functions
  // ============================================================================

  function initProjectForm() {
    if (selectedProject) {
      store.forms.project = {
        title: selectedProject.title || '',
        code: projectUtilsImported.getProjectCode(selectedProject),
        projectTaskName: selectedProject.project_task_name || selectedProject.projectTaskName || '',
        sponsor: selectedProject.sponsor || '',
        managerEmployeeId:
          selectedProject.manager_employee_id || selectedProject.managerEmployeeId || '',
        description: projectUtilsImported.getProjectDescription(selectedProject),
        status: projectUtilsImported.getProjectStatus(selectedProject),
        sponsorType: projectUtilsImported.getProjectSponsorType(selectedProject),
        priority: selectedProject.priority || 'medium',
        researchType: selectedProject.research_type || selectedProject.researchType || 'applied',
        // 전담기관 정보
        dedicatedAgency: selectedProject.dedicated_agency || selectedProject.dedicatedAgency || '',
        dedicatedAgencyContactName:
          selectedProject.dedicated_agency_contact_name ||
          selectedProject.dedicatedAgencyContactName ||
          '',
        dedicatedAgencyContactPhone:
          selectedProject.dedicated_agency_contact_phone ||
          selectedProject.dedicatedAgencyContactPhone ||
          '',
        dedicatedAgencyContactEmail:
          selectedProject.dedicated_agency_contact_email ||
          selectedProject.dedicatedAgencyContactEmail ||
          '',
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
        `/api/research-development/evidence-items/validate-employment?budgetId=${store.selected.budgetForEvidence.id}&assigneeId=${store.forms.newEvidence.assigneeId}&dueDate=${store.forms.newEvidence.dueDate}`,
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

  // ============================================================================
  // Watch external project change
  // ============================================================================

  $effect(() => {
    if (selectedProject?.id) {
      updateProjectPeriod()
    }
  })
</script>

{#if selectedProject}
  <div class="space-y-6">
    <!-- 연구개발사업 기본 정보 -->
    <ThemeCard>
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">연구개발사업 정보</h3>
        <ThemeButton
          variant="secondary"
          size="sm"
          onclick={() => {
            initProjectForm()
            modalStates.editProject = true
          }}
        >
          <PencilIcon size={16} class="mr-1" />
          편집
        </ThemeButton>
      </div>

      <!-- 상태 및 태그 -->
      <div class="flex items-center gap-2 mb-4">
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

      <div class="space-y-3">
        {#if selectedProject.project_task_name || selectedProject.projectTaskName}
          <div>
            <div class="text-sm font-medium mb-1" style:color="var(--color-text-secondary)">
              과제명
            </div>
            <p class="text-sm" style:color="var(--color-text-primary)">
              {selectedProject.project_task_name || selectedProject.projectTaskName}
            </p>
          </div>
        {/if}
        {#if selectedProject.sponsor}
          <div>
            <div class="text-sm font-medium mb-1" style:color="var(--color-text-secondary)">
              주관기관
            </div>
            <p class="text-sm" style:color="var(--color-text-primary)">
              {selectedProject.sponsor}
            </p>
          </div>
        {/if}
        {#if selectedProject.manager_name || selectedProject.managerName}
          <div>
            <div class="text-sm font-medium mb-1" style:color="var(--color-text-secondary)">
              과제책임자
            </div>
            <p class="text-sm" style:color="var(--color-text-primary)">
              {selectedProject.manager_name || selectedProject.managerName}
            </p>
          </div>
        {/if}
        {#if selectedProject.description}
          <div>
            <div class="text-sm font-medium mb-1" style:color="var(--color-text-secondary)">
              사업 개요
            </div>
            <p class="text-sm whitespace-pre-line" style:color="var(--color-text-primary)">
              {selectedProject.description}
            </p>
          </div>
        {/if}
        {#if selectedProject.dedicated_agency || selectedProject.dedicatedAgency}
          <div class="pt-3 mt-3 border-t border-gray-200">
            <div class="text-sm font-medium mb-2" style:color="var(--color-text-secondary)">
              전담기관 정보
            </div>
            <div class="space-y-2 pl-3">
              <div class="flex items-start">
                <span class="text-xs font-medium w-20" style:color="var(--color-text-secondary)">
                  기관명:
                </span>
                <span class="text-sm flex-1" style:color="var(--color-text-primary)">
                  {selectedProject.dedicated_agency || selectedProject.dedicatedAgency}
                </span>
              </div>
              {#if selectedProject.dedicated_agency_contact_name || selectedProject.dedicatedAgencyContactName}
                <div class="flex items-start">
                  <span class="text-xs font-medium w-20" style:color="var(--color-text-secondary)">
                    담당자:
                  </span>
                  <span class="text-sm flex-1" style:color="var(--color-text-primary)">
                    {selectedProject.dedicated_agency_contact_name ||
                      selectedProject.dedicatedAgencyContactName}
                  </span>
                </div>
              {/if}
              {#if selectedProject.dedicated_agency_contact_phone || selectedProject.dedicatedAgencyContactPhone}
                <div class="flex items-start">
                  <span class="text-xs font-medium w-20" style:color="var(--color-text-secondary)">
                    전화번호:
                  </span>
                  <span class="text-sm flex-1" style:color="var(--color-text-primary)">
                    {selectedProject.dedicated_agency_contact_phone ||
                      selectedProject.dedicatedAgencyContactPhone}
                  </span>
                </div>
              {/if}
              {#if selectedProject.dedicated_agency_contact_email || selectedProject.dedicatedAgencyContactEmail}
                <div class="flex items-start">
                  <span class="text-xs font-medium w-20" style:color="var(--color-text-secondary)">
                    이메일:
                  </span>
                  <span class="text-sm flex-1" style:color="var(--color-text-primary)">
                    {selectedProject.dedicated_agency_contact_email ||
                      selectedProject.dedicatedAgencyContactEmail}
                  </span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </ThemeCard>

    <!-- 재원 구성 -->
    <ThemeCard>
      <h3 class="text-lg font-semibold text-gray-900 mb-6">재원 구성</h3>

      <div>
        {#await import('$lib/components/research-development/RDFundingStructure.svelte')}
          <div class="flex items-center justify-center py-4">
            <div
              class="animate-spin rounded-full h-4 w-4 border-b-2"
              style:border-color="var(--color-primary)"
            ></div>
            <span class="ml-2 text-sm" style:color="var(--color-text-secondary)">로딩 중...</span>
          </div>
        {:then { default: RDFundingStructure }}
          <RDFundingStructure
            projectId={selectedProject.id}
            compact={true}
            refreshTrigger={uiStates.budgetRefreshTrigger}
          />
        {:catch}
          <div class="text-center py-4">
            <p class="text-sm" style:color="var(--color-text-secondary)">
              예산 정보를 불러올 수 없습니다.
            </p>
          </div>
        {/await}
      </div>
    </ThemeCard>

    <!-- 집행 계획 -->
    <ThemeCard>
      <RDExecutionPlan projectId={selectedProject.id} refreshTrigger={uiStates.budgetUpdateKey} />
    </ThemeCard>
  </div>

  <!-- 사업비 추가/편집 모달 -->
  <RDProjectBudgetModal
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
  <RDProjectMemberForm
    bind:visible={loadingStates.addingMember}
    memberForm={forms.member}
    bind:isManualMonthlyAmount={uiStates.isManualMonthlyAmount}
    {availableEmployees}
    {formatNumber}
    oncancel={planning.cancelAddMember}
    onsubmit={planning.addMember}
    onupdateMonthlyAmount={updateMonthlyAmount}
  />

  <!-- 참여연구원 관리 -->
  <ThemeCard>
    <RDProjectMemberTable
      {projectMembers}
      selectedMember={selectedItems.member}
      memberForm={forms.member}
      isManualMonthlyAmount={uiStates.isManualMonthlyAmount}
      loadingAddingMember={loadingStates.addingMember}
      onStartAddMember={planning.startAddMember}
      onEditMember={(member) => planning.editMember(member)}
      onCancelEditMember={planning.cancelEditMember}
      onUpdateMember={planning.updateMember}
      onRemoveMember={(memberId) => planning.removeMember(String(memberId))}
      onUpdateMonthlyAmount={updateMonthlyAmount}
    />
  </ThemeCard>

  <!-- 증빙 관리 -->
  <ThemeCard>
    <RDEvidenceManagement
      {projectBudgets}
      {validationData}
      selectedEvidencePeriod={selectedItems.evidencePeriod}
      loadingEvidence={loadingStates.loadingEvidence}
      expandedEvidenceSections={uiStates.expandedEvidenceSections}
      onAddEvidence={() => (modalStates.evidence = true)}
      onOpenEvidenceDetail={(item) => execution.openEvidenceDetail(item)}
      onToggleSection={(sectionType) =>
        (uiStates.expandedEvidenceSections[sectionType] =
          !uiStates.expandedEvidenceSections[sectionType])}
    />
  </ThemeCard>

  <!-- 증빙 상세 모달 -->
  <RDEvidenceDetailModal
    bind:visible={modalStates.evidenceDetail}
    selectedItem={selectedItems.evidenceItem}
    {formatRDCurrency}
    {formatDate}
    onclose={() => (modalStates.evidenceDetail = false)}
  />

  <!-- 증빙 추가 모달 -->
  <RDEvidenceAddModal
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

  <!-- 연구개발사업 수정 모달 -->
  <RDProjectEditModal
    bind:visible={modalStates.editProject}
    bind:projectForm={forms.project}
    isUpdating={loadingStates.updating}
    onclose={() => (modalStates.editProject = false)}
    onupdate={updateProject}
  />

  <!-- 연구개발사업 삭제 확인 모달 -->
  <RDProjectDeleteConfirmModal
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
  <RDValidationResultModal
    bind:open={modalStates.validation}
    onclose={() => (modalStates.validation = false)}
    validationResults={validationData.results}
  />

  <!-- 예산 수정 확인 모달 -->
  <RDBudgetUpdateConfirmModal
    bind:open={modalStates.budgetUpdateConfirm}
    onclose={cancelBudgetUpdate}
    validationData={selectedItems.budgetUpdateData}
    onConfirm={confirmBudgetUpdate}
    onCancel={cancelBudgetUpdate}
  />
{/if}
