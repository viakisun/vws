import { writable } from 'svelte/store'
import type { BudgetCategoryMaster, ExpenseItem, Approval } from './types'

// 예산 카테고리 마스터 데이터
export const budgetCategoryMaster = writable<BudgetCategoryMaster[]>([
  {
    categoryCode: 'PERSONNEL_CASH',
    nameKo: '인건비(현금)',
    requiredDocs: [
      { type: 'participation_assignment', required: true, templateId: 'TMP-PA-001' },
      { type: 'salary_statement', required: true, templateId: 'TMP-SS-001' },
      { type: 'insurance_tax', required: true, templateId: 'TMP-IT-001' },
      { type: 'salary_allocation', required: true, templateId: 'TMP-SA-001' }
    ],
    defaultWorkflow: {
      steps: ['PM_APPROVAL', 'SUPPORT_REVIEW'],
      sla: 5
    },
    defaultSlaDays: 5,
    defaultOwners: {
      primary: 'R4',
      secondary: 'R2'
    }
  },
  {
    categoryCode: 'PERSONNEL_IN_KIND',
    nameKo: '인건비(현물)',
    requiredDocs: [
      { type: 'participation_assignment', required: true, templateId: 'TMP-PA-001' },
      { type: 'salary_statement', required: true, templateId: 'TMP-SS-001' },
      { type: 'insurance_tax', required: true, templateId: 'TMP-IT-001' },
      { type: 'salary_allocation', required: true, templateId: 'TMP-SA-001' }
    ],
    defaultWorkflow: {
      steps: ['PM_APPROVAL', 'SUPPORT_REVIEW'],
      sla: 5
    },
    defaultSlaDays: 5,
    defaultOwners: {
      primary: 'R4',
      secondary: 'R2'
    }
  },
  {
    categoryCode: 'MATERIAL',
    nameKo: '재료비',
    requiredDocs: [
      { type: 'requisition', required: true, templateId: 'TMP-REQ-001' },
      { type: 'quote', required: true, templateId: 'TMP-QTE-001' },
      { type: 'purchase_order', required: true, templateId: 'TMP-PO-001' },
      { type: 'tax_invoice', required: true },
      { type: 'delivery_note', required: true },
      { type: 'inspection_report', required: true, templateId: 'TMP-INS-001' }
    ],
    defaultWorkflow: {
      steps: ['PM_APPROVAL', 'SUPPORT_REVIEW'],
      sla: 10
    },
    defaultSlaDays: 10,
    defaultOwners: {
      primary: 'R3',
      secondary: 'R4'
    }
  },
  {
    categoryCode: 'RESEARCH_ACTIVITY',
    nameKo: '연구활동비',
    requiredDocs: [
      { type: 'requisition', required: true, templateId: 'TMP-REQ-001' },
      { type: 'activity_plan', required: true, templateId: 'TMP-AP-001' },
      { type: 'activity_report', required: true, templateId: 'TMP-AR-001' },
      { type: 'receipt', required: true }
    ],
    defaultWorkflow: {
      steps: ['PM_APPROVAL', 'SUPPORT_REVIEW'],
      sla: 5
    },
    defaultSlaDays: 5,
    defaultOwners: {
      primary: 'R2',
      secondary: 'R4'
    }
  },
  {
    categoryCode: 'TRAVEL',
    nameKo: '출장비',
    requiredDocs: [
      { type: 'travel_plan', required: true, templateId: 'TMP-TP-001' },
      { type: 'transport_receipt', required: true },
      { type: 'accommodation_receipt', required: true },
      { type: 'travel_report', required: true, templateId: 'TMP-TR-001' }
    ],
    defaultWorkflow: {
      steps: ['PM_APPROVAL', 'SUPPORT_REVIEW'],
      sla: 3
    },
    defaultSlaDays: 3,
    defaultOwners: {
      primary: 'R2',
      secondary: 'R4'
    }
  },
  {
    categoryCode: 'MEETING',
    nameKo: '회의비',
    requiredDocs: [
      { type: 'requisition', required: true, templateId: 'TMP-REQ-001' },
      { type: 'attendee_list', required: true, templateId: 'TMP-AL-001' },
      { type: 'receipt', required: true },
      { type: 'meeting_minutes', required: true, templateId: 'TMP-MM-001' }
    ],
    defaultWorkflow: {
      steps: ['PM_APPROVAL', 'SUPPORT_REVIEW'],
      sla: 3
    },
    defaultSlaDays: 3,
    defaultOwners: {
      primary: 'R3',
      secondary: 'R4'
    }
  },
  {
    categoryCode: 'PATENT',
    nameKo: '특허출원비',
    requiredDocs: [
      { type: 'requisition', required: true, templateId: 'TMP-REQ-001' },
      { type: 'patent_specification', required: true, templateId: 'TMP-PS-001' },
      { type: 'power_of_attorney', required: true, templateId: 'TMP-POA-001' },
      { type: 'fee_receipt', required: true }
    ],
    defaultWorkflow: {
      steps: ['PM_APPROVAL', 'LAB_HEAD_APPROVAL', 'SUPPORT_REVIEW'],
      sla: 5
    },
    defaultSlaDays: 5,
    defaultOwners: {
      primary: 'R3',
      secondary: 'R4'
    }
  },
  {
    categoryCode: 'OFFICE_SUPPLIES',
    nameKo: '사무용품비',
    requiredDocs: [
      { type: 'requisition', required: true, templateId: 'TMP-REQ-001' },
      { type: 'quote', required: true, templateId: 'TMP-QTE-001' },
      { type: 'receipt', required: true },
      { type: 'receipt_confirmation', required: true, templateId: 'TMP-RC-001' }
    ],
    defaultWorkflow: {
      steps: ['PM_APPROVAL', 'SUPPORT_REVIEW'],
      sla: 3
    },
    defaultSlaDays: 3,
    defaultOwners: {
      primary: 'R4',
      secondary: 'R4'
    }
  }
])

