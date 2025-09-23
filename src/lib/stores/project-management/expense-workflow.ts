import { writable } from 'svelte/store'
import type { ExpenseItem, Approval, SLAAlert, Notification } from './types'
import { logAudit } from './core'

// 지출 워크플로우 상태
export const expenseWorkflows = writable<Record<string, any>>({})

// SLA 알림
export const slaAlerts = writable<SLAAlert[]>([])

// 알림
export const notifications = writable<Notification[]>([])

// 지출 워크플로우 단계
export const EXPENSE_WORKFLOW_STEPS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending-approval',
  APPROVED: 'approved',
  EXECUTED: 'executed',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  RETURNED: 'returned'
} as const

// 지출 워크플로우 시작
export function startExpenseWorkflow(
  expenseId: string,
  categoryCode: string,
  requesterId: string,
  amount: number,
  description?: string
): void {
  const workflow = {
    expenseId,
    categoryCode,
    requesterId,
    amount,
    description,
    status: EXPENSE_WORKFLOW_STEPS.DRAFT,
    currentStep: 'PM_APPROVAL',
    workflow: {
      steps: ['PM_APPROVAL', 'SUPPORT_REVIEW'],
      sla: 5
    },
    documents: [],
    approvals: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slaDeadline: calculateSlaDeadline(categoryCode)
  }

  expenseWorkflows.update(workflows => ({
    ...workflows,
    [expenseId]: workflow
  }))

  logAudit('create', 'expense_workflow', expenseId, {}, workflow)
}

// 문서 업로드
export function uploadDocument(
  expenseId: string,
  documentType: string,
  filename: string,
  storageUrl: string,
  sha256: string
): void {
  const document = {
    id: crypto.randomUUID(),
    type: documentType,
    filename,
    storageUrl,
    sha256,
    version: 1,
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'current-user'
  }

  expenseWorkflows.update(workflows => {
    const workflow = workflows[expenseId]
    if (!workflow) return workflows

    const updatedWorkflow = {
      ...workflow,
      documents: [...workflow.documents, document],
      updatedAt: new Date().toISOString()
    }

    return {
      ...workflows,
      [expenseId]: updatedWorkflow
    }
  })

  logAudit('upload', 'document', document.id, {}, document)
}

// 결재 진행
export function processApproval(
  expenseId: string,
  approverId: string,
  decision: Approval['decision'],
  comment?: string
): void {
  const approval = {
    id: crypto.randomUUID(),
    approverId,
    decision,
    comment,
    decidedAt: new Date().toISOString()
  }

  expenseWorkflows.update(workflows => {
    const workflow = workflows[expenseId]
    if (!workflow) return workflows

    const updatedWorkflow = {
      ...workflow,
      approvals: [...workflow.approvals, approval],
      updatedAt: new Date().toISOString()
    }

    // 다음 단계 결정
    if (decision === 'approved') {
      updatedWorkflow.currentStep = getNextStep(workflow.currentStep, workflow.workflow)
      updatedWorkflow.status = getStatusFromStep(updatedWorkflow.currentStep)
    } else if (decision === 'rejected') {
      updatedWorkflow.status = EXPENSE_WORKFLOW_STEPS.REJECTED
    } else if (decision === 'returned') {
      updatedWorkflow.status = EXPENSE_WORKFLOW_STEPS.RETURNED
      updatedWorkflow.currentStep = 'PM_APPROVAL'
    }

    return {
      ...workflows,
      [expenseId]: updatedWorkflow
    }
  })

  logAudit('approve', 'expense', expenseId, { decision, comment }, approval)

  // 알림 생성
  createApprovalNotification(expenseId, decision, comment)
}

// 다음 워크플로우 단계 결정
function getNextStep(currentStep: string, workflow: any): string {
  const steps = workflow?.steps || []
  const currentIndex = steps.indexOf(currentStep)

  if (currentIndex === -1 || currentIndex >= steps.length - 1) {
    return 'completed'
  }

  return steps[currentIndex + 1]
}

// 단계에서 상태 결정
function getStatusFromStep(step: string): string {
  switch (step) {
    case 'PM_APPROVAL':
      return EXPENSE_WORKFLOW_STEPS.PENDING_APPROVAL
    case 'SUPPORT_REVIEW':
      return EXPENSE_WORKFLOW_STEPS.APPROVED
    case 'completed':
      return EXPENSE_WORKFLOW_STEPS.COMPLETED
    default:
      return EXPENSE_WORKFLOW_STEPS.DRAFT
  }
}

