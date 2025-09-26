import type { Approval, Milestone } from '$lib/types'
import { writable } from 'svelte/store'
import { logAudit } from './core'

// 마일스톤 관리
export const milestones = writable<Milestone[]>([])
export const milestoneDeliverables = writable<Record<string, unknown[]>>({})

// 분기 목표/산출물 생성
export function createMilestone(
  projectId: string,
  quarter: number,
  title: string,
  kpis: Record<string, unknown>,
  dueDate: string,
  ownerId: string,
  deliverables: string[] = [],
): string {
  const milestone: Milestone = {
    id: crypto.randomUUID(),
    projectId,
    quarter,
    title,
    kpis,
    dueDate,
    ownerId,
    status: 'not-started',
    deliverables,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  milestones.update((list) => [...list, milestone])
  logAudit('create', 'milestone', milestone.id, {}, milestone)

  return milestone.id
}

// 마일스톤 수정
export function updateMilestone(milestoneId: string, updates: Partial<Milestone>): void {
  milestones.update((list) => {
    const index = list.findIndex((m) => m.id === milestoneId)
    if (index === -1) return list

    const oldMilestone = list[index]
    const updatedMilestone = {
      ...oldMilestone,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    const newList = [...list]
    newList[index] = updatedMilestone

    logAudit('update', 'milestone', milestoneId, oldMilestone, updatedMilestone)
    return newList
  })
}

// 마일스톤 상태 업데이트
export function updateMilestoneStatus(
  milestoneId: string,
  status: Milestone['status'],
  comment?: string,
): void {
  updateMilestone(milestoneId, { status })

  if (comment) {
    logAudit('status_change', 'milestone', milestoneId, { status, comment }, {})
  }
}

// 산출물 업로드
export function uploadDeliverable(
  milestoneId: string,
  deliverableName: string,
  filename: string,
  storageUrl: string,
  sha256: string,
  description?: string,
): string {
  const deliverable = {
    id: crypto.randomUUID(),
    milestoneId,
    name: deliverableName,
    filename,
    storageUrl,
    sha256,
    description,
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'current-user',
    version: 1,
    status: 'uploaded',
  }

  milestoneDeliverables.update((deliverables) => {
    const milestoneDeliverables = deliverables[milestoneId] || []
    return {
      ...deliverables,
      [milestoneId]: [...milestoneDeliverables, deliverable],
    }
  })

  logAudit('upload', 'deliverable', deliverable.id, {}, deliverable)

  // 마일스톤 상태 자동 업데이트
  checkMilestoneCompletion(milestoneId)

  return deliverable.id
}

// 마일스톤 완료 여부 체크
function checkMilestoneCompletion(milestoneId: string): void {
  milestones.update((list) => {
    const milestone = list.find((m) => m.id === milestoneId)
    if (!milestone) return list

    milestoneDeliverables.update((deliverables) => {
      const milestoneDeliverables = deliverables[milestoneId] || []
      const requiredDeliverables = milestone.deliverables
      const uploadedDeliverables = milestoneDeliverables.filter((d) => d.status === 'uploaded')

      // 모든 필수 산출물이 업로드되었는지 확인
      const allDeliverablesUploaded = requiredDeliverables.every((required) =>
        uploadedDeliverables.some((uploaded) => uploaded.name === required),
      )

      // 마일스톤 상태 업데이트
      if (allDeliverablesUploaded && milestone.status !== 'completed') {
        const updatedMilestone = {
          ...milestone,
          status: 'completed' as const,
          updatedAt: new Date().toISOString(),
        }

        const index = list.findIndex((m) => m.id === milestoneId)
        if (index !== -1) {
          const newList = [...list]
          newList[index] = updatedMilestone

          logAudit('complete', 'milestone', milestoneId, milestone, updatedMilestone)
          return newList
        }
      }

      return list
    })

    return list
  })
}

// KPI 업데이트
export function updateMilestoneKPI(
  milestoneId: string,
  kpiName: string,
  value: any,
  comment?: string,
): void {
  milestones.update((list) => {
    const index = list.findIndex((m) => m.id === milestoneId)
    if (index === -1) return list

    const milestone = list[index]
    const updatedKpis = {
      ...milestone.kpis,
      [kpiName]: {
        value,
        updatedAt: new Date().toISOString(),
        comment,
      },
    }

    const updatedMilestone = {
      ...milestone,
      kpis: updatedKpis,
      updatedAt: new Date().toISOString(),
    }

    const newList = [...list]
    newList[index] = updatedMilestone

    logAudit('update_kpi', 'milestone', milestoneId, { kpiName, value, comment }, updatedKpis)
    return newList
  })
}

// 프로젝트별 마일스톤 목록
export function getMilestonesByProject(projectId: string): Milestone[] {
  let projectMilestones: Milestone[] = []

  milestones.subscribe((list) => {
    projectMilestones = list
      .filter((m) => m.projectId === projectId)
      .sort((a, b) => a.quarter - b.quarter)
  })()

  return projectMilestones
}

// 분기별 마일스톤 목록
export function getMilestonesByQuarter(projectId: string, quarter: number): Milestone[] {
  let quarterMilestones: Milestone[] = []

  milestones.subscribe((list) => {
    quarterMilestones = list
      .filter((m) => m.projectId === projectId && m.quarter === quarter)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  })()

  return quarterMilestones
}

// 마일스톤별 산출물 목록
export function getMilestoneDeliverables(milestoneId: string): unknown[] {
  let deliverables: unknown[] = []

  milestoneDeliverables.subscribe((deliverableMap) => {
    deliverables = deliverableMap[milestoneId] || []
  })()

  return deliverables
}

// 마일스톤 달성률 계산
export function calculateMilestoneProgress(milestoneId: string): {
  progress: number
  completedDeliverables: number
  totalDeliverables: number
  status: 'on-track' | 'at-risk' | 'delayed'
} {
  let milestone: Milestone | undefined
  let deliverables: unknown[] = []

  milestones.subscribe((list) => {
    milestone = list.find((m) => m.id === milestoneId)
  })()

  milestoneDeliverables.subscribe((deliverableMap) => {
    deliverables = deliverableMap[milestoneId] || []
  })()

  if (!milestone) {
    return {
      progress: 0,
      completedDeliverables: 0,
      totalDeliverables: 0,
      status: 'delayed',
    }
  }

  const totalDeliverables = milestone.deliverables.length
  const completedDeliverables = deliverables.filter((d) => d.status === 'uploaded').length
  const progress = totalDeliverables > 0 ? (completedDeliverables / totalDeliverables) * 100 : 0

  // 상태 결정
  let status: 'on-track' | 'at-risk' | 'delayed' = 'on-track'
  const now = new Date()
  const dueDate = new Date(milestone.dueDate)
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilDue < 0) {
    status = 'delayed'
  } else if (daysUntilDue <= 7 && progress < 80) {
    status = 'at-risk'
  }

  return { progress, completedDeliverables, totalDeliverables, status }
}

// 프로젝트 전체 진행률 계산
export function calculateProjectProgress(projectId: string): {
  overallProgress: number
  quarterProgress: Record<number, number>
  milestoneStatus: Record<string, unknown>
} {
  const projectMilestones = getMilestonesByProject(projectId)
  const quarterProgress: Record<number, number> = {}
  const milestoneStatus: Record<string, unknown> = {}

  let totalProgress = 0
  let totalMilestones = 0

  projectMilestones.forEach((milestone) => {
    const progress = calculateMilestoneProgress(milestone.id)
    milestoneStatus[milestone.id] = progress

    totalProgress += progress.progress
    totalMilestones++

    if (!quarterProgress[milestone.quarter]) {
      quarterProgress[milestone.quarter] = 0
    }
    quarterProgress[milestone.quarter] += progress.progress
  })

  // 분기별 평균 계산
  Object.keys(quarterProgress).forEach((quarter) => {
    const quarterMilestones = projectMilestones.filter((m) => m.quarter === parseInt(quarter))
    quarterProgress[parseInt(quarter)] =
      quarterProgress[parseInt(quarter)] / quarterMilestones.length
  })

  const overallProgress = totalMilestones > 0 ? totalProgress / totalMilestones : 0

  return { overallProgress, quarterProgress, milestoneStatus }
}

// 지연된 마일스톤 목록
export function getDelayedMilestones(): Milestone[] {
  let delayedMilestones: Milestone[] = []

  milestones.subscribe((list) => {
    const now = new Date()
    delayedMilestones = list.filter((milestone) => {
      const dueDate = new Date(milestone.dueDate)
      const isOverdue = dueDate < now
      const isNotCompleted = milestone.status !== 'completed'
      return isOverdue && isNotCompleted
    })
  })()

  return delayedMilestones
}

// 위험 상태 마일스톤 목록
export function getAtRiskMilestones(): Milestone[] {
  let atRiskMilestones: Milestone[] = []

  milestones.subscribe((list) => {
    atRiskMilestones = list.filter((milestone) => {
      const progress = calculateMilestoneProgress(milestone.id)
      return progress.status === 'at-risk'
    })
  })()

  return atRiskMilestones
}

// 마일스톤 승인 요청
export function requestMilestoneApproval(
  milestoneId: string,
  approverId: string,
  comment?: string,
): string {
  const approval: Approval = {
    id: crypto.randomUUID(),
    subjectType: 'milestone',
    subjectId: milestoneId,
    stepNo: 1,
    approverId,
    decision: 'pending',
    comment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  logAudit('approval_request', 'milestone', milestoneId, { approverId, comment }, approval)

  return approval.id
}

// 마일스톤 승인 처리
export function approveMilestone(
  milestoneId: string,
  approverId: string,
  decision: 'approved' | 'rejected',
  comment?: string,
): void {
  updateMilestoneStatus(milestoneId, decision === 'approved' ? 'completed' : 'not-started', comment)

  logAudit('approval_decision', 'milestone', milestoneId, { approverId, decision, comment }, {})
}

// 분기별 목표 설정 템플릿
export function createQuarterlyMilestoneTemplate(
  projectId: string,
  quarter: number,
  templateType: 'research' | 'development' | 'commercialization',
): Milestone[] {
  const templates = {
    research: [
      {
        title: '문헌 조사 및 기술 분석',
        kpis: { literature_review: 0, technical_analysis: 0 },
        deliverables: ['문헌조사보고서', '기술분석보고서'],
      },
      {
        title: '실험 설계 및 초기 실험',
        kpis: { experiment_design: 0, initial_experiments: 0 },
        deliverables: ['실험설계서', '초기실험결과'],
      },
      {
        title: '중간 결과 분석 및 보고',
        kpis: { data_analysis: 0, interim_report: 0 },
        deliverables: ['중간보고서', '데이터분석결과'],
      },
    ],
    development: [
      {
        title: '요구사항 분석 및 설계',
        kpis: { requirements_analysis: 0, system_design: 0 },
        deliverables: ['요구사항명세서', '시스템설계서'],
      },
      {
        title: '프로토타입 개발',
        kpis: { prototype_development: 0, testing: 0 },
        deliverables: ['프로토타입', '테스트결과'],
      },
      {
        title: '성능 최적화 및 검증',
        kpis: { optimization: 0, validation: 0 },
        deliverables: ['최적화결과', '검증보고서'],
      },
    ],
    commercialization: [
      {
        title: '시장 분석 및 사업화 계획',
        kpis: { market_analysis: 0, business_plan: 0 },
        deliverables: ['시장분석보고서', '사업화계획서'],
      },
      {
        title: '파일럿 테스트 및 검증',
        kpis: { pilot_test: 0, validation: 0 },
        deliverables: ['파일럿테스트결과', '검증보고서'],
      },
      {
        title: '사업화 준비 및 실행',
        kpis: { commercialization_prep: 0, execution: 0 },
        deliverables: ['사업화준비보고서', '실행계획서'],
      },
    ],
  }

  const template = templates[templateType]
  const createdMilestones: Milestone[] = []

  template.forEach((item, index) => {
    const dueDate = new Date()
    dueDate.setMonth(dueDate.getMonth() + (index + 1) * 4) // 분기별로 4개월씩

    const milestoneId = createMilestone(
      projectId,
      quarter,
      item.title,
      item.kpis,
      dueDate.toISOString().split('T')[0],
      'current-user',
      item.deliverables,
    )

    createdMilestones.push({
      id: milestoneId,
      projectId,
      quarter,
      title: item.title,
      kpis: item.kpis,
      dueDate: dueDate.toISOString().split('T')[0],
      ownerId: 'current-user',
      status: 'not-started',
      deliverables: item.deliverables,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  return createdMilestones
}

// 마일스톤 리포트 생성
export function generateMilestoneReport(
  projectId: string,
  quarter?: number,
): {
  summary: any
  milestones: Milestone[]
  deliverables: Record<string, unknown[]>
  progress: any
} {
  const projectMilestones = quarter
    ? getMilestonesByQuarter(projectId, quarter)
    : getMilestonesByProject(projectId)

  const deliverables: Record<string, unknown[]> = {}
  const progress = calculateProjectProgress(projectId)

  projectMilestones.forEach((milestone) => {
    deliverables[milestone.id] = getMilestoneDeliverables(milestone.id)
  })

  const summary = {
    totalMilestones: projectMilestones.length,
    completedMilestones: projectMilestones.filter((m) => m.status === 'completed').length,
    delayedMilestones: getDelayedMilestones().filter((m) => m.projectId === projectId).length,
    atRiskMilestones: getAtRiskMilestones().filter((m) => m.projectId === projectId).length,
    overallProgress: progress.overallProgress,
  }

  return { summary, milestones: projectMilestones, deliverables, progress }
}
