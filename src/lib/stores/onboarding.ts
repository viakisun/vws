import { writable } from 'svelte/store'

// 온보딩 체크리스트 항목
export interface OnboardingChecklistItem {
  id: string
  title: string
  description: string
  category: 'equipment' | 'account' | 'training' | 'documentation' | 'orientation'
  assignedTo: string // 담당자 ID
  dueDate?: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  completedBy?: string
  completedAt?: string
  notes?: string
  required: boolean
}

// 온보딩 프로세스
export interface OnboardingProcess {
  id: string
  employeeId: string
  employeeName: string
  startDate: string
  expectedCompletionDate: string
  actualCompletionDate?: string
  status: 'not-started' | 'in-progress' | 'completed' | 'cancelled'
  checklistItems: OnboardingChecklistItem[]
  mentorId?: string
  buddyId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// 오프보딩 체크리스트 항목
export interface OffboardingChecklistItem {
  id: string
  title: string
  description: string
  category:
    | 'equipment-return'
    | 'account-cleanup'
    | 'knowledge-transfer'
    | 'documentation'
    | 'exit-interview'
  assignedTo: string
  dueDate?: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  completedBy?: string
  completedAt?: string
  notes?: string
  required: boolean
}

// 오프보딩 프로세스
export interface OffboardingProcess {
  id: string
  employeeId: string
  employeeName: string
  lastWorkingDate: string
  startDate: string
  expectedCompletionDate: string
  actualCompletionDate?: string
  status: 'not-started' | 'in-progress' | 'completed' | 'cancelled'
  checklistItems: OffboardingChecklistItem[]
  reason: 'resignation' | 'termination' | 'retirement' | 'contract-end'
  notes?: string
  createdAt: string
  updatedAt: string
}

// 멘토/버디 프로그램
export interface MentorBuddy {
  id: string
  employeeId: string
  mentorId?: string
  buddyId?: string
  startDate: string
  endDate?: string
  status: 'active' | 'completed' | 'cancelled'
  notes?: string
  createdAt: string
}

// 온보딩 템플릿
export interface OnboardingTemplate {
  id: string
  name: string
  description: string
  department?: string
  position?: string
  checklistItems: Omit<OnboardingChecklistItem, 'id' | 'status' | 'completedBy' | 'completedAt'>[]
  createdAt: string
  updatedAt: string
}

// 초기 데이터
const initialOnboardingTemplates: OnboardingTemplate[] = [
  {
    id: 'template-1',
    name: '신입 개발자 온보딩',
    description: '신입 개발자를 위한 표준 온보딩 프로세스',
    department: '개발팀',
    position: '개발자',
    checklistItems: [
      {
        title: '노트북 및 장비 지급',
        description: '개발용 노트북, 모니터, 키보드, 마우스 지급',
        category: 'equipment',
        assignedTo: 'IT팀',
        dueDate: '1일차',
        required: true,
      },
      {
        title: '회사 계정 생성',
        description: '이메일, 슬랙, GitLab, Jira 계정 생성',
        category: 'account',
        assignedTo: 'IT팀',
        dueDate: '1일차',
        required: true,
      },
      {
        title: '개발 환경 설정',
        description: '개발 도구 설치 및 환경 설정',
        category: 'training',
        assignedTo: '멘토',
        dueDate: '2일차',
        required: true,
      },
      {
        title: '회사 오리엔테이션',
        description: '회사 소개, 조직도, 업무 프로세스 안내',
        category: 'orientation',
        assignedTo: 'HR팀',
        dueDate: '1일차',
        required: true,
      },
      {
        title: '보안 교육',
        description: '정보보안 정책 및 보안 교육',
        category: 'training',
        assignedTo: '보안팀',
        dueDate: '3일차',
        required: true,
      },
    ],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const initialOnboardingProcesses: OnboardingProcess[] = [
  {
    id: 'onboarding-1',
    employeeId: 'emp-1',
    employeeName: '김철수',
    startDate: '2023-01-15',
    expectedCompletionDate: '2023-01-22',
    actualCompletionDate: '2023-01-20',
    status: 'completed',
    mentorId: 'emp-3',
    buddyId: 'emp-2',
    checklistItems: [
      {
        id: 'item-1',
        title: '노트북 및 장비 지급',
        description: '개발용 노트북, 모니터, 키보드, 마우스 지급',
        category: 'equipment',
        assignedTo: 'IT팀',
        dueDate: '2023-01-15',
        status: 'completed',
        completedBy: 'IT팀',
        completedAt: '2023-01-15T10:00:00Z',
        required: true,
      },
      {
        id: 'item-2',
        title: '회사 계정 생성',
        description: '이메일, 슬랙, GitLab, Jira 계정 생성',
        category: 'account',
        assignedTo: 'IT팀',
        dueDate: '2023-01-15',
        status: 'completed',
        completedBy: 'IT팀',
        completedAt: '2023-01-15T11:00:00Z',
        required: true,
      },
    ],
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-01-20T00:00:00Z',
  },
]

const initialOffboardingProcesses: OffboardingProcess[] = []

const initialMentorBuddies: MentorBuddy[] = [
  {
    id: 'mentor-1',
    employeeId: 'emp-1',
    mentorId: 'emp-3',
    buddyId: 'emp-2',
    startDate: '2023-01-15',
    status: 'active',
    createdAt: '2023-01-15T00:00:00Z',
  },
]

// 스토어 생성
export const onboardingTemplates = writable<OnboardingTemplate[]>(initialOnboardingTemplates)
export const onboardingProcesses = writable<OnboardingProcess[]>(initialOnboardingProcesses)
export const offboardingProcesses = writable<OffboardingProcess[]>(initialOffboardingProcesses)
export const mentorBuddies = writable<MentorBuddy[]>(initialMentorBuddies)

// 온보딩 템플릿 관리 함수들
export function addOnboardingTemplate(
  template: Omit<OnboardingTemplate, 'id' | 'createdAt' | 'updatedAt'>,
) {
  const newTemplate: OnboardingTemplate = {
    ...template,
    id: `template-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  onboardingTemplates.update((current) => [...current, newTemplate])
}

export function updateOnboardingTemplate(id: string, updates: Partial<OnboardingTemplate>) {
  onboardingTemplates.update((current) =>
    current.map((template) =>
      template.id === id
        ? { ...template, ...updates, updatedAt: new Date().toISOString() }
        : template,
    ),
  )
}

// 온보딩 프로세스 관리 함수들
export function createOnboardingProcess(
  employeeId: string,
  employeeName: string,
  templateId?: string,
  mentorId?: string,
  buddyId?: string,
) {
  let template: OnboardingTemplate | null = null
  if (templateId) {
    onboardingTemplates.subscribe((templates) => {
      template = templates.find((t) => t.id === templateId) || null
    })()
  }

  const checklistItems: OnboardingChecklistItem[] = []
  if (template && typeof template === 'object' && 'checklistItems' in template) {
    const items = (template as Record<string, unknown>).checklistItems
    if (Array.isArray(items)) {
      checklistItems.push(...items.map((item: Record<string, unknown>) => ({
        ...item,
        id: `item-${Date.now()}-${Math.random()}`,
        status: 'pending' as const,
      })))
    }
  }

  const newProcess: OnboardingProcess = {
    id: `onboarding-${Date.now()}`,
    employeeId: employeeId || '',
    employeeName: employeeName || '',
    startDate: new Date().toISOString().split('T')[0] || '',
    expectedCompletionDate:
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    status: 'not-started',
    checklistItems,
    mentorId,
    buddyId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  onboardingProcesses.update((current) => [...current, newProcess])
  return newProcess.id
}

export function updateOnboardingProcess(id: string, updates: Partial<OnboardingProcess>) {
  onboardingProcesses.update((current) =>
    current.map((process) =>
      process.id === id ? { ...process, ...updates, updatedAt: new Date().toISOString() } : process,
    ),
  )
}

export function completeOnboardingChecklistItem(
  processId: string,
  itemId: string,
  completedBy: string,
  notes?: string,
) {
  onboardingProcesses.update((current) =>
    current.map((process) => {
      if (process.id === processId) {
        const updatedItems = process.checklistItems.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              status: 'completed' as const,
              completedBy,
              completedAt: new Date().toISOString(),
              notes,
            }
          }
          return item
        })

        // 모든 필수 항목이 완료되었는지 확인
        const allRequiredCompleted = updatedItems
          .filter((item) => item.required)
          .every((item) => item.status === 'completed')

        return {
          ...process,
          checklistItems: updatedItems,
          status: allRequiredCompleted ? ('completed' as const) : ('in-progress' as const),
          actualCompletionDate: allRequiredCompleted
            ? new Date().toISOString().split('T')[0]
            : undefined,
          updatedAt: new Date().toISOString(),
        }
      }
      return process
    }),
  )
}

// 오프보딩 프로세스 관리 함수들
export function createOffboardingProcess(
  employeeId: string,
  employeeName: string,
  lastWorkingDate: string,
  reason: OffboardingProcess['reason'],
) {
  const checklistItems: OffboardingChecklistItem[] = [
    {
      id: `item-${Date.now()}-1`,
      title: '장비 반납',
      description: '노트북, 모니터, 키보드, 마우스 등 회사 장비 반납',
      category: 'equipment-return',
      assignedTo: 'IT팀',
      status: 'pending',
      required: true,
    },
    {
      id: `item-${Date.now()}-2`,
      title: '계정 정리',
      description: '이메일, 슬랙, GitLab, Jira 등 모든 계정 비활성화',
      category: 'account-cleanup',
      assignedTo: 'IT팀',
      status: 'pending',
      required: true,
    },
    {
      id: `item-${Date.now()}-3`,
      title: '지식 전수',
      description: '담당 업무 및 프로젝트 관련 지식 전수',
      category: 'knowledge-transfer',
      assignedTo: '직속상사',
      status: 'pending',
      required: true,
    },
    {
      id: `item-${Date.now()}-4`,
      title: '퇴사 인터뷰',
      description: '퇴사 사유 및 개선사항 인터뷰',
      category: 'exit-interview',
      assignedTo: 'HR팀',
      status: 'pending',
      required: true,
    },
  ]

  const newProcess: OffboardingProcess = {
    id: `offboarding-${Date.now()}`,
    employeeId,
    employeeName,
    lastWorkingDate: lastWorkingDate || '',
    startDate: new Date().toISOString().split('T')[0] || '',
    expectedCompletionDate:
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    status: 'not-started',
    checklistItems,
    reason,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  offboardingProcesses.update((current) => [...current, newProcess])
  return newProcess.id
}

export function completeOffboardingChecklistItem(
  processId: string,
  itemId: string,
  completedBy: string,
  notes?: string,
) {
  offboardingProcesses.update((current) =>
    current.map((process) => {
      if (process.id === processId) {
        const updatedItems = process.checklistItems.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              status: 'completed' as const,
              completedBy,
              completedAt: new Date().toISOString(),
              notes,
            }
          }
          return item
        })

        // 모든 필수 항목이 완료되었는지 확인
        const allRequiredCompleted = updatedItems
          .filter((item) => item.required)
          .every((item) => item.status === 'completed')

        return {
          ...process,
          checklistItems: updatedItems,
          status: allRequiredCompleted ? ('completed' as const) : ('in-progress' as const),
          actualCompletionDate: allRequiredCompleted
            ? new Date().toISOString().split('T')[0]
            : undefined,
          updatedAt: new Date().toISOString(),
        }
      }
      return process
    }),
  )
}

// 멘토/버디 관리 함수들
export function assignMentorBuddy(employeeId: string, mentorId?: string, buddyId?: string) {
  const newMentorBuddy: MentorBuddy = {
    id: `mentor-${Date.now()}`,
    employeeId,
    mentorId,
    buddyId: buddyId || '',
    startDate: new Date().toISOString().split('T')[0] || '',
    status: 'active',
    createdAt: new Date().toISOString(),
  }

  mentorBuddies.update((current) => [...current, newMentorBuddy])
}

export function updateMentorBuddy(id: string, updates: Partial<MentorBuddy>) {
  mentorBuddies.update((current) =>
    current.map((mentor) => (mentor.id === id ? { ...mentor, ...updates } : mentor)),
  )
}

// 유틸리티 함수들
export function getOnboardingProcessByEmployee(
  employeeId: string,
  processList: OnboardingProcess[],
): OnboardingProcess | undefined {
  return processList.find((process) => process.employeeId === employeeId)
}

export function getOffboardingProcessByEmployee(
  employeeId: string,
  processList: OffboardingProcess[],
): OffboardingProcess | undefined {
  return processList.find((process) => process.employeeId === employeeId)
}

export function getMentorBuddyByEmployee(
  employeeId: string,
  mentorList: MentorBuddy[],
): MentorBuddy | undefined {
  return mentorList.find((mentor) => mentor.employeeId === employeeId && mentor.status === 'active')
}

export function getOnboardingProgress(process: OnboardingProcess): number {
  if (process.checklistItems.length === 0) return 0
  const completedItems = process.checklistItems.filter((item) => item.status === 'completed').length
  return Math.round((completedItems / process.checklistItems.length) * 100)
}

export function getOffboardingProgress(process: OffboardingProcess): number {
  if (process.checklistItems.length === 0) return 0
  const completedItems = process.checklistItems.filter((item) => item.status === 'completed').length
  return Math.round((completedItems / process.checklistItems.length) * 100)
}
