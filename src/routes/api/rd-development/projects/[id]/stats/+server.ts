/**
 * R&D Development Project Stats API
 * 프로젝트 통계 정보
 */

import {
  RdDevDeliverableService,
  RdDevPhaseService,
  RdDevProjectService,
} from '$lib/services/rd-development'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const projectService = new RdDevProjectService()
const phaseService = new RdDevPhaseService()
const deliverableService = new RdDevDeliverableService()

/**
 * 프로젝트 통계 조회
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const [project, phaseProgress, institutionStats, phaseStats] = await Promise.all([
      projectService.getProjectById(params.id),
      phaseService.getPhaseProgress(params.id),
      deliverableService.getDeliverableStatsByInstitution(params.id),
      deliverableService.getDeliverableStatsByPhase(params.id),
    ])

    if (!project) {
      return json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 },
      )
    }

    // 전체 통계 계산
    const totalDeliverables = phaseStats.reduce((sum, stat) => sum + stat.total, 0)
    const completedDeliverables = phaseStats.reduce((sum, stat) => sum + stat.completed, 0)
    const overallProgress =
      totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0

    const stats = {
      project_id: params.id,
      overall_progress: overallProgress,
      total_deliverables: totalDeliverables,
      completed_deliverables: completedDeliverables,
      in_progress_deliverables: phaseStats.reduce((sum, stat) => sum + stat.in_progress, 0),
      planned_deliverables: phaseStats.reduce((sum, stat) => sum + stat.planned, 0),
      delayed_deliverables: phaseStats.reduce((sum, stat) => sum + stat.delayed, 0),
      institutions_count: institutionStats.length,
      phases_count: phaseProgress.length,
      phase_progress: phaseProgress,
      institution_stats: institutionStats,
      phase_stats: phaseStats,
    }

    return json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error('Failed to fetch project stats:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
