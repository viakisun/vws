// R&D 통합관리 시스템 더미데이터 초기화

import { toUTC } from '$lib/utils/date-handler'
import { approvalWorkflows, approvals, documents, expenseItems } from './expense-workflow'
import type { Approval, ApprovalWorkflow, Document, ExpenseItem } from './types'
import { logger } from '$lib/utils/logger'

// ===== 더미 지출 항목 생성 =====
function generateDummyExpenses(): ExpenseItem[] {
  const categories = [
    'PERSONNEL_CASH',
    'MATERIAL',
    'RESEARCH_ACTIVITY',
    'TRAVEL',
    'MEETING',
    'PATENT',
    'OFFICE_SUPPLIES',
  ]
  const statuses = ['draft', 'pending_approval', 'approved', 'executed', 'completed', 'rejected']
  const projects = ['proj-001', 'proj-002', 'proj-003', 'proj-004', 'proj-005']
  const requesters = [
    'person-002',
    'person-008',
    'person-009',
    'person-011',
    'person-013',
    'person-014',
    'person-015',
  ]
  const deptOwners = [
    '경영지원팀',
    '구매팀',
    'AI연구팀',
    '블록체인팀',
    'IoT팀',
    '총무팀',
    'R&D전략팀',
  ]

  const expenses: ExpenseItem[] = []

  for (let i = 1; i <= 25; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const project = projects[Math.floor(Math.random() * projects.length)]
    const requester = requesters[Math.floor(Math.random() * requesters.length)]
    const deptOwner = deptOwners[Math.floor(Math.random() * deptOwners.length)]

    const amount = Math.floor(Math.random() * 10000000) + 100000 // 10만원 ~ 1000만원
    const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()

    expenses.push({
      id: `exp-${i.toString().padStart(3, '0')}`,
      projectId: project,
      categoryCode: category,
      requesterId: requester,
      amount: amount,
      currency: 'KRW',
      description: `${category} 관련 지출 - ${i}번째 요청`,
      status: status as any,
      deptOwner: deptOwner,
      createdAt: createdAt,
      updatedAt: createdAt,
    })
  }

  return expenses
}

// ===== 더미 문서 생성 =====
function generateDummyDocuments(): Document[] {
  const documentTypes = [
    'REQUISITION',
    'QUOTE',
    'PURCHASE_ORDER',
    'TAX_INVOICE',
    'DELIVERY_NOTE',
    'INSPECTION_REPORT',
    'RECEIPT',
    'MEETING_MINUTES',
    'TRAVEL_REPORT',
    'PATENT_DOCUMENT',
  ]
  const expenses = generateDummyExpenses()
  const documents: Document[] = []

  for (let i = 1; i <= 30; i++) {
    const expense = expenses[Math.floor(Math.random() * expenses.length)]
    const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)]
    const createdAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()

    documents.push({
      id: `doc-${i.toString().padStart(3, '0')}`,
      expenseId: expense.id,
      projectId: expense.projectId,
      type: docType as any,
      filename: `${docType}_${i}.pdf`,
      originalFilename: `${docType}_${i}.pdf`,
      storageUrl: `/storage/documents/${docType}_${i}.pdf`,
      sha256: `sha256_${i}_${Math.random().toString(36).substr(2, 9)}`,
      version: 1,
      meta: {
        fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB ~ 5MB
        uploadedBy: expense.requesterId,
      },
      createdAt: createdAt,
    })
  }

  return documents
}

// ===== 더미 결재 생성 =====
function generateDummyApprovals(): Approval[] {
  const expenses = generateDummyExpenses()
  const approvers = ['person-003', 'person-010', 'person-012', 'person-001', 'person-005']
  const decisions = ['approved', 'rejected', 'pending']
  const approvals: Approval[] = []

  for (let i = 1; i <= 20; i++) {
    const expense = expenses[Math.floor(Math.random() * expenses.length)]
    const approver = approvers[Math.floor(Math.random() * approvers.length)]
    const decision = decisions[Math.floor(Math.random() * decisions.length)]
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()

    approvals.push({
      id: `app-${i.toString().padStart(3, '0')}`,
      subjectType: 'expense',
      subjectId: expense.id,
      stepNo: Math.floor(Math.random() * 3) + 1,
      approverId: approver,
      decision: decision as any,
      comment: decision === 'rejected' ? '추가 서류 필요' : '승인 완료',
      decidedAt: decision !== 'pending' ? createdAt : undefined,
      createdAt: createdAt,
    })
  }

  return approvals
}

