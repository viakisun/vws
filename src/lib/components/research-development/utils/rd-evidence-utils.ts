/**
 * Evidence Management Utility Functions
 *
 * 증빙 관리 관련 유틸리티 함수들
 * RDDetailView.svelte에서 추출된 증빙 데이터 처리 함수들
 */

// ============================================================================
// Field Accessors
// ============================================================================

/**
 * Generic field accessor for evidence data
 * Handles both camelCase and snake_case field naming conventions
 */
export function getEvidenceField<T>(
  evidence: Record<string, any>,
  camelCase: string,
  snakeCase: string,
  defaultValue: T | null = null,
): T {
  return evidence[camelCase] || evidence[snakeCase] || defaultValue
}

/**
 * Get evidence ID
 */
export function getEvidenceId(evidence: Record<string, any>): number | null {
  return getEvidenceField<number>(evidence, 'id', 'id', null)
}

/**
 * Get evidence category ID
 */
export function getEvidenceCategoryId(evidence: Record<string, any>): string {
  return getEvidenceField<string>(evidence, 'categoryId', 'category_id', '')
}

/**
 * Get evidence name
 */
export function getEvidenceName(evidence: Record<string, any>): string {
  return getEvidenceField<string>(evidence, 'name', 'name', '')
}

/**
 * Get evidence description
 */
export function getEvidenceDescription(evidence: Record<string, any>): string {
  return getEvidenceField<string>(evidence, 'description', 'description', '')
}

/**
 * Get evidence budget amount
 */
export function getEvidenceBudgetAmount(evidence: Record<string, any>): number {
  return getEvidenceField<number>(evidence, 'budgetAmount', 'budget_amount', 0)
}

/**
 * Get evidence assignee ID
 */
export function getEvidenceAssigneeId(evidence: Record<string, any>): string {
  return getEvidenceField<string>(evidence, 'assigneeId', 'assignee_id', '')
}

/**
 * Get evidence assignee name
 */
export function getEvidenceAssigneeName(evidence: Record<string, any>): string {
  return getEvidenceField<string>(evidence, 'assigneeName', 'assignee_name', '')
}

/**
 * Get evidence due date
 */
export function getEvidenceDueDate(evidence: Record<string, any>): string {
  return getEvidenceField<string>(evidence, 'dueDate', 'due_date', '')
}

/**
 * Get evidence status
 */
export function getEvidenceStatus(evidence: Record<string, any>): string {
  return getEvidenceField<string>(evidence, 'status', 'status', 'pending')
}

/**
 * Get evidence project budget ID
 */
export function getEvidenceProjectBudgetId(evidence: Record<string, any>): number | null {
  return getEvidenceField<number>(evidence, 'projectBudgetId', 'project_budget_id', null)
}

/**
 * Get evidence created date
 */
export function getEvidenceCreatedAt(evidence: Record<string, any>): string {
  return getEvidenceField<string>(evidence, 'createdAt', 'created_at', '')
}

/**
 * Get evidence updated date
 */
export function getEvidenceUpdatedAt(evidence: Record<string, any>): string {
  return getEvidenceField<string>(evidence, 'updatedAt', 'updated_at', '')
}

// ============================================================================
// Evidence Category Utilities
// ============================================================================

/**
 * Get category name from evidence category object
 */
export function getCategoryName(category: Record<string, any>): string {
  return getEvidenceField<string>(category, 'name', 'name', '')
}

/**
 * Get category ID from evidence category object
 */
export function getCategoryId(category: Record<string, any>): number {
  return getEvidenceField<number>(category, 'id', 'id', 0)
}

/**
 * Check if category is personnel cost (인건비)
 */
export function isPersonnelCategory(category: Record<string, any>): boolean {
  const name = getCategoryName(category)
  return name === '인건비' || name.includes('인건비')
}

/**
 * Check if category requires employee assignment
 */
export function requiresEmployeeAssignment(category: Record<string, any>): boolean {
  // 인건비 카테고리는 직원 배정이 필수
  return isPersonnelCategory(category)
}