// SLA 마감일 계산
function calculateSlaDeadline(categoryCode: string): string {
  const slaDays = getSlaDaysForCategory(categoryCode)
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + slaDays)
  return deadline.toISOString()
}

// 카테고리별 SLA 일수
function getSlaDaysForCategory(categoryCode: string): number {
  const slaMap: Record<string, number> = {
    PERSONNEL_CASH: 5,
    PERSONNEL_IN_KIND: 5,
    MATERIAL: 10,
    RESEARCH_ACTIVITY: 5,
    TRAVEL: 3,
    MEETING: 3,
    PATENT: 5,
    OFFICE_SUPPLIES: 3
  }

  return slaMap[categoryCode] || 5
}

// SLA 알림 생성
export function createSlaAlert(
  expenseId: string,
  alertType: 'sla-warning' | 'sla-breach' | 'escalation',
  message: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): void {
  const alert: SLAAlert = {
    id: crypto.randomUUID(),
    entityType: 'expense',
    entityId: expenseId,
    alertType,
    message,
    severity,
    assignedTo: getAssignedUsersForAlert(expenseId, alertType),
    status: 'active',
    createdAt: new Date().toISOString()
  }

  slaAlerts.update(alerts => [...alerts, alert])
}

// 알림 생성
function createApprovalNotification(
  expenseId: string,
  decision: Approval['decision'],
  comment?: string
): void {
  const notification: Notification = {
    id: crypto.randomUUID(),
    userId: 'current-user', // 실제로는 관련자 ID
    title: `지출 승인 ${decision === 'approved' ? '완료' : decision === 'rejected' ? '거부' : '반려'}`,
    message: `지출 항목 ${expenseId}이 ${decision === 'approved' ? '승인' : decision === 'rejected' ? '거부' : '반려'}되었습니다.${comment ? ` 코멘트: ${comment}` : ''}`,
    type: decision === 'approved' ? 'success' : 'warning',
    priority: 'medium',
    read: false,
    actionUrl: `/project-management/expenses/${expenseId}`,
    createdAt: new Date().toISOString()
  }

  notifications.update(notifications => [...notifications, notification])
}

// 알림 대상자 결정
function getAssignedUsersForAlert(expenseId: string, alertType: string): string[] {
  // 실제 구현에서는 워크플로우 상태를 확인하여 관련자 결정
  switch (alertType) {
    case 'sla-warning':
      return ['PM', 'SUPPORT']
    case 'sla-breach':
      return ['PM', 'SUPPORT', 'LAB_HEAD']
    case 'escalation':
      return ['LAB_HEAD', 'EXECUTIVE']
    default:
      return ['PM']
  }
}

// 지출 워크플로우 상태 가져오기
export function getExpenseWorkflow(expenseId: string): any {
  let workflow: any = null
  expenseWorkflows.subscribe(workflows => {
    workflow = workflows[expenseId]
  })()
  return workflow
}

// 지출 항목별 문서 목록 가져오기
export function getExpenseDocuments(expenseId: string): any[] {
  const workflow = getExpenseWorkflow(expenseId)
  return workflow?.documents || []
}

// 지출 항목별 승인 이력 가져오기
export function getExpenseApprovals(expenseId: string): any[] {
  const workflow = getExpenseWorkflow(expenseId)
  return workflow?.approvals || []
}

// SLA 상태 체크
export function checkSlaStatus(expenseId: string): {
  status: 'on-time' | 'warning' | 'breach'
  daysRemaining: number
  deadline: string
} {
  const workflow = getExpenseWorkflow(expenseId)
  if (!workflow) {
    return { status: 'on-time', daysRemaining: 0, deadline: '' }
  }

  const now = new Date()
  const deadline = new Date(workflow.slaDeadline)
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) {
    return { status: 'breach', daysRemaining, deadline: workflow.slaDeadline }
  } else if (daysRemaining <= 1) {
    return { status: 'warning', daysRemaining, deadline: workflow.slaDeadline }
  } else {
    return { status: 'on-time', daysRemaining, deadline: workflow.slaDeadline }
  }
}

