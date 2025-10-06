/**
 * useProjectDetail - Master Composition Hook
 *
 * 3단계 예산 흐름에 따른 프로젝트 상세 관리:
 * 1. Budget Funding (예산 조달) - 지원금, 기업부담금 등
 * 2. Budget Planning (예산 계획) - 인건비, 재료비, 활동비 등으로 배분
 * 3. Budget Execution (예산 집행) - 증빙을 통한 실제 사용
 *
 * This is the single entry point for the ProjectDetailView component
 */

import { createEventDispatcher, onMount } from 'svelte'
import { logger } from '$lib/utils/logger'
import { createProjectDetailStore } from '../stores/projectDetailStore.svelte'
import { useBudgetFunding } from './useBudgetFunding.svelte'
import { useBudgetPlanning } from './useBudgetPlanning.svelte'
import { useBudgetExecution } from './useBudgetExecution.svelte'

export interface UseProjectDetailOptions {
  selectedProject: any
  externalRefreshTrigger?: number
}

export function useProjectDetail(options: UseProjectDetailOptions) {
  const { selectedProject, externalRefreshTrigger = 0 } = options
  const dispatch = createEventDispatcher()

  // Create store instance
  const store = createProjectDetailStore()

  // ============================================================================
  // Refresh Handler
  // ============================================================================

  function handleRefresh() {
    dispatch('refresh')
  }

  // ============================================================================
  // Update Project Period from Budgets
  // ============================================================================

  async function updateProjectPeriod(): Promise<void> {
    if (!selectedProject?.id) return

    try {
      const response = await fetch(
        `/api/project-management/projects/${selectedProject.id}/annual-budgets`,
      )
      const result = await response.json()

      if (result.success && result.data?.budgets && result.data.budgets.length > 0) {
        const budgets = result.data.budgets
        const firstBudget = budgets[0]
        const lastBudget = budgets[budgets.length - 1]

        if (firstBudget.startDate && lastBudget.endDate) {
          const periodElement = document.getElementById('project-period')
          if (periodElement) {
            periodElement.textContent = `${firstBudget.startDate} ~ ${lastBudget.endDate}`
          }
        } else {
          const periodElement = document.getElementById('project-period')
          if (periodElement) {
            periodElement.textContent = '연차별 기간 정보 없음'
          }
        }
      } else {
        const periodElement = document.getElementById('project-period')
        if (periodElement) {
          periodElement.textContent = '연차별 예산 정보 없음'
        }
      }
    } catch (error) {
      logger.error('프로젝트 기간 업데이트 실패:', error)
      const periodElement = document.getElementById('project-period')
      if (periodElement) {
        periodElement.textContent = '기간 정보 로드 실패'
      }
    }
  }

  // ============================================================================
  // Initialize Hooks - 3-Stage Budget Flow
  // ============================================================================

  // 1단계: Budget Funding Hook (예산 조달)
  const fundingHook = useBudgetFunding({
    store,
    projectId: selectedProject?.id,
    onRefresh: handleRefresh,
    updateProjectPeriod,
  })

  // 2단계: Budget Planning Hook (예산 계획 - 인건비 중심)
  const planningHook = useBudgetPlanning({
    store,
    projectId: selectedProject?.id,
    onRefresh: handleRefresh,
  })

  // 3단계: Budget Execution Hook (예산 집행 - 증빙)
  const executionHook = useBudgetExecution({
    store,
    projectId: selectedProject?.id,
    availableEmployees: store.data.availableEmployees,
    projectBudgets: store.data.projectBudgets,
  })

  // ============================================================================
  // Lifecycle - onMount
  // ============================================================================

  onMount(() => {
    void (async () => {
      if (selectedProject?.id) {
        // 1단계: 조달 예산 로드
        await fundingHook.loadBudgets()

        // 2단계: 계획 (인건비 - 참여연구원) 로드
        await planningHook.loadMembers()

        // 3단계: 집행 (증빙 카테고리) 로드
        await executionHook.loadEvidenceCategories()
      }
    })()
  })

  // ============================================================================
  // Watch External Refresh Trigger
  // ============================================================================

  $effect(() => {
    if (externalRefreshTrigger > 0) {
      void (async () => {
        await fundingHook.loadBudgets()
        await planningHook.loadMembers()
      })()
    }
  })

  // ============================================================================
  // Return Unified API - 3-Stage Flow
  // ============================================================================

  return {
    // Store
    store,

    // 1단계: Budget Funding (예산 조달)
    funding: fundingHook,

    // 2단계: Budget Planning (예산 계획)
    planning: planningHook,

    // 3단계: Budget Execution (예산 집행)
    execution: executionHook,

    // Common
    updateProjectPeriod,
    refresh: handleRefresh,
  }
}
