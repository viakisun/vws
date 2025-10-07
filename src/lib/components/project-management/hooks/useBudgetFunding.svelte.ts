import { pushToast } from '$lib/stores/toasts'

/**
 * useBudgetFunding Hook
 *
 * 1단계: 예산 조달 (Budget Funding)
 * - 지원금, 기업부담금 등 자금 출처 관리
 * - 연차별 조달 계획 CRUD
 */

import { logger } from '$lib/utils/logger'
import { formatDateForInput } from '$lib/utils/format'
import * as budgetService from '$lib/services/project-management/budget.service'
import * as budgetUtilsImported from '../utils/budgetUtils'
import type { ProjectDetailStore } from '../stores/projectDetailStore.svelte'

export interface UseBudgetFundingOptions {
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

export function useBudgetFunding(options: UseBudgetFundingOptions) {
  const { store, projectId, onRefresh, updateProjectPeriod } = options

  // ============================================================================
  // Load Budgets (조달 내역 로드)
  // ============================================================================

  async function loadBudgets(): Promise<void> {
    try {
      store.data.projectBudgets = await budgetService.getProjectBudgets(projectId)
      store.incrementBudgetUpdateKey()
    } catch (error) {
      logger.error('프로젝트 예산 조달 내역 로드 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Load Budget Categories (예산 항목 로드)
  // ============================================================================

  async function loadBudgetCategories(): Promise<void> {
    try {
      store.data.budgetCategories = await budgetService.getBudgetCategories()
    } catch (error) {
      logger.error('예산 항목 로드 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Add Budget (조달 예산 추가)
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
        // 현금 조달 (천원 단위를 원 단위로 변환)
        personnelCostCash: fromThousands(store.forms.budget.personnelCostCash),
        researchMaterialCostCash: fromThousands(store.forms.budget.researchMaterialCostCash),
        researchActivityCostCash: fromThousands(store.forms.budget.researchActivityCostCash),
        researchStipendCash: fromThousands(store.forms.budget.researchStipendCash),
        indirectCostCash: fromThousands(store.forms.budget.indirectCostCash),
        // 현물 조달 (천원 단위를 원 단위로 변환)
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

      pushToast('예산 조달 내역이 성공적으로 추가되었습니다.', 'success')
    } catch (error) {
      logger.error('예산 조달 추가 실패:', error)
      pushToast('예산 조달 추가 중 오류가 발생했습니다.', 'success')
      throw error
    }
  }

  // ============================================================================
  // Edit Budget (조달 예산 수정 준비)
  // ============================================================================

  function editBudget(budget: any): void {
    store.selected.budget = budget

    store.forms.budget = {
      periodNumber: budgetUtilsImported.getPeriodNumber(budget),
      startDate: formatDateForInput(budgetUtilsImported.getStartDate(budget)),
      endDate: formatDateForInput(budgetUtilsImported.getEndDate(budget)),
      // 현금 조달 (천원 단위로 변환)
      personnelCostCash: toThousands(budgetUtilsImported.getPersonnelCostCash(budget)),
      researchMaterialCostCash: toThousands(
        budgetUtilsImported.getResearchMaterialCostCash(budget),
      ),
      researchActivityCostCash: toThousands(
        budgetUtilsImported.getResearchActivityCostCash(budget),
      ),
      researchStipendCash: toThousands(budgetUtilsImported.getResearchStipendCash(budget)),
      indirectCostCash: toThousands(budgetUtilsImported.getIndirectCost(budget)),
      // 현물 조달 (천원 단위로 변환)
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
  // Update Budget (조달 예산 수정)
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
      store.selected.budget = null
      store.resetForm('budget')

      await loadBudgets()
      await updateProjectPeriod()
      store.incrementBudgetRefresh()
      onRefresh()

      pushToast('예산 조달 내역이 성공적으로 수정되었습니다.', 'success')
    } catch (error) {
      logger.error('예산 조달 수정 실패:', error)
      pushToast('예산 조달 수정 중 오류가 발생했습니다.', 'success')
      throw error
    }
  }

  // ============================================================================
  // Remove Budget (조달 예산 삭제)
  // ============================================================================

  async function removeBudget(budgetId: string): Promise<void> {
    if (!confirm('정말로 이 예산 조달 항목을 삭제하시겠습니까?')) return

    try {
      await budgetService.deleteBudget(budgetId)
      await loadBudgets()
      await updateProjectPeriod()
      store.incrementBudgetRefresh()
      onRefresh()
    } catch (error) {
      logger.error('예산 조달 삭제 실패:', error)
      pushToast('예산 조달 삭제 중 오류가 발생했습니다.', 'success')
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

    // Actions
    loadBudgets,
    loadBudgetCategories,
    addBudget,
    editBudget,
    updateBudget,
    removeBudget,
  }
}
