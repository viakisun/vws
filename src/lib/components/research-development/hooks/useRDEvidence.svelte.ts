import { pushToast } from '$lib/stores/toasts'

/**
 * useProjectEvidence Hook
 *
 * Handles all project evidence-related business logic:
 * - Loading evidence categories and items
 * - Adding new evidence items
 * - Updating existing evidence items
 * - Deleting evidence items
 * - Evidence validation for employment period
 */

import * as evidenceService from '$lib/services/research-development/evidence.service'
import { logger } from '$lib/utils/logger'
import type { RDDetailStore } from '../stores/RDDetailStore.svelte'
import * as budgetUtilsImported from '../utils/rd-budget-utils'
import * as dataTransformers from '../utils/rd-data-transformers'
import * as memberUtilsImported from '../utils/rd-member-utils'

export interface UseProjectEvidenceOptions {
  store: RDDetailStore
  projectId: string
  availableEmployees: any[]
  projectBudgets: any[]
}

export function useRDEvidence(options: UseProjectEvidenceOptions) {
  const { store, availableEmployees, projectBudgets } = options

  // ============================================================================
  // Validate Evidence Registration
  // ============================================================================

  async function validateEvidenceRegistration(): Promise<void> {
    if (
      !store.forms.newEvidence.assigneeId ||
      !store.forms.newEvidence.dueDate ||
      !store.selected.budgetForEvidence?.id
    ) {
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

  // ============================================================================
  // Open Evidence Detail
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
  // Load Evidence Categories
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
  // Load Evidence Items
  // ============================================================================

  async function loadEvidenceItems(): Promise<void> {
    if (!projectBudgets || projectBudgets.length === 0) {
      logger.warn('loadEvidenceItems: No project budgets available')
      return
    }

    try {
      store.setLoading('loadingEvidence', true)
      let allEvidenceItems: any[] = []

      logger.info(`loadEvidenceItems: Loading evidence for ${projectBudgets.length} budgets`)

      // 모든 연차의 증빙 데이터를 로드
      for (const budget of projectBudgets) {
        const url = `/api/research-development/evidence?projectBudgetId=${budget.id}`
        logger.info(`loadEvidenceItems: Fetching ${url}`)

        const response = await fetch(url)
        const result = await response.json()

        logger.info(
          `loadEvidenceItems: Budget ${budget.period_number} - success: ${result.success}, count: ${result.count || 0}`,
        )

        if (result.success) {
          allEvidenceItems = [...allEvidenceItems, ...result.data]
        }
      }

      logger.info(`loadEvidenceItems: Total evidence items loaded: ${allEvidenceItems.length}`)
      store.validation.items = allEvidenceItems
    } catch (error) {
      logger.error('증빙 항목 로드 실패:', error)
      throw error
    } finally {
      store.setLoading('loadingEvidence', false)
    }
  }

  // ============================================================================
  // Add Evidence Item
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
  // Update Evidence Item
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
  // Delete Evidence Item
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
  // Handle Add Evidence Item
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
  // Load Evidence List
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
  // Load Evidence Types
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
    get evidenceValidation() {
      return store.validation.evidence
    },
    get isLoadingEvidence() {
      return store.loading.loadingEvidence
    },
    get isValidatingEvidence() {
      return store.loading.validatingEvidence
    },

    // Actions
    validateEvidenceRegistration,
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
