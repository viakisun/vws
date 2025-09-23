import { writable } from 'svelte/store'
import type {
  HealthIndicator
} from './types'
import { logAudit } from './core'
import { logger } from '$lib/utils/logger';

// 헬스 인디케이터 관리
export const healthIndicators = writable<HealthIndicator[]>([])
export const healthRules = writable<Record<string, unknown>>({})

// 헬스 인디케이터 계산
export function calculateHealthIndicator(projectId: string): HealthIndicator {
  const scheduleScore = calculateScheduleHealth(projectId)
  const budgetScore = calculateBudgetHealth(projectId)
  const peopleScore = calculatePeopleHealth(projectId)
  const riskScore = calculateRiskHealth(projectId)

  const overallScore = (scheduleScore + budgetScore + peopleScore + riskScore) / 4
  const overallStatus = determineOverallStatus(overallScore)

  const indicator: HealthIndicator = {
    projectId,
    schedule: scheduleScore,
    budget: budgetScore,
    people: peopleScore,
    risk: riskScore,
    overall: overallStatus,
    lastUpdated: new Date().toISOString()
  }

  // 기존 인디케이터 업데이트 또는 새로 생성
  healthIndicators.update(list => {
    const index = list.findIndex(h => h.projectId === projectId)
    if (index !== -1) {
      const newList = [...list]
      newList[index] = indicator
      return newList
    } else {
      return [...list, indicator]
    }
  })

  logAudit('calculate', 'health_indicator', projectId, {}, indicator)

  return indicator
}

// 일정 헬스 계산
function calculateScheduleHealth(projectId: string): number {
  // 1. 마일스톤 달성률 (40%)
  const milestoneScore = calculateMilestoneHealth(projectId)

  // 2. 산출물 제출률 (30%)
  const deliverableScore = calculateDeliverableHealth(projectId)

  // 3. 일정 준수율 (30%)
  const scheduleComplianceScore = calculateScheduleCompliance(projectId)

  const totalScore = milestoneScore * 0.4 + deliverableScore * 0.3 + scheduleComplianceScore * 0.3
  return Math.round(totalScore)
}

// 마일스톤 헬스 계산
function calculateMilestoneHealth(projectId: string): number {
  // 실제 구현에서는 milestones 스토어에서 데이터 가져오기
  const mockMilestones = [
    { status: 'completed', dueDate: '2024-01-15', completedDate: '2024-01-14' },
    { status: 'in-progress', dueDate: '2024-01-30', completedDate: null },
    { status: 'not-started', dueDate: '2024-02-15', completedDate: null },
    { status: 'delayed', dueDate: '2024-01-20', completedDate: null }
  ]

  const totalMilestones = mockMilestones.length
  const completedMilestones = mockMilestones.filter(m => m.status === 'completed').length
  const delayedMilestones = mockMilestones.filter(m => m.status === 'delayed').length

  const completionRate = (completedMilestones / totalMilestones) * 100
  const delayPenalty = delayedMilestones * 10 // 지연당 10점 감점

  return Math.max(0, completionRate - delayPenalty)
}

// 산출물 헬스 계산
function calculateDeliverableHealth(projectId: string): number {
  // 실제 구현에서는 deliverables 데이터를 분석
  const mockDeliverables = [
    { status: 'delivered', dueDate: '2024-01-15', deliveredDate: '2024-01-14' },
    { status: 'delivered', dueDate: '2024-01-20', deliveredDate: '2024-01-18' },
    { status: 'pending', dueDate: '2024-01-25', deliveredDate: null },
    { status: 'overdue', dueDate: '2024-01-10', deliveredDate: null }
  ]

  const totalDeliverables = mockDeliverables.length
  const deliveredDeliverables = mockDeliverables.filter(d => d.status === 'delivered').length
  const overdueDeliverables = mockDeliverables.filter(d => d.status === 'overdue').length

  const deliveryRate = (deliveredDeliverables / totalDeliverables) * 100
  const overduePenalty = overdueDeliverables * 15 // 연체당 15점 감점

  return Math.max(0, deliveryRate - overduePenalty)
}