// ===== 더미 결재 워크플로우 생성 =====
function generateDummyWorkflows(): ApprovalWorkflow[] {
  const expenses = generateDummyExpenses()
  const workflows: ApprovalWorkflow[] = []

  expenses.forEach((expense, index) => {
    const statuses = ['pending', 'approved', 'rejected', 'cancelled']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const createdAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()

    workflows.push({
      id: `workflow-${index + 1}`,
      subjectType: 'expense',
      subjectId: expense.id,
      currentStep: Math.floor(Math.random() * 3) + 1,
      totalSteps: 3,
      status: status as any,
      createdAt: createdAt,
      updatedAt: createdAt,
    })
  })

  return workflows
}

// ===== 더미데이터 초기화 함수 =====
export function initializeDummyData(): void {
  logger.log('R&D 시스템 더미데이터 초기화 시작...')

  // 지출 항목 초기화
  const dummyExpenses = generateDummyExpenses()
  expenseItems.set(dummyExpenses)
  logger.log(`${dummyExpenses.length}개의 지출 항목 생성 완료`)

  // 문서 초기화
  const dummyDocuments = generateDummyDocuments()
  documents.set(dummyDocuments)
  logger.log(`${dummyDocuments.length}개의 문서 생성 완료`)

  // 결재 초기화
  const dummyApprovals = generateDummyApprovals()
  approvals.set(dummyApprovals)
  logger.log(`${dummyApprovals.length}개의 결재 생성 완료`)

  // 결재 워크플로우 초기화
  const dummyWorkflows = generateDummyWorkflows()
  approvalWorkflows.set(dummyWorkflows)
  logger.log(`${dummyWorkflows.length}개의 결재 워크플로우 생성 완료`)

  logger.log('R&D 시스템 더미데이터 초기화 완료!')
}

// ===== 통계 데이터 생성 =====
export function generateStatistics() {
  let expenses: ExpenseItem[] = []
  expenseItems.subscribe((value) => (expenses = value))()

  const stats = {
    total: expenses.length,
    pending: expenses.filter((e) => e.status === 'pending_approval' || e.status === 'draft').length,
    approved: expenses.filter(
      (e) => e.status === 'approved' || e.status === 'executed' || e.status === 'completed',
    ).length,
    rejected: expenses.filter((e) => e.status === 'rejected').length,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    byCategory: {} as Record<string, number>,
    byProject: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
  }

  // 카테고리별 통계
  expenses.forEach((expense) => {
    stats.byCategory[expense.categoryCode] = (stats.byCategory[expense.categoryCode] || 0) + 1
    stats.byProject[expense.projectId] = (stats.byProject[expense.projectId] || 0) + 1
    stats.byStatus[expense.status] = (stats.byStatus[expense.status] || 0) + 1
  })

  return stats
}

// ===== 랜덤 데이터 생성 유틸리티 =====
export function generateRandomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generateRandomDate(daysAgo: number = 30): string {
  const date = new Date(Date.now() - Math.random() * daysAgo * 24 * 60 * 60 * 1000)
  return toUTC(date)
}

export function generateRandomAmount(min: number = 100000, max: number = 10000000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ===== 샘플 텍스트 생성 =====
export const sampleTexts = {
  descriptions: [
    '연구용 장비 구매',
    '소프트웨어 라이선스 구매',
    '출장비 정산',
    '회의비 지출',
    '특허출원 수수료',
    '사무용품 구매',
    '연구활동비 지출',
    '교육비 지출',
    '컨설팅비 지출',
    '마케팅비 지출',
  ],
  comments: [
    '승인 완료',
    '추가 서류 필요',
    '금액 조정 필요',
    '카테고리 변경 필요',
    '담당자 확인 필요',
    '예산 초과',
    '정상 처리',
    '재검토 필요',
    '즉시 처리',
    '보류',
  ],
  departments: [
    '경영지원팀',
    '구매팀',
    'AI연구팀',
    '블록체인팀',
    'IoT팀',
    '총무팀',
    'R&D전략팀',
    '기술팀',
    '마케팅팀',
    '인사팀',
  ],
}

// ===== 내보내기 =====
export {
  generateDummyApprovals,
  generateDummyDocuments,
  generateDummyExpenses,
  generateDummyWorkflows,
}
