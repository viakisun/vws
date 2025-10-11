import { pushToast } from '$lib/stores/toasts'

/**
 * useProjectValidation Hook
 *
 * Handles all project validation-related business logic:
 * - Member validation
 * - Comprehensive project validation
 * - Validation history management
 * - Member validation status tracking
 */

import { logger } from '$lib/utils/logger'
import * as validationService from '$lib/services/research-development/validation.service'
import * as dataTransformers from '../utils/dataTransformers'
import type { ProjectDetailStore } from '../stores/projectDetailStore.svelte'

export interface UseProjectValidationOptions {
  store: ProjectDetailStore
  projectId: string
  projectMembers: any[]
}

export function useProjectValidation(options: UseProjectValidationOptions) {
  const { store, projectId, projectMembers } = options

  // ============================================================================
  // Validate Members
  // ============================================================================

  async function validateMembers(): Promise<void> {
    if (!projectId) return

    store.setLoading('validatingMembers', true)
    try {
      const data = await validationService.validateMembers(projectId)
      store.data.memberValidation = data
      store.data.memberValidationLastChecked = new Date()

      // 개별 멤버 검증 상태 업데이트
      if (data.success && data.data?.validation?.issues) {
        updateMemberValidationStatuses(data.data.validation.issues)
      }
    } catch (error) {
      logger.error('참여연구원 검증 중 오류:', error)
      throw error
    } finally {
      store.setLoading('validatingMembers', false)
    }
  }

  // ============================================================================
  // Update Member Validation Statuses
  // ============================================================================

  function updateMemberValidationStatuses(issues: any[]): void {
    // 초기화
    store.data.memberValidationStatuses = {}

    // dataTransformers를 사용하여 멤버별 상태 그룹화
    const statuses = dataTransformers.groupIssuesByMember(issues, projectMembers)

    // 기존 형식으로 변환
    statuses.forEach((status) => {
      if (status.issues.length === 0) {
        store.data.memberValidationStatuses[status.memberId] = {
          status: 'valid',
          message: '검증 완료',
          issues: [],
        }
      } else {
        // 더 자세한 메시지 생성
        let detailedMessage = ''
        if (status.errorCount > 0 && status.warningCount > 0) {
          detailedMessage = `${status.errorCount}개 오류, ${status.warningCount}개 경고`
        } else if (status.errorCount > 0) {
          detailedMessage = `${status.errorCount}개 오류`
        } else {
          detailedMessage = `${status.warningCount}개 경고`
        }

        store.data.memberValidationStatuses[status.memberId] = {
          status: status.status,
          message: detailedMessage,
          issues: status.issues.map((issue) => ({
            ...issue,
            // API에서 제공하는 실제 메시지 사용
            priority: issue.severity === 'error' ? 'high' : 'medium',
          })),
        }
      }
    })
  }

  // ============================================================================
  // Run Comprehensive Validation
  // ============================================================================

  async function runComprehensiveValidation(): Promise<void> {
    if (!projectId) return

    store.setLoading('validating', true)
    try {
      const result = await validationService.comprehensiveValidation(projectId)

      store.validation.results = result

      // 검증 히스토리에 추가
      store.validation.history.unshift({
        timestamp: new Date().toISOString(),
        projectId: projectId,
        results: result,
      })

      // 최대 10개까지만 유지
      if (store.validation.history.length > 10) {
        store.validation.history = store.validation.history.slice(0, 10)
      }

      store.openModal('validation')
    } catch (error) {
      logger.error('검증 실행 실패:', error)
      pushToast('검증 실행 중 오류가 발생했습니다.', 'error')
      throw error
    } finally {
      store.setLoading('validating', false)
    }
  }

  // ============================================================================
  // Get Member Validation Status
  // ============================================================================

  function getMemberValidationStatus(memberId: string): any {
    return store.data.memberValidationStatuses[memberId] || null
  }

  // ============================================================================
  // Clear Validation Results
  // ============================================================================

  function clearValidationResults(): void {
    store.validation.results = null
  }

  // ============================================================================
  // Toggle Auto Validation
  // ============================================================================

  function toggleAutoValidation(): void {
    store.validation.autoEnabled = !store.validation.autoEnabled
  }

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    // Data
    get validationResults() {
      return store.validation.results
    },
    get validationHistory() {
      return store.validation.history
    },
    get memberValidation() {
      return store.data.memberValidation
    },
    get memberValidationStatuses() {
      return store.data.memberValidationStatuses
    },
    get memberValidationLastChecked() {
      return store.data.memberValidationLastChecked
    },
    get autoValidationEnabled() {
      return store.validation.autoEnabled
    },
    get isValidating() {
      return store.loading.validating
    },
    get isValidatingMembers() {
      return store.loading.validatingMembers
    },

    // Actions
    validateMembers,
    updateMemberValidationStatuses,
    runComprehensiveValidation,
    getMemberValidationStatus,
    clearValidationResults,
    toggleAutoValidation,
  }
}
