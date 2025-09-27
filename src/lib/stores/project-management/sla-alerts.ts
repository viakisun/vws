import type { Notification, SLAAlert } from '$lib/types'
import { getCurrentUTC } from '$lib/utils/date-handler'
import { logger } from '$lib/utils/logger'
import { writable } from 'svelte/store'
import { logAudit } from './core'

// SLA 정책 타입 정의
interface SLAPolicy {
  name: string
  entityType: string
  stages: Array<{
    stage: string
    slaDays: number
    alerts: Array<{
      daysBefore?: number
      daysAfter?: number
      type: string
      message: string
    }>
  }>
  escalationPath?: Array<{ role: string; userId: string }>
}

// SLA 알림 관리
export const slaAlerts = writable<SLAAlert[]>([])
export const notifications = writable<Notification[]>([])
export const escalationPolicies = writable<Record<string, SLAPolicy>>({})

// SLA 정책 정의
export function defineSlaPolicies(): void {
  const policies = {
    expense_approval: {
      name: '지출 승인 SLA',
      entityType: 'expense',
      stages: [
        {
          stage: 'PM_APPROVAL',
          slaDays: 2,
          alerts: [
            {
              daysBefore: 1,
              type: 'warning',
              message: 'PM 승인 마감 1일 전입니다.',
            },
            { daysBefore: 0, type: 'breach', message: 'PM 승인 마감일입니다.' },
            {
              daysAfter: 1,
              type: 'escalation',
              message: 'PM 승인 지연 1일 경과',
            },
          ],
        },
        {
          stage: 'SUPPORT_REVIEW',
          slaDays: 3,
          alerts: [
            {
              daysBefore: 1,
              type: 'warning',
              message: '경영지원 검토 마감 1일 전입니다.',
            },
            {
              daysBefore: 0,
              type: 'breach',
              message: '경영지원 검토 마감일입니다.',
            },
            {
              daysAfter: 1,
              type: 'escalation',
              message: '경영지원 검토 지연 1일 경과',
            },
          ],
        },
      ],
      escalationPath: [
        { level: 1, role: 'PM', delayDays: 1 },
        { level: 2, role: 'LAB_HEAD', delayDays: 3 },
        { level: 3, role: 'EXECUTIVE', delayDays: 5 },
      ],
    },
    milestone_delivery: {
      name: '마일스톤 산출물 제출 SLA',
      entityType: 'milestone',
      stages: [
        {
          stage: 'DELIVERY',
          slaDays: 0,
          alerts: [
            {
              daysBefore: 7,
              type: 'warning',
              message: '마일스톤 산출물 제출 7일 전입니다.',
            },
            {
              daysBefore: 3,
              type: 'warning',
              message: '마일스톤 산출물 제출 3일 전입니다.',
            },
            {
              daysBefore: 1,
              type: 'warning',
              message: '마일스톤 산출물 제출 1일 전입니다.',
            },
            {
              daysAfter: 0,
              type: 'breach',
              message: '마일스톤 산출물 제출 마감일입니다.',
            },
            {
              daysAfter: 1,
              type: 'escalation',
              message: '마일스톤 산출물 제출 지연 1일 경과',
            },
          ],
        },
      ],
      escalationPath: [
        { level: 1, role: 'PM', delayDays: 1 },
        { level: 2, role: 'LAB_HEAD', delayDays: 3 },
        { level: 3, role: 'EXECUTIVE', delayDays: 7 },
      ],
    },
    research_note_submission: {
      name: '연구노트 제출 SLA',
      entityType: 'research_note',
      stages: [
        {
          stage: 'SUBMISSION',
          slaDays: 0,
          alerts: [
            {
              daysBefore: 3,
              type: 'warning',
              message: '연구노트 제출 3일 전입니다.',
            },
            {
              daysBefore: 1,
              type: 'warning',
              message: '연구노트 제출 1일 전입니다.',
            },
            {
              daysAfter: 0,
              type: 'breach',
              message: '연구노트 제출 마감일입니다.',
            },
            {
              daysAfter: 3,
              type: 'escalation',
              message: '연구노트 제출 지연 3일 경과',
            },
          ],
        },
      ],
      escalationPath: [
        { level: 1, role: 'PM', delayDays: 3 },
        { level: 2, role: 'LAB_HEAD', delayDays: 7 },
      ],
    },
  }

  escalationPolicies.set(policies as unknown as Record<string, SLAPolicy>)
}