// 지출 항목 상태 업데이트
export function updateExpenseStatus(
  expenseId: string,
  status: ExpenseItem['status'],
  comment?: string
): void {
  expenseWorkflows.update(workflows => {
    const workflow = workflows[expenseId]
    if (!workflow) return workflows

    const updatedWorkflow = {
      ...workflow,
      status,
      statusUpdatedAt: new Date().toISOString(),
      statusComment: comment,
      updatedAt: new Date().toISOString()
    }

    return {
      ...workflows,
      [expenseId]: updatedWorkflow
    }
  })

  logAudit('update', 'expense_status', expenseId, { status, comment }, {})
}

// 지출 항목 완료 처리
export function completeExpense(expenseId: string, comment?: string): void {
  updateExpenseStatus(expenseId, EXPENSE_WORKFLOW_STEPS.COMPLETED, comment)

  // 완료 알림 생성
  const notification: Notification = {
    id: crypto.randomUUID(),
    userId: 'current-user',
    title: '지출 항목 완료',
    message: `지출 항목 ${expenseId}이 완료되었습니다.`,
    type: 'success',
    priority: 'low',
    read: false,
    actionUrl: `/project-management/expenses/${expenseId}`,
    createdAt: new Date().toISOString()
  }

  notifications.update(notifications => [...notifications, notification])
}

// 지출 항목 거부 처리
export function rejectExpense(expenseId: string, reason: string): void {
  updateExpenseStatus(expenseId, EXPENSE_WORKFLOW_STEPS.REJECTED, reason)

  // 거부 알림 생성
  const notification: Notification = {
    id: crypto.randomUUID(),
    userId: 'current-user',
    title: '지출 항목 거부',
    message: `지출 항목 ${expenseId}이 거부되었습니다. 사유: ${reason}`,
    type: 'error',
    priority: 'high',
    read: false,
    actionUrl: `/project-management/expenses/${expenseId}`,
    createdAt: new Date().toISOString()
  }

  notifications.update(notifications => [...notifications, notification])
}

// 지출 항목 반려 처리
export function returnExpense(expenseId: string, reason: string): void {
  updateExpenseStatus(expenseId, EXPENSE_WORKFLOW_STEPS.RETURNED, reason)

  // 반려 알림 생성
  const notification: Notification = {
    id: crypto.randomUUID(),
    userId: 'current-user',
    title: '지출 항목 반려',
    message: `지출 항목 ${expenseId}이 반려되었습니다. 사유: ${reason}`,
    type: 'warning',
    priority: 'medium',
    read: false,
    actionUrl: `/project-management/expenses/${expenseId}`,
    createdAt: new Date().toISOString()
  }

  notifications.update(notifications => [...notifications, notification])
}

// 지출 항목별 필수 문서 체크
export function checkRequiredDocuments(
  expenseId: string,
  categoryCode: string
): {
  complete: boolean
  missing: string[]
  uploaded: string[]
} {
  const workflow = getExpenseWorkflow(expenseId)
  if (!workflow) {
    return { complete: false, missing: [], uploaded: [] }
  }

  // 카테고리별 필수 문서 목록 (실제로는 budgetCategoryMaster에서 가져옴)
  const requiredDocs = getRequiredDocumentsForCategory(categoryCode)
  const uploadedDocs = workflow.documents.map((doc: any) => doc.type)

  const missing = requiredDocs.filter(doc => !uploadedDocs.includes(doc))
  const complete = missing.length === 0

  return { complete, missing, uploaded: uploadedDocs }
}

// 카테고리별 필수 문서 목록
function getRequiredDocumentsForCategory(categoryCode: string): string[] {
  const docMap: Record<string, string[]> = {
    PERSONNEL_CASH: [
      'participation_assignment',
      'salary_statement',
      'insurance_tax',
      'salary_allocation'
    ],
    PERSONNEL_IN_KIND: [
      'participation_assignment',
      'salary_statement',
      'insurance_tax',
      'salary_allocation'
    ],
    MATERIAL: [
      'requisition',
      'quote',
      'purchase_order',
      'tax_invoice',
      'delivery_note',
      'inspection_report'
    ],
    RESEARCH_ACTIVITY: ['requisition', 'activity_plan', 'activity_report', 'receipt'],
    TRAVEL: ['travel_plan', 'transport_receipt', 'accommodation_receipt', 'travel_report'],
    MEETING: ['requisition', 'attendee_list', 'receipt', 'meeting_minutes'],
    PATENT: ['requisition', 'patent_specification', 'power_of_attorney', 'fee_receipt'],
    OFFICE_SUPPLIES: ['requisition', 'quote', 'receipt', 'receipt_confirmation']
  }

  return docMap[categoryCode] || []
}
