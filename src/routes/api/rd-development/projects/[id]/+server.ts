/**
 * R&D Development Project Detail API
 * 프로젝트 상세 조회, 수정, 삭제
 */

import { RdDevProjectService } from '$lib/services/rd-development'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const projectService = new RdDevProjectService()

/**
 * 프로젝트 상세 조회
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const project = await projectService.getProjectById(params.id)

    if (!project) {
      return json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 },
      )
    }

    return json({
      success: true,
      data: project,
    })
  } catch (error) {
    logger.error('Failed to fetch R&D development project:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * 프로젝트 수정
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const body = await request.json()

    const project = await projectService.updateProject(params.id, {
      project_type: body.project_type,
      total_duration_months: body.total_duration_months,
      government_funding: body.government_funding,
      institution_funding: body.institution_funding,
      phase_1_duration_months: body.phase_1_duration_months,
      phase_2_duration_months: body.phase_2_duration_months,
      phase_3_duration_months: body.phase_3_duration_months,
    })

    return json({
      success: true,
      data: project,
    })
  } catch (error) {
    logger.error('Failed to update R&D development project:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * 프로젝트 삭제
 */
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const deleted = await projectService.deleteProject(params.id)

    if (!deleted) {
      return json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 },
      )
    }

    return json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    logger.error('Failed to delete R&D development project:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