// SLA 알림 생성
export function createSlaAlert(
  entityType: string,
  entityId: string,
  alertType: 'sla-warning' | 'sla-breach' | 'escalation',
  message: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  assignedTo: string[],
): string {
  const alert: SLAAlert = {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    alertType,
    message,
    severity,
    assignedTo,
    triggeredAt: new Date().toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
  }

  slaAlerts.update((alerts) => [...alerts, alert])
  logAudit('create', 'sla_alert', alert.id, {}, alert)

  // 알림 발송
  sendNotification(alert)

  return alert.id
}

// 알림 발송
function sendNotification(alert: SLAAlert): void {
  const notification: Notification = {
    id: crypto.randomUUID(),
    userId: 'current-user', // 실제로는 assignedTo의 각 사용자에게 발송
    title: `SLA 알림: ${alert.alertType}`,
    message: alert.message,
    type: alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info',
    priority: alert.severity,
    read: false,
    actionUrl: `/project-management/${alert.entityType}/${alert.entityId}`,
    createdAt: new Date().toISOString(),
  }

  notifications.update((notifications) => [...notifications, notification])
}

// SLA 체크 및 알림 생성
export function checkSlaCompliance(entityType: string, entityId: string): void {
  const policies = getEscalationPolicies()
  const policy =
    policies[`${entityType}_approval`] ||
    policies[`${entityType}_delivery`] ||
    policies[`${entityType}_submission`]

  if (!policy) return

  // 각 단계별 SLA 체크
  if (policy.stages && Array.isArray(policy.stages)) {
    policy.stages.forEach((stage) => {
      checkStageSla(entityType, entityId, stage, policy.escalationPath || [])
    })
  }
}

// 단계별 SLA 체크
function checkStageSla(
  entityType: string,
  entityId: string,
  stage: {
    stage: string
    slaDays: number
    alerts: Array<{ daysBefore?: number; daysAfter?: number; type: string; message: string }>
  },
  escalationPath: Array<{ role: string; userId: string }>,
): void {
  const entityData = getEntityData(entityType, entityId)
  if (!entityData) return

  const currentStage = getCurrentStage(entityType, entityId)
  if (currentStage !== stage.stage) return

  const daysElapsed = calculateDaysElapsed(String(entityData.createdAt), stage.slaDays)

  // 알림 조건 체크
  stage.alerts.forEach((alert) => {
    if (shouldTriggerAlert(daysElapsed, alert)) {
      const assignedTo = getAssignedUsers(entityType, entityId, escalationPath)
      createSlaAlert(
        entityType,
        entityId,
        alert.type as 'sla-warning' | 'sla-breach' | 'escalation',
        alert.message,
        getSeverityFromAlertType(alert.type),
        assignedTo,
      )
    }
  })
}

// 엔티티 데이터 가져오기
function getEntityData(entityType: string, entityId: string): Record<string, unknown> | null {
  // 실제 구현에서는 해당 엔티티의 데이터를 가져옴
  switch (entityType) {
    case 'expense':
      return {
        id: entityId,
        createdAt: '2024-01-20T00:00:00Z',
        status: 'pending-approval',
      }
    case 'milestone':
      return {
        id: entityId,
        createdAt: '2024-01-15T00:00:00Z',
        dueDate: '2024-01-30T00:00:00Z',
      }
    case 'research_note':
      return {
        id: entityId,
        createdAt: '2024-01-22T00:00:00Z',
        weekOf: '2024-W04',
      }
    default:
      return null
  }
}

// 현재 단계 가져오기
function getCurrentStage(entityType: string, _entityId: string): string {
  // 실제 구현에서는 엔티티의 현재 단계를 가져옴
  switch (entityType) {
    case 'expense':
      return 'PM_APPROVAL'
    case 'milestone':
      return 'DELIVERY'
    case 'research_note':
      return 'SUBMISSION'
    default:
      return ''
  }
}

// 경과 일수 계산
function calculateDaysElapsed(createdAt: string, slaDays: number): number {
  const created = new Date(createdAt)
  const now = new Date(getCurrentUTC())
  const deadline = new Date(created.getTime() + slaDays * 24 * 60 * 60 * 1000)

  return Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))
}

// 알림 발송 조건 체크
function shouldTriggerAlert(
  daysElapsed: number,
  alert: { daysBefore?: number; daysAfter?: number; type: string; message: string },
): boolean {
  if (alert.daysBefore !== undefined) {
    return daysElapsed === -alert.daysBefore
  } else if (alert.daysAfter !== undefined) {
    return daysElapsed === alert.daysAfter
  }
  return false
}

