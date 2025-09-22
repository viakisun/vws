// Mock data for R&D pages
import { writable } from 'svelte/store'
import type { ResearchNote, Report, SubmissionBundle, Document, ExpenseItem } from './types'

// Mock research notes
const mockResearchNotes: ResearchNote[] = [
  {
    id: 'note-001',
    projectId: 'proj-001',
    authorId: 'emp-001',
    weekOf: '2024-01-01',
    title: 'AI 알고리즘 초기 설계',
    contentMd: '# AI 알고리즘 초기 설계\n\n이번 주에는 AI 알고리즘의 초기 설계를 완료했습니다.',
    attachments: [],
    createdAt: '2024-01-05T10:00:00Z'
  },
  {
    id: 'note-002',
    projectId: 'proj-002',
    authorId: 'emp-002',
    weekOf: '2024-01-08',
    title: '배터리 성능 테스트 결과',
    contentMd: '# 배터리 성능 테스트 결과\n\n새로운 배터리 소재의 성능 테스트를 진행했습니다.',
    attachments: [],
    createdAt: '2024-01-12T14:30:00Z'
  }
]

// Mock reports
const mockReports: Report[] = [
  {
    id: 'report-001',
    projectId: 'proj-001',
    type: 'weekly',
    periodStart: '2024-01-01',
    periodEnd: '2024-01-07',
    summaryJson: {
      progress: 75,
      budgetUtilization: 68,
      deliverablesCompleted: 3,
      totalDeliverables: 4,
      risks: ['기술적 난제', '일정 지연 가능성'],
      achievements: ['알고리즘 설계 완료', '데이터 수집 완료'],
      nextWeekGoals: ['프로토타입 개발', '성능 테스트']
    },
    generatedBy: 'emp-001',
    generatedAt: '2024-01-08T09:00:00Z'
  }
]

// Mock submission bundles
const mockSubmissionBundles: SubmissionBundle[] = [
  {
    id: 'bundle-001',
    projectId: 'proj-001',
    period: '2024-Q1',
    fileUrl: '/uploads/bundle-001.zip',
    manifestXml: '<manifest>...</manifest>',
    checksum: 'abc123',
    createdBy: 'emp-001',
    createdAt: '2024-04-01T10:00:00Z',
    status: 'uploaded'
  }
]

// Mock documents
const mockDocuments: Document[] = [
  {
    id: 'doc-001',
    expenseId: 'exp-001',
    documentType: 'receipt',
    fileName: 'receipt-001.pdf',
    fileUrl: '/uploads/receipt-001.pdf',
    uploadedBy: 'emp-001',
    uploadedAt: '2024-01-15T10:00:00Z',
    status: 'approved'
  }
]

// Mock expense items
const mockExpenseItems: ExpenseItem[] = [
  {
    id: 'exp-001',
    projectId: 'proj-001',
    categoryCode: 'MATERIAL',
    requesterId: 'emp-001',
    amount: 500000,
    currency: 'KRW',
    description: '개발용 소프트웨어 라이선스',
    status: 'approved',
    deptOwner: 'AI연구팀',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
]

// Create stores
export const researchNotes = writable<ResearchNote[]>(mockResearchNotes)
export const reports = writable<Report[]>(mockReports)
export const submissionBundles = writable<SubmissionBundle[]>(mockSubmissionBundles)
export const documents = writable<Document[]>(mockDocuments)
export const expenseItems = writable<ExpenseItem[]>(mockExpenseItems)

// Export mock data for direct access
export { mockResearchNotes, mockReports, mockSubmissionBundles, mockDocuments, mockExpenseItems }
