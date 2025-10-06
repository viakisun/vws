/**
 * Project Management - Validation Service
 * 프로젝트 검증 관련 API 호출을 처리하는 서비스
 */

export interface ValidationPayload {
  projectId?: string
  employmentIds?: string[]
  assigneeId?: string
  dueDate?: string
  projectBudgetId?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  success?: boolean
  data?: any
}

/**
 * 증빙 등록 검증
 */
export async function validateEvidenceRegistration(
  payload: ValidationPayload,
): Promise<ValidationResult> {
  const response = await fetch('/api/project-management/evidence-items/validate-employment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to validate evidence: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as ValidationResult
}

/**
 * 멤버 검증
 */
export async function validateMembers(projectId: string): Promise<ValidationResult> {
  const response = await fetch(
    `/api/project-management/researcher-validation?projectId=${projectId}`,
  )

  if (!response.ok) {
    throw new Error(`Failed to validate members: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as ValidationResult
}

/**
 * 종합 검증
 */
export async function comprehensiveValidation(projectId: string): Promise<ValidationResult> {
  const response = await fetch(`/api/project-management/comprehensive-validation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  })

  if (!response.ok) {
    throw new Error(
      `Failed to run comprehensive validation: ${response.status} ${response.statusText}`,
    )
  }

  return (await response.json()) as ValidationResult
}