// 알림 타입에서 심각도 결정
function getSeverityFromAlertType(alertType: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (alertType) {
    case 'warning':
      return 'medium'
    case 'breach':
      return 'high'
    case 'escalation':
      return 'critical'
    default:
      return 'low'
  }
}

// 할당된 사용자 가져오기
function getAssignedUsers(
  _entityType: string,
  _entityId: string,
  _escalationPath: unknown[],
): string[] {
  // 실제 구현에서는 엔티티의 담당자와 에스컬레이션 경로를 기반으로 사용자 결정
  const users = ['PM', 'LAB_HEAD', 'EXECUTIVE']
  return users
}

// 에스컬레이션 정책 가져오기
function getEscalationPolicies(): Record<string, SLAPolicy> {
  let policies: Record<string, SLAPolicy> = {}
  escalationPolicies.subscribe((p) => {
    policies = p
  })()
  return policies
}

// SLA 알림 해결
export function resolveSlaAlert(alertId: string, resolvedBy: string, resolution: string): void {
  slaAlerts.update((alerts) => {
    const index = alerts.findIndex((a) => a.id === alertId)
    if (index === -1) return alerts

    const alert = alerts[index]
    const updatedAlert = {
      ...alert,
      status: 'resolved' as const,
      resolvedAt: new Date().toISOString(),
    }

    const newList = [...alerts]
    newList[index] = updatedAlert

    logAudit('resolve', 'sla_alert', alertId, { resolvedBy, resolution }, updatedAlert)

    return newList
  })
}

// SLA 알림 에스컬레이션
export function escalateSlaAlert(alertId: string, escalatedBy: string, reason: string): void {
  slaAlerts.update((alerts) => {
    const index = alerts.findIndex((a) => a.id === alertId)
    if (index === -1) return alerts

    const alert = alerts[index]
    const updatedAlert = {
      ...alert,
      status: 'escalated' as const,
      severity: 'critical' as const,
      assignedTo: Array.isArray(alert.assignedTo)
        ? [...alert.assignedTo, 'EXECUTIVE']
        : ['EXECUTIVE'], // 상위 레벨로 에스컬레이션
    }

    const newList = [...alerts]
    newList[index] = updatedAlert

    logAudit('escalate', 'sla_alert', alertId, { escalatedBy, reason }, updatedAlert)

    return newList
  })
}

// SLA 통계
export function getSlaStatistics(period: 'day' | 'week' | 'month'): Record<string, unknown> {
  let allAlerts: SLAAlert[] = []

  slaAlerts.subscribe((alerts) => {
    allAlerts = alerts
  })()

  const now = new Date()
  const periodStart = getPeriodStart(now, period)

  const periodAlerts = allAlerts.filter((alert) => {
    const createdAt = alert.createdAt ? new Date(alert.createdAt) : new Date(0)
    return createdAt >= periodStart
  })

  const totalAlerts = periodAlerts.length
  const activeAlerts = periodAlerts.filter((a) => a.status === 'active').length
  const resolvedAlerts = periodAlerts.filter((a) => a.status === 'resolved').length
  const escalatedAlerts = periodAlerts.filter((a) => a.status === 'escalated').length

  const severityBreakdown = {
    critical: periodAlerts.filter((a) => a.severity === 'critical').length,
    high: periodAlerts.filter((a) => a.severity === 'high').length,
    medium: periodAlerts.filter((a) => a.severity === 'medium').length,
    low: periodAlerts.filter((a) => a.severity === 'low').length,
  }

  const typeBreakdown = {
    warning: periodAlerts.filter((a) => a.alertType === 'sla-warning').length,
    breach: periodAlerts.filter((a) => a.alertType === 'sla-breach').length,
    escalation: periodAlerts.filter((a) => a.alertType === 'escalation').length,
  }

  const averageResolutionTime = calculateAverageResolutionTime(periodAlerts)

  return {
    period,
    totalAlerts,
    activeAlerts,
    resolvedAlerts,
    escalatedAlerts,
    resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
    escalationRate: totalAlerts > 0 ? (escalatedAlerts / totalAlerts) * 100 : 0,
    severityBreakdown,
    typeBreakdown,
    averageResolutionTime,
  }
}

// 기간 시작일 계산
function getPeriodStart(now: Date, period: string): Date {
  const start = new Date(now)

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0)
      break
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
  }

  return start
}

