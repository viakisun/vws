import { DatabaseService } from '$lib/database/connection'
import type { ApiResponse, DatabaseProject } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface ProjectQueryParams {
  status?: string
  manager_id?: string
  limit?: number
  offset?: number
}

interface CreateProjectRequest {
  code: string
  title: string
  description?: string
  sponsor?: string
  sponsor_type?: string
  start_date?: string
  end_date?: string
  manager_id?: string
  budget_total?: number
  research_type?: string
  technology_area?: string
  priority?: string
  [key: string]: unknown
}

interface Project {
  id: string
  code: string
  title: string
  description?: string
  sponsor?: string
  sponsor_type: string
  start_date?: string
  end_date?: string
  manager_id?: string
  status: string
  budget_total?: number
  research_type?: string
  technology_area?: string
  priority: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

// GET /api/projects - Get all projects
export const GET: RequestHandler = async ({ url }) => {
  try {
    const status = url.searchParams.get('status')
    const manager_id = url.searchParams.get('manager_id')
    const limit = url.searchParams.get('limit')
    const offset = url.searchParams.get('offset')

    const queryParams: ProjectQueryParams = {
      status: status || undefined,
      manager_id: manager_id || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    }

    const projects = await DatabaseService.getProjects(queryParams)

    const response: ApiResponse<Project[]> = {
      success: true,
      data: projects as unknown as Project[],
      count: projects.length,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Get projects error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 목록 조회 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// POST /api/projects - Create new project
export const POST: RequestHandler = async ({ request }) => {
  try {
    const projectData = (await request.json()) as CreateProjectRequest

    // Validate required fields
    if (!projectData.code || !projectData.title) {
      const response: ApiResponse<null> = {
        success: false,
        error: '프로젝트 코드와 제목은 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    // Check if project code already exists
    const existingProject = await DatabaseService.query('SELECT id FROM projects WHERE code = $1', [
      projectData.code,
    ])

    if (existingProject.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: '이미 존재하는 프로젝트 코드입니다.',
      }
      return json(response, { status: 400 })
    }

    const project = await DatabaseService.createProject(projectData as Partial<DatabaseProject>)

    const response: ApiResponse<Project> = {
      success: true,
      data: project as unknown as Project,
    }

    return json(response, { status: 201 })
  } catch (error: unknown) {
    logger.error('Create project error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 생성 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}
