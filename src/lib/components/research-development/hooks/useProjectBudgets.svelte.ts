import { pushToast } from '$lib/stores/toasts'

/**
 * useProjectBudgets Hook
 *
 * Handles all project budget-related business logic:
 * - Loading budgets
 * - Adding new budgets
 * - Editing existing budgets
 * - Deleting budgets
 * - Restoring research costs
 * - Budget validation before update
 */

import { logger } from '$lib/utils/logger'
import { formatDateForInput } from '$lib/utils/format'
import * as budgetService from '$lib/services/research-development/budget.service'
import * as budgetUtilsImported from '../utils/budgetUtils'
import type { ProjectDetailStore } from '../stores/projectDetailStore.svelte'

export interface UseProjectBudgetsOptions {
  store: ProjectDetailStore
  projectId: string
  onRefresh: () => void
  updateProjectPeriod: () => Promise<void>
}

// Helper functions for currency conversion
function fromThousands(value: string): number {
  return Number(value || 0) * 1000
}

function toThousands(value: number): string {
  return String(value / 1000)
}

export function useProjectBudgets(options: UseProjectBudgetsOptions) {
  const { store, projectId, onRefresh, updateProjectPeriod } = options

  // ============================================================================
  // Load Budgets
  // ============================================================================

  async function loadBudgets(): Promise<void> {
    try {
      store.data.projectBudgets = await budgetService.getProjectBudgets(projectId)
      store.incrementBudgetUpdateKey()
    } catch (error) {
      logger.error('프로젝트 사업비 로드 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Load Budget Categories
  // ============================================================================

  async function loadBudgetCategories(): Promise<void> {
    try {
      store.data.budgetCategories = await budgetService.getBudgetCategories()
    } catch (error) {
      logger.error('사업비 항목 로드 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Add Budget
  // ============================================================================

  async function addBudget(): Promise<void> {
    // 필수 필드 검증
    if (!store.forms.budget.startDate || !store.forms.budget.endDate) {
      pushToast('연차 기간(시작일, 종료일)을 모두 입력해주세요.', 'info')
      return
    }

    // 시작일이 종료일보다 늦은지 검증
    if (new Date(store.forms.budget.startDate) >= new Date(store.forms.budget.endDate)) {
      pushToast('시작일은 종료일보다 빨라야 합니다.', 'info')
      return
    }

    try {
      await budgetService.createBudget({
        projectId,
        periodNumber: store.forms.budget.periodNumber,
        startDate: store.forms.budget.startDate,
        endDate: store.forms.budget.endDate,
        // 현금 비목들 (천원 단위를 원 단위로 변환)
        personnelCostCash: fromThousands(store.forms.budget.personnelCostCash),
        researchMaterialCostCash: fromThousands(store.forms.budget.researchMaterialCostCash),
        researchActivityCostCash: fromThousands(store.forms.budget.researchActivityCostCash),
        researchStipendCash: fromThousands(store.forms.budget.researchStipendCash),
        indirectCostCash: fromThousands(store.forms.budget.indirectCostCash),
        // 현물 비목들 (천원 단위를 원 단위로 변환)
        personnelCostInKind: fromThousands(store.forms.budget.personnelCostInKind),
        researchMaterialCostInKind: fromThousands(store.forms.budget.researchMaterialCostInKind),
        researchActivityCostInKind: fromThousands(store.forms.budget.researchActivityCostInKind),
        researchStipendInKind: fromThousands(store.forms.budget.researchStipendInKind),
        indirectCostInKind: fromThousands(store.forms.budget.indirectCostInKind),
      })

      store.closeModal('budget')
      store.resetForm('budget')
      await loadBudgets()
      await updateProjectPeriod()
      store.incrementBudgetRefresh()
      onRefresh()

      pushToast('사업비가 성공적으로 추가되었습니다.', 'success')
    } catch (error) {
      logger.error('사업비 추가 실패:', error)
      pushToast('사업비 추가 중 오류가 발생했습니다.', 'success')
      throw error
    }
  }

  // ============================================================================
  // Edit Budget
  // ============================================================================

  function editBudget(budget: any): void {
    store.selected.budget = budget

    store.forms.budget = {
      periodNumber: budgetUtilsImported.getPeriodNumber(budget),
      startDate: formatDateForInput(budgetUtilsImported.getStartDate(budget)),
      endDate: formatDateForInput(budgetUtilsImported.getEndDate(budget)),
      // 현금 비목들 (천원 단위로 변환)
      personnelCostCash: toThousands(budgetUtilsImported.getPersonnelCostCash(budget)),
      researchMaterialCostCash: toThousands(
        budgetUtilsImported.getResearchMaterialCostCash(budget),
      ),
      researchActivityCostCash: toThousands(
        budgetUtilsImported.getResearchActivityCostCash(budget),
      ),
      researchStipendCash: toThousands(budgetUtilsImported.getResearchStipendCash(budget)),
      indirectCostCash: toThousands(budgetUtilsImported.getIndirectCost(budget)),
      // 현물 비목들 (천원 단위로 변환)
      personnelCostInKind: toThousands(budgetUtilsImported.getPersonnelCostInKind(budget)),
      researchMaterialCostInKind: toThousands(
        budgetUtilsImported.getResearchMaterialCostInKind(budget),
      ),
      researchActivityCostInKind: toThousands(
        budgetUtilsImported.getResearchActivityCostInKind(budget),
      ),
      researchStipendInKind: toThousands(budgetUtilsImported.getResearchStipendInKind(budget)),
      indirectCostInKind: toThousands(budgetUtilsImported.getIndirectCostInKind(budget)),
    }

    store.openModal('budget')
  }

  // ============================================================================
  // Update Budget
  // ============================================================================

  async function updateBudget(): Promise<void> {
    if (!store.selected.budget) return

    // 필수 필드 검증
    if (!store.forms.budget.startDate || !store.forms.budget.endDate) {
      pushToast('연차 기간(시작일, 종료일)을 모두 입력해주세요.', 'info')
      return
    }

    // 시작일이 종료일보다 늦은지 검증
    if (new Date(store.forms.budget.startDate) >= new Date(store.forms.budget.endDate)) {
      pushToast('시작일은 종료일보다 빨라야 합니다.', 'info')
      return
    }

    try {
      // 1단계: 예산 수정 전 검증
      const validationResponse = await fetch(
        `/api/research-development/project-budgets/${store.selected.budget.id}/validate-before-update`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            periodNumber: store.forms.budget.periodNumber,
            startDate: store.forms.budget.startDate,
            endDate: store.forms.budget.endDate,
            personnelCostCash: fromThousands(store.forms.budget.personnelCostCash),
            researchMaterialCostCash: fromThousands(store.forms.budget.researchMaterialCostCash),
            researchActivityCostCash: fromThousands(store.forms.budget.researchActivityCostCash),
            researchStipendCash: fromThousands(store.forms.budget.researchStipendCash),
            indirectCostCash: fromThousands(store.forms.budget.indirectCostCash),
            personnelCostInKind: fromThousands(store.forms.budget.personnelCostInKind),
            researchMaterialCostInKind: fromThousands(
              store.forms.budget.researchMaterialCostInKind,
            ),
            researchActivityCostInKind: fromThousands(
              store.forms.budget.researchActivityCostInKind,
            ),
            researchStipendInKind: fromThousands(store.forms.budget.researchStipendInKind),
            indirectCostInKind: fromThousands(store.forms.budget.indirectCostInKind),
          }),
        },
      )

      if (!validationResponse.ok) {
        pushToast('예산 수정 전 검증에 실패했습니다.', 'success')
        return
      }

      const validationResult = await validationResponse.json()

      if (validationResult.success && validationResult.data.hasWarnings) {
        // 검증 데이터 저장하고 확인 모달 표시
        store.selected.budgetUpdateData = validationResult.data
        store.openModal('budgetUpdateConfirm')
        return
      }

      // 경고가 없으면 바로 수정 진행
      await proceedWithUpdate()
    } catch (error) {
      logger.error('사업비 업데이트 실패:', error)
      pushToast('사업비 수정 중 오류가 발생했습니다.', 'success')
      throw error
    }
  }

  // ============================================================================
  // Proceed with Budget Update
  // ============================================================================

  async function proceedWithUpdate(): Promise<void> {
    if (!store.selected.budget) return

    try {
      await budgetService.updateBudget({
        id: store.selected.budget.id,
        projectId,
        periodNumber: store.forms.budget.periodNumber,
        startDate: store.forms.budget.startDate,
        endDate: store.forms.budget.endDate,
        personnelCostCash: fromThousands(store.forms.budget.personnelCostCash),
        researchMaterialCostCash: fromThousands(store.forms.budget.researchMaterialCostCash),
        researchActivityCostCash: fromThousands(store.forms.budget.researchActivityCostCash),
        researchStipendCash: fromThousands(store.forms.budget.researchStipendCash),
        indirectCostCash: fromThousands(store.forms.budget.indirectCostCash),
        personnelCostInKind: fromThousands(store.forms.budget.personnelCostInKind),
        researchMaterialCostInKind: fromThousands(store.forms.budget.researchMaterialCostInKind),
        researchActivityCostInKind: fromThousands(store.forms.budget.researchActivityCostInKind),
        researchStipendInKind: fromThousands(store.forms.budget.researchStipendInKind),
        indirectCostInKind: fromThousands(store.forms.budget.indirectCostInKind),
      })

      store.closeModal('budget')
      store.closeModal('budgetUpdateConfirm')
      store.selected.budget = null
      store.selected.budgetUpdateData = null
      store.resetForm('budget')

      await loadBudgets()
      await updateProjectPeriod()
      store.incrementBudgetRefresh()
      onRefresh()

      pushToast('사업비가 성공적으로 수정되었습니다.', 'success')
    } catch (error) {
      logger.error('사업비 수정 실패:', error)
      pushToast('사업비 수정 중 오류가 발생했습니다.', 'success')
      throw error
    }
  }

  // ============================================================================
  // Confirm/Cancel Budget Update
  // ============================================================================

  function confirmBudgetUpdate(): void {
    proceedWithUpdate()
  }

  function cancelBudgetUpdate(): void {
    store.closeModal('budgetUpdateConfirm')
    store.selected.budgetUpdateData = null
  }

  // ============================================================================
  // Remove Budget
  // ============================================================================

  async function removeBudget(budgetId: string): Promise<void> {
    if (!confirm('정말로 이 사업비 항목을 삭제하시겠습니까?')) return

    try {
      await budgetService.deleteBudget(budgetId)
      await loadBudgets()
      await updateProjectPeriod()
      store.incrementBudgetRefresh()
      onRefresh()
    } catch (error) {
      logger.error('사업비 삭제 실패:', error)
      pushToast('사업비 삭제 중 오류가 발생했습니다.', 'success')
      throw error
    }
  }

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    // Data
    get budgets() {
      return store.data.projectBudgets
    },
    get budgetCategories() {
      return store.data.budgetCategories
    },
    get selectedBudget() {
      return store.selected.budget
    },
    get budgetForm() {
      return store.forms.budget
    },
    get budgetUpdateData() {
      return store.selected.budgetUpdateData
    },

    // Actions
    loadBudgets,
    loadBudgetCategories,
    addBudget,
    editBudget,
    updateBudget,
    confirmBudgetUpdate,
    cancelBudgetUpdate,
    removeBudget,
  }
}
