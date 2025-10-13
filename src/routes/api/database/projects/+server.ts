import { DatabaseService } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// TODO: 실제 ProjectService로 교체 필요
declare module '$lib/database/connection' {
  namespace DatabaseService {
    function getProjects(params: any): Promise<any>
    function createProject(data: any): Promise<any>
    function getProjectById(id: string): Promise<any>
  }
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status') || undefined
    const manager_id = url.searchParams.get('manager_id') || undefined

    const projects = await DatabaseService.getProjects({
      status,
      manager_id,
      limit,
      offset,
    })

    const response: ApiResponse<typeof projects> = {
      success: true,
      data: projects,
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('Get projects error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return json(response, { status: 500 })
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const projectData = (await request.json()) as Record<string, unknown>

    const newProject = await DatabaseService.createProject(projectData)

    const response: ApiResponse<typeof newProject> = {
      success: true,
      data: newProject,
      message: 'Project created successfully',
    }
    return json(response, { status: 201 })
  } catch (error: unknown) {
    logger.error('Create project error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return json(response, { status: 500 })
  }
}