// 일정 준수율 계산
function calculateScheduleCompliance(projectId: string): number {
  // 실제 구현에서는 프로젝트 일정과 실제 진행률을 비교
  const projectStart = new Date('2024-01-01')
  const projectEnd = new Date('2024-12-31')
  const currentDate = new Date()

  const totalDuration = projectEnd.getTime() - projectStart.getTime()
  const elapsedDuration = currentDate.getTime() - projectStart.getTime()
  const expectedProgress = (elapsedDuration / totalDuration) * 100

  // 실제 진행률 (마일스톤 기반)
  const actualProgress = 65 // 실제 구현에서는 계산

  const complianceRate = Math.min(100, (actualProgress / expectedProgress) * 100)

  if (complianceRate >= 100) return 100
  if (complianceRate >= 90) return 90
  if (complianceRate >= 80) return 80
  if (complianceRate >= 70) return 70
  return Math.max(0, complianceRate)
}

// 예산 헬스 계산
function calculateBudgetHealth(projectId: string): number {
  // 1. 예산 집행률 (40%)
  const executionScore = calculateBudgetExecutionScore(projectId)

  // 2. 예산 효율성 (30%)
  const efficiencyScore = calculateBudgetEfficiencyScore(projectId)

  // 3. 예산 편차 (30%)
  const varianceScore = calculateBudgetVarianceScore(projectId)

  const totalScore = executionScore * 0.4 + efficiencyScore * 0.3 + varianceScore * 0.3
  return Math.round(totalScore)
}

// 예산 집행률 점수 계산
function calculateBudgetExecutionScore(projectId: string): number {
  // 실제 구현에서는 예산 데이터를 분석
  const totalBudget = 100000000
  const executedAmount = 60000000
  const executionRate = (executedAmount / totalBudget) * 100

  // 이상적인 집행률은 70-90%
  if (executionRate >= 70 && executionRate <= 90) return 100
  if (executionRate >= 60 && executionRate < 70) return 80
  if (executionRate > 90 && executionRate <= 100) return 70
  if (executionRate >= 50 && executionRate < 60) return 60
  return Math.max(0, executionRate)
}

// 예산 효율성 점수 계산
function calculateBudgetEfficiencyScore(projectId: string): number {
  // 실제 구현에서는 ROI, 비용 대비 성과 등을 분석
  const plannedROI = 150 // 계획된 ROI (%)
  const actualROI = 120 // 실제 ROI (%)

  const efficiencyRate = (actualROI / plannedROI) * 100
  return Math.min(100, efficiencyRate)
}

// 예산 편차 점수 계산
function calculateBudgetVarianceScore(projectId: string): number {
  // 실제 구현에서는 카테고리별 예산 편차를 분석
  const categoryVariances = [
    { category: 'PERSONNEL_CASH', variance: 5 }, // 5% 편차
    { category: 'MATERIAL', variance: -10 }, // 10% 절약
    { category: 'RESEARCH_ACTIVITY', variance: 15 } // 15% 초과
  ]

  const averageVariance =
    categoryVariances.reduce((sum, cat) => sum + Math.abs(cat.variance), 0) /
    categoryVariances.length

  // 편차가 적을수록 높은 점수
  if (averageVariance <= 5) return 100
  if (averageVariance <= 10) return 80
  if (averageVariance <= 15) return 60
  if (averageVariance <= 20) return 40
  return Math.max(0, 100 - averageVariance)
}

// 인력 헬스 계산
function calculatePeopleHealth(projectId: string): number {
  // 1. 참여율 충족도 (40%)
  const participationScore = calculateParticipationHealth(projectId)

  // 2. 인력 안정성 (30%)
  const stabilityScore = calculateStabilityHealth(projectId)

  // 3. 성과 수준 (30%)
  const performanceScore = calculatePerformanceHealth(projectId)

  const totalScore = participationScore * 0.4 + stabilityScore * 0.3 + performanceScore * 0.3
  return Math.round(totalScore)
}

// 참여율 헬스 계산
function calculateParticipationHealth(projectId: string): number {
  // 실제 구현에서는 participationAssignments 데이터를 분석
  const mockParticipants = [
    { personId: 'person-1', assignedRate: 100, actualRate: 95 },
    { personId: 'person-2', assignedRate: 80, actualRate: 85 },
    { personId: 'person-3', assignedRate: 60, actualRate: 55 },
    { personId: 'person-4', assignedRate: 100, actualRate: 100 }
  ]

  const totalParticipants = mockParticipants.length
  let totalScore = 0

  mockParticipants.forEach(participant => {
    const rate = participant.actualRate / participant.assignedRate
    if (rate >= 0.9 && rate <= 1.1) {
      totalScore += 100 // 이상적인 참여율
    } else if (rate >= 0.8 && rate < 0.9) {
      totalScore += 80 // 약간 부족
    } else if (rate > 1.1 && rate <= 1.2) {
      totalScore += 70 // 약간 초과
    } else {
      totalScore += Math.max(0, rate * 100) // 비례 점수
    }
  })

  return totalScore / totalParticipants
}

