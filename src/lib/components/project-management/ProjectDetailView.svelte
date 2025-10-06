<script lang="ts">
  /**
   * ProjectDetailView - Orchestrator Component
   *
   * 1단계: Budget Funding (예산 조달) - funding.*
   * 2단계: Budget Planning (예산 계획) - planning.*
   * 3단계: Budget Execution (예산 집행) - execution.*
   */

  import { logger } from '$lib/utils/logger'
  import { createEventDispatcher } from 'svelte'
  import { useProjectDetail } from './hooks/useProjectDetail.svelte'

  // Sub-components
  import ProjectHeader from './ProjectHeader.svelte'
  import BudgetTable from './BudgetTable.svelte'
  import MemberTable from './MemberTable.svelte'
  import EvidenceManagement from './EvidenceManagement.svelte'

  // Modal Components
  import ProjectBudgetModal from './ProjectBudgetModal.svelte'
  import ProjectMemberForm from './ProjectMemberForm.svelte'
  import EvidenceDetailModal from './EvidenceDetailModal.svelte'
  import EvidenceAddModal from './EvidenceAddModal.svelte'
  import ProjectEditModal from './ProjectEditModal.svelte'
  import ProjectDeleteConfirmModal from './ProjectDeleteConfirmModal.svelte'
  import BudgetUpdateConfirmModal from './BudgetUpdateConfirmModal.svelte'
  import ValidationResultModal from './ValidationResultModal.svelte'

  // Utility functions
  import { formatCurrency, formatDate, formatNumber } from '$lib/utils/format'
  import * as projectUtilsImported from './utils/projectUtils'
  import * as calculationUtilsImported from './utils/calculationUtils'
  import * as dataTransformers from './utils/dataTransformers'

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

  // Validation
  const validationData = $derived(store.validation)

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
    <!-- 프로젝트 기본 정보 -->
    <ProjectHeader
      {selectedProject}
      budgetRefreshTrigger={uiStates.budgetRefreshTrigger}
      onEditProject={() => {
        initProjectForm()
        modalStates.editProject = true
      }}
      onShowBudgetModal={() => dispatch('show-budget-modal')}
      onDeleteProject={() => (modalStates.deleteConfirm = true)}
    />

    <!-- 연차별 사업비 관리 -->
    <BudgetTable
      {projectBudgets}
      budgetUpdateKey={uiStates.budgetUpdateKey}
      evidencePeriod={selectedItems.evidencePeriod}
      onEditBudget={(budget) => funding.editBudget(budget)}
      onRemoveBudget={(budgetId) => funding.removeBudget(budgetId)}
    />
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

  <!-- 참여연구원 관리 -->
  <MemberTable
    {projectMembers}
    selectedMember={selectedItems.member}
    memberForm={forms.member}
    isManualMonthlyAmount={uiStates.isManualMonthlyAmount}
    loadingAddingMember={loadingStates.addingMember}
    onStartAddMember={planning.startAddMember}
    onEditMember={(member) => planning.editMember(member)}
    onCancelEditMember={planning.cancelEditMember}
    onUpdateMember={planning.updateMember}
    onRemoveMember={(memberId) => planning.removeMember(memberId)}
    onUpdateMonthlyAmount={updateMonthlyAmount}
  />

  <!-- 증빙 관리 -->
  <EvidenceManagement
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