// 평균 해결 시간 계산
function calculateAverageResolutionTime(alerts: SLAAlert[]): number {
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved' && a.resolvedAt)

  if (resolvedAlerts.length === 0) return 0

  const totalTime = resolvedAlerts.reduce((sum, alert) => {
    const created = alert.createdAt ? new Date(alert.createdAt).getTime() : 0
    const resolved = alert.resolvedAt ? new Date(alert.resolvedAt).getTime() : 0
    return sum + (resolved - created)
  }, 0)

  return totalTime / resolvedAlerts.length
}

// SLA 대시보드 데이터
export function getSlaDashboardData(): Record<string, unknown> {
  const dayStats = getSlaStatistics('day')
  const weekStats = getSlaStatistics('week')
  const monthStats = getSlaStatistics('month')

  let recentAlerts: SLAAlert[] = []
  slaAlerts.subscribe((alerts) => {
    recentAlerts = alerts
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bDate - aDate
      })
      .slice(0, 10)
  })()

  return {
    dayStats,
    weekStats,
    monthStats,
    recentAlerts,
    trends: {
      alertsTrend: calculateTrend(Number(dayStats.totalAlerts), Number(weekStats.totalAlerts)),
      resolutionTrend: calculateTrend(
        Number(dayStats.resolutionRate),
        Number(weekStats.resolutionRate),
      ),
      escalationTrend: calculateTrend(
        Number(dayStats.escalationRate),
        Number(weekStats.escalationRate),
      ),
    },
  }
}

// 트렌드 계산
function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const change = ((current - previous) / previous) * 100

  if (change > 5) return 'up'
  if (change < -5) return 'down'
  return 'stable'
}

// SLA 알림 자동 체크 스케줄링
export function scheduleSlaChecks(): void {
  // 매시간 SLA 체크 실행
  setInterval(
    () => {
      logger.log('Running SLA checks...')

      // 모든 활성 엔티티에 대해 SLA 체크
      checkAllActiveEntities()
    },
    60 * 60 * 1000,
  ) // 1시간마다
}

// 모든 활성 엔티티 SLA 체크
function checkAllActiveEntities(): void {
  // 실제 구현에서는 모든 활성 엔티티를 가져와서 체크
  const activeEntities = [
    { type: 'expense', id: 'expense-1' },
    { type: 'expense', id: 'expense-2' },
    { type: 'milestone', id: 'milestone-1' },
    { type: 'research_note', id: 'note-1' },
  ]

  activeEntities.forEach((entity) => {
    checkSlaCompliance(entity.type, entity.id)
  })
}

// SLA 알림 내보내기
export function exportSlaAlerts(format: 'json' | 'csv' | 'excel', period?: string): string {
  let allAlerts: SLAAlert[] = []

  slaAlerts.subscribe((alerts) => {
    if (period) {
      const periodStart = getPeriodStart(new Date(), period)
      allAlerts = alerts.filter((alert) => {
        const createdAt = alert.createdAt ? new Date(alert.createdAt) : new Date(0)
        return createdAt >= periodStart
      })
    } else {
      allAlerts = alerts
    }
  })()

  if (format === 'json') {
    return JSON.stringify(allAlerts, null, 2)
  } else if (format === 'csv') {
    const csvHeader =
      'ID,Entity Type,Entity ID,Alert Type,Message,Severity,Status,Created At,Resolved At\n'
    const csvRows = allAlerts
      .map(
        (alert) =>
          `${alert.id},${alert.entityType},${alert.entityId},${alert.alertType},"${alert.message}",${alert.severity},${alert.status},${alert.createdAt},${alert.resolvedAt || ''}`,
      )
      .join('\n')
    return csvHeader + csvRows
  }

  return JSON.stringify(allAlerts, null, 2)
}

// SLA 알림 템플릿 관리
export function createSlaTemplate(
  templateName: string,
  entityType: string,
  stages: unknown[],
  escalationPath: unknown[],
): void {
  const template: SLAPolicy = {
    name: templateName,
    entityType,
    stages: stages as SLAPolicy['stages'],
    escalationPath: escalationPath as Array<{ role: string; userId: string }>,
  }

  escalationPolicies.update((policies) => ({
    ...policies,
    [templateName]: template,
  }))
}

// SLA 알림 설정 업데이트
export function updateSlaSettings(
  entityType: string,
  settings: {
    enabled: boolean
    alertChannels: string[]
    escalationEnabled: boolean
    notificationFrequency: 'immediate' | 'daily' | 'weekly'
  },
): void {
  // 실제 구현에서는 SLA 설정을 저장
  logger.log(`SLA settings updated for ${entityType}:`, settings)
}