// 인력 안정성 헬스 계산
function calculateStabilityHealth(projectId: string): number {
  // 실제 구현에서는 인력 이탈률, 교체 빈도 등을 분석
  const mockStabilityData = {
    totalParticipants: 8,
    departures: 1,
    replacements: 1,
    averageTenure: 18, // months
    turnoverRate: 12.5 // %
  }

  const turnoverScore = Math.max(0, 100 - mockStabilityData.turnoverRate * 2)
  const tenureScore = Math.min(100, mockStabilityData.averageTenure * 5)

  return (turnoverScore + tenureScore) / 2
}

// 성과 수준 헬스 계산
function calculatePerformanceHealth(projectId: string): number {
  // 실제 구현에서는 성과 평가 데이터를 분석
  const mockPerformanceData = {
    excellent: 3,
    good: 4,
    average: 1,
    belowAverage: 0,
    poor: 0
  }

  const totalParticipants = Object.values(mockPerformanceData).reduce(
    (sum, count) => sum + count,
    0
  )
  const weightedScore =
    mockPerformanceData.excellent * 100 +
    mockPerformanceData.good * 80 +
    mockPerformanceData.average * 60 +
    mockPerformanceData.belowAverage * 40 +
    mockPerformanceData.poor * 20

  return weightedScore / totalParticipants
}

// 리스크 헬스 계산
function calculateRiskHealth(projectId: string): number {
  // 1. 기술적 리스크 (30%)
  const technicalRiskScore = calculateTechnicalRiskScore(projectId)

  // 2. 일정 리스크 (25%)
  const scheduleRiskScore = calculateScheduleRiskScore(projectId)

  // 3. 예산 리스크 (25%)
  const budgetRiskScore = calculateBudgetRiskScore(projectId)

  // 4. 인력 리스크 (20%)
  const peopleRiskScore = calculatePeopleRiskScore(projectId)

  const totalScore =
    technicalRiskScore * 0.3 +
    scheduleRiskScore * 0.25 +
    budgetRiskScore * 0.25 +
    peopleRiskScore * 0.2
  return Math.round(totalScore)
}

// 기술적 리스크 점수 계산
function calculateTechnicalRiskScore(projectId: string): number {
  // 실제 구현에서는 기술적 이슈, 복잡도 등을 분석
  const mockTechnicalRisks = [
    { type: 'complexity', level: 'medium', impact: 'high' },
    { type: 'dependency', level: 'high', impact: 'medium' },
    { type: 'innovation', level: 'high', impact: 'high' }
  ]

  let totalRiskScore = 0
  mockTechnicalRisks.forEach(risk => {
    const levelScore = risk.level === 'low' ? 20 : risk.level === 'medium' ? 50 : 80
    const impactScore = risk.impact === 'low' ? 20 : risk.impact === 'medium' ? 50 : 80
    totalRiskScore += (levelScore + impactScore) / 2
  })

  const averageRiskScore = totalRiskScore / mockTechnicalRisks.length
  return Math.max(0, 100 - averageRiskScore)
}

// 일정 리스크 점수 계산
function calculateScheduleRiskScore(projectId: string): number {
  // 실제 구현에서는 일정 지연 위험을 분석
  const mockScheduleRisks = {
    delayedMilestones: 2,
    totalMilestones: 8,
    criticalPathDelays: 1,
    bufferConsumption: 60 // %
  }

  const delayRate = (mockScheduleRisks.delayedMilestones / mockScheduleRisks.totalMilestones) * 100
  const bufferScore = Math.max(0, 100 - mockScheduleRisks.bufferConsumption)
  const criticalPathScore = mockScheduleRisks.criticalPathDelays > 0 ? 50 : 100

  return (delayRate + bufferScore + criticalPathScore) / 3
}