// ============================================================================
// Evidence Status Utilities
// ============================================================================

/**
 * Get evidence status color for UI display
 */
export function getEvidenceStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'error'
    case 'submitted':
      return 'info'
    default:
      return 'default'
  }
}

/**
 * Get evidence status label (Korean)
 */
export function getEvidenceStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return '승인'
    case 'pending':
      return '대기중'
    case 'rejected':
      return '반려'
    case 'submitted':
      return '제출'
    default:
      return status
  }
}

/**
 * Check if evidence is approved
 */
export function isEvidenceApproved(evidence: Record<string, any>): boolean {
  return getEvidenceStatus(evidence) === 'approved'
}

/**
 * Check if evidence is pending
 */
export function isEvidencePending(evidence: Record<string, any>): boolean {
  return getEvidenceStatus(evidence) === 'pending'
}

/**
 * Check if evidence is rejected
 */
export function isEvidenceRejected(evidence: Record<string, any>): boolean {
  return getEvidenceStatus(evidence) === 'rejected'
}

// ============================================================================
// Evidence Validation
// ============================================================================

/**
 * Validate evidence form data
 */
export function validateEvidenceForm(formData: Record<string, any>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Required fields
  if (!formData.categoryId) {
    errors.push('증빙 카테고리를 선택해주세요.')
  }

  if (!formData.name || !(formData.name as string)?.trim()) {
    errors.push('증빙 항목 이름을 입력해주세요.')
  }

  if (!formData.budgetAmount || parseFloat(formData.budgetAmount as string) <= 0) {
    errors.push('예산 금액을 입력해주세요.')
  }

  if (!formData.dueDate) {
    errors.push('마감일을 입력해주세요.')
  }

  // Date validation
  if (formData.dueDate) {
    const dueDate = new Date(formData.dueDate as string)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dueDate < today) {
      errors.push('마감일은 오늘 이후여야 합니다.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate evidence assignment to employee
 */
export function validateEvidenceAssignment(
  evidence: Record<string, any>,
  employeeId: string | null,
  category: Record<string, any>,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 인건비 카테고리인 경우 직원 배정 필수
  if (requiresEmployeeAssignment(category) && !employeeId) {
    errors.push('인건비 증빙은 직원을 배정해야 합니다.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Evidence Calculations
// ============================================================================

/**
 * Calculate total evidence amount for a project budget
 */
export function calculateTotalEvidenceAmount(evidenceItems: Record<string, any>[]): number {
  return evidenceItems.reduce((sum, item) => {
    return sum + getEvidenceBudgetAmount(item)
  }, 0)
}

/**
 * Calculate evidence amount by category
 */
export function calculateEvidenceAmountByCategory(
  evidenceItems: Record<string, any>[],
  categoryId: string | number,
): number {
  return evidenceItems
    .filter((item) => getEvidenceCategoryId(item) === categoryId.toString())
    .reduce((sum, item) => sum + getEvidenceBudgetAmount(item), 0)
}

/**
 * Calculate evidence amount by status
 */
export function calculateEvidenceAmountByStatus(
  evidenceItems: Record<string, any>[],
  status: string,
): number {
  return evidenceItems
    .filter((item) => getEvidenceStatus(item) === status)
    .reduce((sum, item) => sum + getEvidenceBudgetAmount(item), 0)
}

/**
 * Calculate evidence completion rate
 */
export function calculateEvidenceCompletionRate(evidenceItems: Record<string, any>[]): number {
  if (evidenceItems.length === 0) return 0

  const approvedCount = evidenceItems.filter((item) => isEvidenceApproved(item)).length

  return Math.round((approvedCount / evidenceItems.length) * 100)
}

// ============================================================================
// Evidence Filtering
// ============================================================================

/**
 * Filter evidence items by category
 */
export function filterEvidenceByCategory(
  evidenceItems: Record<string, any>[],
  categoryId: string | number,
): Record<string, any>[] {
  return evidenceItems.filter((item) => getEvidenceCategoryId(item) === categoryId.toString())
}

/**
 * Filter evidence items by status
 */
export function filterEvidenceByStatus(
  evidenceItems: Record<string, any>[],
  status: string,
): Record<string, any>[] {
  return evidenceItems.filter((item) => getEvidenceStatus(item) === status)
}

/**
 * Filter evidence items by assignee
 */
export function filterEvidenceByAssignee(
  evidenceItems: Record<string, any>[],
  assigneeId: string,
): Record<string, any>[] {
  return evidenceItems.filter((item) => getEvidenceAssigneeId(item) === assigneeId)
}

/**
 * Filter overdue evidence items
 */
export function filterOverdueEvidence(evidenceItems: Record<string, any>[]): Record<string, any>[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return evidenceItems.filter((item) => {
    const dueDate = new Date(getEvidenceDueDate(item))
    return dueDate < today && !isEvidenceApproved(item)
  })
}

// ============================================================================
// Evidence Sorting
// ============================================================================

/**
 * Sort evidence items by due date
 */
export function sortEvidenceByDueDate(
  evidenceItems: Record<string, any>[],
  ascending = true,
): Record<string, any>[] {
  return [...evidenceItems].sort((a, b) => {
    const dateA = new Date(getEvidenceDueDate(a)).getTime()
    const dateB = new Date(getEvidenceDueDate(b)).getTime()
    return ascending ? dateA - dateB : dateB - dateA
  })
}

/**
 * Sort evidence items by amount
 */
export function sortEvidenceByAmount(
  evidenceItems: Record<string, any>[],
  ascending = true,
): Record<string, any>[] {
  return [...evidenceItems].sort((a, b) => {
    const amountA = getEvidenceBudgetAmount(a)
    const amountB = getEvidenceBudgetAmount(b)
    return ascending ? amountA - amountB : amountB - amountA
  })
}

/**
 * Sort evidence items by status priority
 */
export function sortEvidenceByStatusPriority(
  evidenceItems: Record<string, any>[],
): Record<string, any>[] {
  const statusPriority: Record<string, number> = {
    rejected: 1,
    pending: 2,
    submitted: 3,
    approved: 4,
  }

  return [...evidenceItems].sort((a, b) => {
    const priorityA = statusPriority[getEvidenceStatus(a)] || 999
    const priorityB = statusPriority[getEvidenceStatus(b)] || 999
    return priorityA - priorityB
  })
}

// ============================================================================
// Evidence Grouping
// ============================================================================

/**
 * Group evidence items by category
 */
export function groupEvidenceByCategory(
  evidenceItems: Record<string, any>[],
): Record<string, Record<string, any>[]> {
  return evidenceItems.reduce(
    (groups, item) => {
      const categoryId = getEvidenceCategoryId(item)
      if (!groups[categoryId]) {
        groups[categoryId] = []
      }
      ;(groups[categoryId] as Record<string, any>[]).push(item)
      return groups
    },
    {} as Record<string, Record<string, any>[]>,
  )
}

/**
 * Group evidence items by status
 */
export function groupEvidenceByStatus(
  evidenceItems: Record<string, any>[],
): Record<string, Record<string, any>[]> {
  return evidenceItems.reduce(
    (groups, item) => {
      const status = getEvidenceStatus(item)
      if (!groups[status]) {
        groups[status] = []
      }
      ;(groups[status] as Record<string, any>[]).push(item)
      return groups
    },
    {} as Record<string, Record<string, any>[]>,
  )
}

/**
 * Group evidence items by assignee
 */
export function groupEvidenceByAssignee(
  evidenceItems: Record<string, any>[],
): Record<string, Record<string, any>[]> {
  return evidenceItems.reduce(
    (groups, item) => {
      const assigneeId = getEvidenceAssigneeId(item) || 'unassigned'
      if (!groups[assigneeId]) {
        groups[assigneeId] = []
      }
      ;(groups[assigneeId] as Record<string, any>[]).push(item)
      return groups
    },
    {} as Record<string, Record<string, any>[]>,
  )
}
