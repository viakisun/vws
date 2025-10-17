/**
 * R&D Development Project Detail Server-side Data Loading
 */

import {
  RdDevDeliverableService,
  RdDevInstitutionService,
  RdDevPhaseService,
  RdDevProjectService,
  RdDevTimelineService,
  RdDevViaRoleService,
} from '$lib/services/rd-development'
import type { PageServerLoad } from './$types'

const projectService = new RdDevProjectService()
const phaseService = new RdDevPhaseService()
const deliverableService = new RdDevDeliverableService()
const institutionService = new RdDevInstitutionService()
const viaRoleService = new RdDevViaRoleService()
const timelineService = new RdDevTimelineService()

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const projectId = params.id

    // 프로젝트 상세 정보와 관련 데이터를 병렬로 로드
    const [project, phases, deliverables, institutions, viaRoles, timelineData] = await Promise.all(
      [
        projectService.getProjectById(projectId),
        phaseService.getPhasesByProjectId(projectId),
        deliverableService.getDeliverables({ project_id: projectId }),
        institutionService.getInstitutionsByProjectId(projectId),
        viaRoleService.getViaRolesByProjectId(projectId),
        timelineService.getProjectTimeline(projectId),
      ],
    )

    if (!project) {
      return {
        project: null,
        phases: [],
        deliverables: [],
        institutions: [],
        viaRoles: [],
        timelineData: null,
        user: locals.user || null,
        error: 'Project not found',
      }
    }

    return {
      project,
      phases,
      deliverables,
      institutions,
      viaRoles,
      timelineData,
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
      user: locals.user || null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