// 예산 리스크 점수 계산
function calculateBudgetRiskScore(projectId: string): number {
  // 실제 구현에서는 예산 초과 위험을 분석
  const mockBudgetRisks = {
    overrunCategories: 1,
    totalCategories: 5,
    remainingBudget: 40000000,
    estimatedRemainingCost: 50000000,
    contingencyUsed: 20 // %
  }

  const overrunRate = (mockBudgetRisks.overrunCategories / mockBudgetRisks.totalCategories) * 100
  const budgetAdequacy =
    (mockBudgetRisks.remainingBudget / mockBudgetRisks.estimatedRemainingCost) * 100
  const contingencyScore = Math.max(0, 100 - mockBudgetRisks.contingencyUsed)

  return (overrunRate + budgetAdequacy + contingencyScore) / 3
}

// 인력 리스크 점수 계산
function calculatePeopleRiskScore(projectId: string): number {
  // 실제 구현에서는 인력 이탈 위험을 분석
  const mockPeopleRisks = {
    keyPersonnelAtRisk: 1,
    totalKeyPersonnel: 3,
    skillGaps: 2,
    workloadImbalance: 30 // %
  }

  const keyPersonnelRisk =
    (mockPeopleRisks.keyPersonnelAtRisk / mockPeopleRisks.totalKeyPersonnel) * 100
  const skillGapScore = Math.max(0, 100 - mockPeopleRisks.skillGaps * 20)
  const workloadScore = Math.max(0, 100 - mockPeopleRisks.workloadImbalance)

  return (keyPersonnelRisk + skillGapScore + workloadScore) / 3
}

// 전체 상태 결정
function determineOverallStatus(overallScore: number): 'green' | 'amber' | 'red' {
  if (overallScore >= 80) return 'green'
  if (overallScore >= 60) return 'amber'
  return 'red'
}

// 헬스 인디케이터 규칙 정의
export function defineHealthRules(): void {
  const rules = {
    schedule: {
      green: { min: 80, max: 100, description: '일정이 계획대로 진행되고 있음' },
      amber: { min: 60, max: 79, description: '일정에 약간의 지연이 있음' },
      red: { min: 0, max: 59, description: '일정에 심각한 지연이 있음' }
    },
    budget: {
      green: { min: 80, max: 100, description: '예산이 효율적으로 집행되고 있음' },
      amber: { min: 60, max: 79, description: '예산 집행에 주의가 필요함' },
      red: { min: 0, max: 59, description: '예산 집행에 심각한 문제가 있음' }
    },
    people: {
      green: { min: 80, max: 100, description: '인력이 안정적으로 운영되고 있음' },
      amber: { min: 60, max: 79, description: '인력 관리에 주의가 필요함' },
      red: { min: 0, max: 59, description: '인력에 심각한 문제가 있음' }
    },
    risk: {
      green: { min: 80, max: 100, description: '리스크가 잘 관리되고 있음' },
      amber: { min: 60, max: 79, description: '리스크 관리에 주의가 필요함' },
      red: { min: 0, max: 59, description: '심각한 리스크가 존재함' }
    }
  }

  healthRules.set(rules)
}

// 헬스 인디케이터 트렌드 분석
export function analyzeHealthTrend(projectId: string, period: 'week' | 'month' | 'quarter'): any {
  // 실제 구현에서는 과거 헬스 인디케이터 데이터를 분석
  const mockTrendData = {
    week: [
      { date: '2024-01-01', overall: 85, schedule: 80, budget: 90, people: 85, risk: 85 },
      { date: '2024-01-08', overall: 82, schedule: 78, budget: 88, people: 83, risk: 82 },
      { date: '2024-01-15', overall: 80, schedule: 75, budget: 85, people: 80, risk: 80 },
      { date: '2024-01-22', overall: 78, schedule: 72, budget: 82, people: 78, risk: 78 }
    ],
    month: [
      { month: '2024-01', overall: 85, schedule: 80, budget: 90, people: 85, risk: 85 },
      { month: '2024-02', overall: 82, schedule: 78, budget: 88, people: 83, risk: 82 },
      { month: '2024-03', overall: 80, schedule: 75, budget: 85, people: 80, risk: 80 }
    ],
    quarter: [
      { quarter: 'Q1-2024', overall: 85, schedule: 80, budget: 90, people: 85, risk: 85 },
      { quarter: 'Q2-2024', overall: 82, schedule: 78, budget: 88, people: 83, risk: 82 }
    ]
  }

  return mockTrendData[period]
}

