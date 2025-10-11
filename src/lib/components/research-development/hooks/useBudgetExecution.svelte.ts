import { pushToast } from '$lib/stores/toasts'

/**
 * useBudgetExecution Hook
 *
 * 3단계: 예산 집행 (Budget Execution)
 * - 증빙을 통한 실제 사용 내역 관리
 * - 계획된 예산 항목에 따라 실제 집행 추적
 */

import { logger } from '$lib/utils/logger'
import * as evidenceService from '$lib/services/research-development/evidence.service'
import * as memberUtilsImported from '../utils/memberUtils'
import * as budgetUtilsImported from '../utils/budgetUtils'
import * as dataTransformers from '../utils/dataTransformers'
import type { ProjectDetailStore } from '../stores/projectDetailStore.svelte'

export interface UseBudgetExecutionOptions {
  store: ProjectDetailStore
  projectId: string
  availableEmployees: any[]
  projectBudgets: any[]
}

export function useBudgetExecution(options: UseBudgetExecutionOptions) {
  const { store, availableEmployees, projectBudgets } = options

  // ============================================================================
  // Open Evidence Detail (증빙 상세 보기)
  // ============================================================================

  async function openEvidenceDetail(item: any): Promise<void> {
    store.selected.evidenceItem = item
    store.openModal('evidenceDetail')

    // 증빙 항목 상세 정보 로드
    if (item.id) {
      try {
        const data = await evidenceService.getEvidence(item.id)
        store.selected.evidenceItem = data
      } catch (error) {
        logger.error('증빙 항목 상세 정보 로드 실패:', error)
      }
    }
  }

  // ============================================================================
  // Load Evidence Categories (증빙 카테고리 로드)
  // ============================================================================

  async function loadEvidenceCategories(): Promise<void> {
    try {
      store.validation.categories = await evidenceService.getEvidenceCategories()
    } catch (error) {
      logger.error('증빙 카테고리 로드 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Load Evidence Items (집행 내역 - 증빙 항목 로드)
  // ============================================================================

  async function loadEvidenceItems(): Promise<void> {
    if (!projectBudgets || projectBudgets.length === 0) return

    try {
      store.setLoading('loadingEvidence', true)
      let allEvidenceItems: any[] = []

      // 모든 연차의 증빙 데이터를 로드
      for (const budget of projectBudgets) {
        const response = await fetch(
          `/api/research-development/evidence?projectBudgetId=${budget.id}`,
        )
        const result = await response.json()

        if (result.success) {
          allEvidenceItems = [...allEvidenceItems, ...result.data]
        }
      }

      store.validation.items = allEvidenceItems
    } catch (error) {
      logger.error('증빙 항목 로드 실패:', error)
      throw error
    } finally {
      store.setLoading('loadingEvidence', false)
    }
  }

  // ============================================================================
  // Add Evidence Item (집행 내역 추가)
  // ============================================================================

  async function addEvidenceItem(categoryId: string, itemData: any): Promise<any> {
    try {
      const currentBudget =
        projectBudgets.find(
          (b: any) => budgetUtilsImported.getPeriodNumber(b) === store.selected.evidencePeriod,
        ) || projectBudgets[0]

      const data = await evidenceService.createEvidence({
        projectBudgetId: currentBudget.id,
        categoryId: categoryId,
        ...itemData,
      })

      await loadEvidenceItems()
      return data
    } catch (error) {
      logger.error('증빙 항목 추가 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Update Evidence Item (집행 내역 수정)
  // ============================================================================

  async function updateEvidenceItem(itemId: string, updateData: any): Promise<any> {
    try {
      const data = await evidenceService.updateEvidence(itemId, updateData)
      await loadEvidenceItems()
      return data
    } catch (error) {
      logger.error('증빙 항목 수정 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Delete Evidence Item (집행 내역 삭제)
  // ============================================================================

  async function deleteEvidenceItem(itemId: string): Promise<void> {
    try {
      await evidenceService.deleteEvidence(itemId)
      await loadEvidenceItems()
    } catch (error) {
      logger.error('증빙 항목 삭제 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Handle Add Evidence Item (증빙 항목 추가 처리)
  // ============================================================================

  async function handleAddEvidenceItem(): Promise<void> {
    if (
      !store.forms.newEvidence.categoryId ||
      !store.forms.newEvidence.name ||
      !store.forms.newEvidence.budgetAmount
    ) {
      pushToast('필수 필드를 모두 입력해주세요.', 'info')
      return
    }

    try {
      store.setLoading('updating', true)

      const selectedEmployee = availableEmployees.find(
        (emp: any) => emp.id === store.forms.newEvidence.assigneeId,
      )
      const assigneeName = memberUtilsImported.createAssigneeNameFromEmployee(selectedEmployee)

      await addEvidenceItem(store.forms.newEvidence.categoryId, {
        name: store.forms.newEvidence.name,
        description: store.forms.newEvidence.description,
        budgetAmount: dataTransformers.safeStringToNumber(store.forms.newEvidence.budgetAmount, 0),
        assigneeId: store.forms.newEvidence.assigneeId,
        assigneeName: assigneeName,
        dueDate: store.forms.newEvidence.dueDate,
      })

      // 폼 초기화
      store.resetForm('newEvidence')
      store.closeModal('evidence')
    } catch (error) {
      logger.error('증빙 항목 추가 실패:', error)
      pushToast('증빙 항목 추가에 실패했습니다.', 'success')
      throw error
    } finally {
      store.setLoading('updating', false)
    }
  }

  // ============================================================================
  // Load Evidence List (증빙 목록 로드)
  // ============================================================================

  async function loadEvidenceList(budgetId: string): Promise<void> {
    try {
      const response = await fetch(
        `/api/research-development/budget-evidence?projectBudgetId=${budgetId}`,
      )
      if (response.ok) {
        const data = await response.json()
        store.data.evidenceList = data.data || []
      }
    } catch (error) {
      logger.error('증빙 내역 로드 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Load Evidence Types (증빙 유형 로드)
  // ============================================================================

  async function loadEvidenceTypes(): Promise<void> {
    try {
      store.data.evidenceTypes = await evidenceService.getEvidenceTypes()
    } catch (error) {
      logger.error('증빙 유형 로드 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    // Data
    get evidenceCategories() {
      return store.validation.categories
    },
    get evidenceItems() {
      return store.validation.items
    },
    get evidenceList() {
      return store.data.evidenceList
    },
    get evidenceTypes() {
      return store.data.evidenceTypes
    },
    get selectedEvidenceItem() {
      return store.selected.evidenceItem
    },
    get evidenceForm() {
      return store.forms.newEvidence
    },
    get isLoadingEvidence() {
      return store.loading.loadingEvidence
    },

    // Actions
    openEvidenceDetail,
    loadEvidenceCategories,
    loadEvidenceItems,
    addEvidenceItem,
    updateEvidenceItem,
    deleteEvidenceItem,
    handleAddEvidenceItem,
    loadEvidenceList,
    loadEvidenceTypes,
  }
}
