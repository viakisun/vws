/**
 * Project Management - Budget Service
 * 프로젝트 예산 관련 API 호출을 처리하는 서비스
 */

import type { ProjectBudgetCategory } from '$lib/types'

export interface BudgetPayload {
  projectId: string
  periodNumber: number
  startDate: string
  endDate: string
  personnelCostCash: number
  researchMaterialCostCash: number
  researchActivityCostCash: number
  researchStipendCash: number
  indirectCostCash: number
  personnelCostInKind: number
  researchMaterialCostInKind: number
  researchActivityCostInKind: number
  researchStipendInKind: number
  indirectCostInKind: number
}

export interface BudgetUpdatePayload extends BudgetPayload {
  id: string
}

/**
 * 프로젝트 예산 목록 조회
 */
export async function getProjectBudgets(projectId: string): Promise<ProjectBudgetCategory[]> {
  const response = await fetch(`/api/research-development/project-budgets?projectId=${projectId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch project budgets: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

/**
 * 예산 생성
 */
export async function createBudget(payload: BudgetPayload): Promise<ProjectBudgetCategory> {
  const response = await fetch('/api/research-development/project-budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to create budget: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * 예산 수정
 */
export async function updateBudget(payload: BudgetUpdatePayload): Promise<ProjectBudgetCategory> {
  const { id, ...budgetData } = payload
  const response = await fetch(`/api/research-development/project-budgets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(budgetData),
  })

  if (!response.ok) {
    throw new Error(`Failed to update budget: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * 예산 삭제
 */
export async function deleteBudget(budgetId: string): Promise<void> {
  const response = await fetch(`/api/research-development/project-budgets/${budgetId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete budget: ${response.status} ${response.statusText}`)
  }
}

/**
 * 예산 카테고리 목록 조회
 */
export async function getBudgetCategories(): Promise<any[]> {
  const response = await fetch('/api/research-development/budget-categories')

  if (!response.ok) {
    throw new Error(`Failed to fetch budget categories: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}