// 헬스 인디케이터 알림 생성
export function createHealthAlert(projectId: string, indicator: HealthIndicator): void {
  const alerts = []

  // 각 영역별 알림 생성
  if (indicator.schedule < 60) {
    alerts.push({
      type: 'schedule',
      severity: 'high',
      message: `일정 헬스 점수가 ${indicator.schedule}점으로 낮습니다.`
    })
  }

  if (indicator.budget < 60) {
    alerts.push({
      type: 'budget',
      severity: 'high',
      message: `예산 헬스 점수가 ${indicator.budget}점으로 낮습니다.`
    })
  }

  if (indicator.people < 60) {
    alerts.push({
      type: 'people',
      severity: 'high',
      message: `인력 헬스 점수가 ${indicator.people}점으로 낮습니다.`
    })
  }

  if (indicator.risk < 60) {
    alerts.push({
      type: 'risk',
      severity: 'high',
      message: `리스크 헬스 점수가 ${indicator.risk}점으로 낮습니다.`
    })
  }

  // 전체 상태가 Red인 경우
  if (indicator.overall === 'red') {
    alerts.push({
      type: 'overall',
      severity: 'critical',
      message: `프로젝트 전체 헬스 상태가 Red입니다. 즉시 조치가 필요합니다.`
    })
  }

  // 알림 발송 (실제 구현에서는 알림 시스템에 전송)
  alerts.forEach(alert => {
    logger.log(`Health Alert for ${projectId}:`, alert)
  })
}

// 헬스 인디케이터 대시보드 데이터
export function getHealthDashboardData(): any {
  let allIndicators: HealthIndicator[] = []

  healthIndicators.subscribe(list => {
    allIndicators = list
  })()

  const greenCount = allIndicators.filter(h => h.overall === 'green').length
  const amberCount = allIndicators.filter(h => h.overall === 'amber').length
  const redCount = allIndicators.filter(h => h.overall === 'red').length

  const averageSchedule =
    allIndicators.length > 0
      ? allIndicators.reduce((sum, h) => sum + h.schedule, 0) / allIndicators.length
      : 0
  const averageBudget =
    allIndicators.length > 0
      ? allIndicators.reduce((sum, h) => sum + h.budget, 0) / allIndicators.length
      : 0
  const averagePeople =
    allIndicators.length > 0
      ? allIndicators.reduce((sum, h) => sum + h.people, 0) / allIndicators.length
      : 0
  const averageRisk =
    allIndicators.length > 0
      ? allIndicators.reduce((sum, h) => sum + h.risk, 0) / allIndicators.length
      : 0

  return {
    totalProjects: allIndicators.length,
    greenCount,
    amberCount,
    redCount,
    averageScores: {
      schedule: Math.round(averageSchedule),
      budget: Math.round(averageBudget),
      people: Math.round(averagePeople),
      risk: Math.round(averageRisk)
    },
    recentIndicators: allIndicators
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 10)
  }
}

// 헬스 인디케이터 자동 업데이트
export function scheduleHealthIndicatorUpdates(): void {
  // 실제 구현에서는 주기적으로 헬스 인디케이터를 업데이트
  setInterval(
    () => {
      // 모든 활성 프로젝트에 대해 헬스 인디케이터 계산
      logger.log('Updating health indicators...')
    },
    24 * 60 * 60 * 1000
  ) // 24시간마다
}

// 헬스 인디케이터 내보내기
export function exportHealthIndicators(format: 'json' | 'csv' | 'excel'): string {
  let allIndicators: HealthIndicator[] = []

  healthIndicators.subscribe(list => {
    allIndicators = list
  })()

  if (format === 'json') {
    return JSON.stringify(allIndicators, null, 2)
  } else if (format === 'csv') {
    const csvHeader = 'Project ID,Schedule,Budget,People,Risk,Overall,Last Updated\n'
    const csvRows = allIndicators
      .map(
        h =>
          `${h.projectId},${h.schedule},${h.budget},${h.people},${h.risk},${h.overall},${h.lastUpdated}`
      )
      .join('\n')
    return csvHeader + csvRows
  }

  return JSON.stringify(allIndicators, null, 2)
}
