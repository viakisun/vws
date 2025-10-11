import { DatabaseService } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import type { DatabaseProject } from '$lib/types/index'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface UpdateProjectRequest {
  title?: string
  description?: string
  sponsor?: string
  sponsor_type?: string
  start_date?: string
  end_date?: string
  manager_id?: string
  status?: string
  budget_total?: number
  [key: string]: unknown
}

// Project 인터페이스는 DatabaseProject를 사용
type Project = DatabaseProject

interface DeleteResponse {
  message: string
}

// GET /api/projects/[id] - Get project by ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    const project = await DatabaseService.getProjectById(params.id)

    if (!project) {
      const response: ApiResponse<null> = {
        success: false,
        error: '프로젝트를 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    const response: ApiResponse<Project> = {
      success: true,
      data: project as unknown as Project,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Get project error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 조회 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update project
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const updateData = (await request.json()) as UpdateProjectRequest
    const projectId = params.id

    // Check if project exists
    const existingProject = await DatabaseService.getProjectById(projectId)
    if (!existingProject) {
      const response: ApiResponse<null> = {
        success: false,
        error: '프로젝트를 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    // Update project
    const result = await DatabaseService.query(
      `UPDATE projects
			 SET title = COALESCE($1, title),
			     description = COALESCE($2, description),
			     sponsor = COALESCE($3, sponsor),
			     sponsor_type = COALESCE($4, sponsor_type),
			     start_date = COALESCE($5, start_date),
			     end_date = COALESCE($6, end_date),
			     manager_employee_id = COALESCE($7, manager_employee_id),
			     status = COALESCE($8, status),
			     budget_total = COALESCE($9, budget_total),
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $10
			 RETURNING id, code, title, description, sponsor, sponsor_type, manager_employee_id,
                 status, budget_total, created_at::text, updated_at::text, sponsor_name,
                 budget_currency, research_type, technology_area, priority,
                 start_date::text, end_date::text`,
      [
        updateData.title,
        updateData.description,
        updateData.sponsor,
        updateData.sponsor_type,
        updateData.start_date,
        updateData.end_date,
        updateData.manager_id,
        updateData.status,
        updateData.budget_total,
        projectId,
      ],
    )

    const updatedProject = result.rows as Project[]
    const response: ApiResponse<Project> = {
      success: true,
      data: updatedProject[0],
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Update project error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 수정 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete project
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const projectId = params.id

    // Check if project exists
    const existingProject = await DatabaseService.getProjectById(projectId)
    if (!existingProject) {
      const response: ApiResponse<null> = {
        success: false,
        error: '프로젝트를 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    // Check if project has associated data
    const expenseCount = await DatabaseService.query(
      'SELECT COUNT(*) as count FROM expense_items WHERE project_id = $1',
      [projectId],
    )

    const expenseCountData = expenseCount.rows[0] as { count: string }
    if (parseInt(expenseCountData.count) > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: '관련된 경비 항목이 있는 프로젝트는 삭제할 수 없습니다.',
      }
      return json(response, { status: 400 })
    }

    // Delete project
    await DatabaseService.query('DELETE FROM projects WHERE id = $1', [projectId])

    const response: ApiResponse<DeleteResponse> = {
      success: true,
      data: {
        message: '프로젝트가 성공적으로 삭제되었습니다.',
      },
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Delete project error:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 삭제 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}