// 워크플로우 상태
export const workflowStates = writable<Record<string, any>>({})

// 카테고리별 필수 문서 체크리스트 생성
export function generateDocumentChecklist(
  categoryCode: string,
  categoryMaster: BudgetCategoryMaster[]
): Array<{
  type: string
  required: boolean
  templateId?: string
  status: 'pending' | 'uploaded' | 'verified'
  uploadedAt?: string
  verifiedBy?: string
}> {
  const category = categoryMaster.find(c => c.categoryCode === categoryCode)
  if (!category) return []

  return category.requiredDocs.map(doc => ({
    type: doc.type,
    required: doc.required,
    templateId: doc.templateId,
    status: 'pending' as const
  }))
}

// 문서 업로드 상태 업데이트
export function updateDocumentStatus(
  expenseId: string,
  documentType: string,
  status: 'uploaded' | 'verified',
  verifiedBy?: string
): void {
  workflowStates.update(states => {
    const expenseState = states[expenseId] || { documents: [] }
    const docIndex = expenseState.documents.findIndex((doc: any) => doc.type === documentType)

    if (docIndex !== -1) {
      expenseState.documents[docIndex] = {
        ...expenseState.documents[docIndex],
        status,
        uploadedAt:
          status === 'uploaded'
            ? new Date().toISOString()
            : expenseState.documents[docIndex].uploadedAt,
        verifiedBy: status === 'verified' ? verifiedBy : expenseState.documents[docIndex].verifiedBy
      }
    }

    return {
      ...states,
      [expenseId]: expenseState
    }
  })
}

// 필수 문서 완료 여부 체크
export function isDocumentChecklistComplete(
  expenseId: string,
  categoryCode: string,
  categoryMaster: BudgetCategoryMaster[]
): boolean {
  const category = categoryMaster.find(c => c.categoryCode === categoryCode)
  if (!category) return false

  const requiredDocs = category.requiredDocs.filter(doc => doc.required)

  // 실제 구현에서는 documents 스토어에서 확인
  // 여기서는 간단히 true 반환
  return true
}

// 워크플로우 단계별 승인자 결정
export function getApproversForStep(
  categoryCode: string,
  step: string,
  categoryMaster: BudgetCategoryMaster[]
): string[] {
  const category = categoryMaster.find(c => c.categoryCode === categoryCode)
  if (!category) return []

  switch (step) {
    case 'PM_APPROVAL':
      return ['R2'] // PM
    case 'LAB_HEAD_APPROVAL':
      return ['R5'] // 연구소장
    case 'SUPPORT_REVIEW':
      return ['R4'] // 경영지원
    default:
      return []
  }
}

// SLA 기반 마감일 계산
export function calculateSlaDeadline(
  categoryCode: string,
  categoryMaster: BudgetCategoryMaster[]
): Date {
  const category = categoryMaster.find(c => c.categoryCode === categoryCode)
  if (!category) return new Date()

  const deadline = new Date()
  deadline.setDate(deadline.getDate() + category.defaultSlaDays)
  return deadline
}

// 지출 항목 상태 업데이트
export function updateExpenseStatus(
  expenseId: string,
  status: ExpenseItem['status'],
  comment?: string
): void {
  workflowStates.update(states => {
    return {
      ...states,
      [expenseId]: {
        ...states[expenseId],
        status,
        statusUpdatedAt: new Date().toISOString(),
        statusComment: comment
      }
    }
  })
}

// 결재 워크플로우 진행
export function processApprovalWorkflow(
  expenseId: string,
  approverId: string,
  decision: Approval['decision'],
  comment?: string
): void {
  workflowStates.update(states => {
    const expenseState = states[expenseId] || { approvals: [] }

    // 새로운 승인 추가
    expenseState.approvals = [
      ...expenseState.approvals,
      {
        approverId,
        decision,
        comment,
        decidedAt: new Date().toISOString()
      }
    ]

    // 상태 업데이트
    if (decision === 'approved') {
      expenseState.currentStep = getNextStep(expenseState.currentStep, expenseState.workflow)
    } else if (decision === 'rejected') {
      expenseState.status = 'rejected'
    } else if (decision === 'returned') {
      expenseState.status = 'draft'
    }

    return {
      ...states,
      [expenseId]: expenseState
    }
  })
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

// 카테고리별 기본 소유자 가져오기
export function getDefaultOwners(
  categoryCode: string,
  categoryMaster: BudgetCategoryMaster[]
): {
  primary: string
  secondary: string
} {
  const category = categoryMaster.find(c => c.categoryCode === categoryCode)
  if (!category) return { primary: 'R4', secondary: 'R2' }

  return category.defaultOwners
}

// 워크플로우 상태 가져오기
export function getWorkflowState(expenseId: string): any {
  let state: any = null
  workflowStates.subscribe(states => {
    state = states[expenseId]
  })()
  return state
}

// 지출 항목별 문서 체크리스트 가져오기
export function getExpenseDocumentChecklist(expenseId: string): any[] {
  const state = getWorkflowState(expenseId)
  return state?.documents || []
}

// 지출 항목별 승인 이력 가져오기
export function getExpenseApprovalHistory(expenseId: string): any[] {
  const state = getWorkflowState(expenseId)
  return state?.approvals || []
}
