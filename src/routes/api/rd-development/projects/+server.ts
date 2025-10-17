/**
 * R&D Development Projects API
 * 프로젝트 CRUD 엔드포인트
 */

import { RdDevProjectService } from '$lib/services/rd-development'
import type { RdDevProjectFilters } from '$lib/types/rd-development'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const projectService = new RdDevProjectService()

/**
 * 프로젝트 목록 조회
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const filters: RdDevProjectFilters = {
      project_type: (url.searchParams.get('project_type') as any) || undefined,
      status: url.searchParams.get('status') || undefined,
      search: url.searchParams.get('search') || undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      offset: url.searchParams.get('offset')
        ? parseInt(url.searchParams.get('offset')!)
        : undefined,
    }

    const projects = await projectService.getProjects(filters)

    return json({
      success: true,
      data: projects,
      pagination: {
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        total: projects.length,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch R&D development projects:', error)
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
 * 프로젝트 생성
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()

    if (!body.project_id) {
      return json(
        {
          success: false,
          error: 'project_id is required',
        },
        { status: 400 },
      )
    }

    if (!body.project_type || !body.total_duration_months) {
      return json(
        {
          success: false,
          error: 'project_type and total_duration_months are required',
        },
        { status: 400 },
      )
    }

    const project = await projectService.createProject(body.project_id, {
      project_type: body.project_type,
      total_duration_months: body.total_duration_months,
      government_funding: body.government_funding,
      institution_funding: body.institution_funding,
      phase_1_duration_months: body.phase_1_duration_months,
      phase_2_duration_months: body.phase_2_duration_months,
      phase_3_duration_months: body.phase_3_duration_months,
    })

    return json(
      {
        success: true,
        data: project,
      },
      { status: 201 },
    )
  } catch (error) {
    logger.error('Failed to create R&D development project:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
