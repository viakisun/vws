/**
 * R&D Development Project Detail Server-side Data Loading
 */

import {
  RdDevCalendarEventService,
  RdDevDeliverableService,
  RdDevInstitutionService,
  RdDevKpiService,
  RdDevPhaseService,
  RdDevProjectService,
  RdDevTestLocationService,
  RdDevTimelineService,
  RdDevVerificationScenarioService,
  RdDevViaRoleService,
} from '$lib/services/rd-development'
import type { PageServerLoad } from './$types'

const projectService = new RdDevProjectService()
const phaseService = new RdDevPhaseService()
const deliverableService = new RdDevDeliverableService()
const institutionService = new RdDevInstitutionService()
const viaRoleService = new RdDevViaRoleService()
const timelineService = new RdDevTimelineService()
const kpiService = new RdDevKpiService()
const scenarioService = new RdDevVerificationScenarioService()
const testLocationService = new RdDevTestLocationService()
const calendarEventService = new RdDevCalendarEventService()

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const projectId = params.id

    // 프로젝트 상세 정보와 관련 데이터를 병렬로 로드
    const [
      project,
      phases,
      deliverables,
      institutions,
      viaRoles,
      timelineData,
      kpis,
      kpiStats,
      scenarios,
      testLocations,
      upcomingEvents,
      technicalSpecs,
    ] = await Promise.all([
      projectService.getProjectById(projectId),
      phaseService.getPhasesByProjectId(projectId),
      deliverableService.getDeliverables({ project_id: projectId }),
      institutionService.getInstitutionsByProjectId(projectId),
      viaRoleService.getViaRolesByProjectId(projectId),
      timelineService.getProjectTimeline(projectId),
      kpiService.getKpisByProjectId(projectId),
      kpiService.getKpiStats(projectId),
      scenarioService.getScenariosByProjectId(projectId),
      testLocationService.getTestLocationsByProjectId(projectId),
      calendarEventService.getUpcomingEvents(projectId, 30),
      // 기술 사양 로드 (추가)
      Promise.resolve([]), // TODO: 실제 서비스가 있으면 교체
    ])

    if (!project) {
      return {
        project: null,
        phases: [],
        deliverables: [],
        institutions: [],
        viaRoles: [],
        timelineData: null,
        technicalSpecs: [],
        kpis: [],
        kpiStats: null,
        scenarios: [],
        testLocations: [],
        upcomingEvents: [],
        user: locals.user || null,
        error: 'Project not found',
      }
    }

    // 추가 데이터 가공
    const now = new Date()

    // 현재 진행 중인 phase 찾기
    const currentPhase = phases.find((p: any) => {
      const start = new Date(p.start_date)
      const end = new Date(p.end_date)
      return start <= now && now <= end
    })

    // 7일 이내 마감 산출물
    const urgentDeliverables = deliverables.filter((d: any) => {
      if (!d.target_date || d.status === 'completed') return false
      const daysUntil = Math.ceil(
        (new Date(d.target_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
      return daysUntil <= 7 && daysUntil >= 0
    })

    // 지연된 KPI
    const delayedKpis = kpis.filter((k: any) => k.status === '지연')

    // institution별 deliverable 매핑
    const deliverablesByInstitution = deliverables.reduce((acc: Record<string, any[]>, d: any) => {
      const instId = d.institution_id
      if (!acc[instId]) acc[instId] = []
      acc[instId].push(d)
      return acc
    }, {})

    return {
      project,
      phases,
      deliverables,
      institutions,
      viaRoles,
      timelineData,
      technicalSpecs,
      kpis,
      kpiStats,
      scenarios,
      testLocations,
      upcomingEvents,
      // 추가 가공 데이터
      currentPhase,
      urgentDeliverables,
      delayedKpis,
      deliverablesByInstitution,
      user: locals.user || null,
      error: null,
    }
  } catch (error) {
    console.error('Failed to load R&D development project details:', error)

    return {
      project: null,
      phases: [],
      deliverables: [],
      institutions: [],
      viaRoles: [],
      timelineData: null,
      technicalSpecs: [],
      kpis: [],
      kpiStats: null,
      scenarios: [],
      testLocations: [],
      upcomingEvents: [],
      currentPhase: null,
      urgentDeliverables: [],
      delayedKpis: [],
      deliverablesByInstitution: {},
      user: locals.user || null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
