// Research & Development Management API - Projects
// 연구개발사업 관리 시스템의 프로젝트 관련 API

import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import type { ApiResponse, DatabaseProject } from '$lib/types/database'
import { transformArrayData, transformProjectData } from '$lib/utils/api-data-transformer'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 프로젝트 목록 조회
export const GET: RequestHandler = async (event) => {
  try {
    // JWT 인증 확인
    await requireAuth(event)

    const { url } = event
    const searchParams = url.searchParams
    const status = searchParams.get('status')
    const sponsorType = searchParams.get('sponsorType')
    const researchType = searchParams.get('researchType')
    const priority = searchParams.get('priority')
    const managerId = searchParams.get('managerId')
    const search = searchParams.get('search')
    const startDateFrom = searchParams.get('startDateFrom')
    const startDateTo = searchParams.get('startDateTo')

    let sqlQuery = `
			SELECT 
				p.id, p.code, p.title, p.project_task_name, p.description, p.sponsor, p.sponsor_type,
				p.manager_employee_id, p.status, p.budget_total, p.research_type, p.priority,
				p.dedicated_agency, p.dedicated_agency_contact_name,
				p.dedicated_agency_contact_phone, p.dedicated_agency_contact_email,
				p.created_at::text as created_at, p.updated_at::text as updated_at,
				e.first_name || ' ' || e.last_name as manager_name,
				COUNT(DISTINCT pm.id) as member_count,
				COALESCE(SUM(pm.participation_rate), 0) as total_participation_rate,
				-- 연차별 예산에서 시작일/종료일 계산
				(SELECT MIN(pb.start_date)::text FROM rd_project_budgets pb WHERE pb.project_id = p.id) as start_date,
				(SELECT MAX(pb.end_date)::text FROM rd_project_budgets pb WHERE pb.project_id = p.id) as end_date
			FROM projects p
			LEFT JOIN employees e ON p.manager_employee_id = e.id
			LEFT JOIN rd_project_members pm ON p.id = pm.project_id AND pm.status = 'active'
		`

    const conditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (status && status !== 'all') {
      conditions.push(`p.status = $${paramIndex++}`)
      params.push(status)
    }

    if (sponsorType && sponsorType !== 'all') {
      conditions.push(`p.sponsor_type = $${paramIndex++}`)
      params.push(sponsorType)
    }

    if (researchType && researchType !== 'all') {
      conditions.push(`p.research_type = $${paramIndex++}`)
      params.push(researchType)
    }

    if (priority && priority !== 'all') {
      conditions.push(`p.priority = $${paramIndex++}`)
      params.push(priority)
    }

    if (managerId) {
      conditions.push(`p.manager_employee_id = $${paramIndex++}`)
      params.push(managerId)
    }

    if (search) {
      conditions.push(
        `(p.title ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`,
      )
      params.push(`%${search}%`)
      paramIndex++
    }

    // Note: startDateFrom, startDateTo 필터는 서브쿼리로 계산된 start_date를 필터링할 수 없으므로 제거
    // 필요시 CTE나 외부 쿼리로 감싸서 구현 가능

    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ')
    }

    sqlQuery += `
			GROUP BY p.id, p.code, p.title, p.project_task_name, p.description, p.sponsor, p.sponsor_type,
			         p.manager_employee_id, p.status, p.budget_total,
			         p.research_type, p.priority,
			         p.dedicated_agency, p.dedicated_agency_contact_name,
			         p.dedicated_agency_contact_phone, p.dedicated_agency_contact_email,
			         p.created_at, p.updated_at,
			         e.first_name, e.last_name
			ORDER BY 
				CASE 
					WHEN p.code ~ '^[0-9]{4}-[0-9]+-' THEN 
						CAST(SUBSTRING(p.code FROM '^([0-9]{4})') AS INTEGER)
					ELSE 
						9999
				END,
				CASE 
					WHEN p.code ~ '^[0-9]{4}-[0-9]+-' THEN 
						CAST(SUBSTRING(p.code FROM '^[0-9]{4}-([0-9]+)-') AS INTEGER)
					ELSE 
						9999
				END,
				p.code ASC
		`

    const result = await query<DatabaseProject>(sqlQuery, params)

    // 데이터 변환: snake_case를 camelCase로 변환
    const transformedData = transformArrayData(result.rows, transformProjectData)

    const response: ApiResponse<unknown[]> = {
      success: true,
      data: transformedData,
      count: transformedData.length,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('프로젝트 목록 조회 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 목록을 불러오는데 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}

interface CreateProjectRequest {
  code: string
  title: string
  description?: string
  status?: string
  [key: string]: unknown
}

interface ProjectResponse {
  id: string
  code: string
  title: string
  description?: string
  status: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

// 간소화된 프로젝트 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = (await request.json()) as CreateProjectRequest
    const {
      code,
      title,
      description = '',
      status = 'planning', // 기본값을 '기획'으로 설정
    } = data

    // 필수 필드 검증
    if (!code || !title) {
      const response: ApiResponse<null> = {
        success: false,
        error: '프로젝트 코드와 제목은 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    // 상태 값 검증 - 기획, 진행, 완료만 허용
    const validStatuses = ['planning', 'active', 'completed']
    if (!validStatuses.includes(status)) {
      const response: ApiResponse<null> = {
        success: false,
        error: '유효하지 않은 프로젝트 상태입니다. (기획, 진행, 완료 중 선택)',
      }
      return json(response, { status: 400 })
    }

    // 프로젝트 코드 중복 확인
    const existingProject = await query('SELECT id FROM projects WHERE code = $1', [code])

    if (existingProject.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: '이미 존재하는 프로젝트 코드입니다.',
      }
      return json(response, { status: 400 })
    }

    // 간소화된 프로젝트 생성
    const result = await query(
      `
			INSERT INTO projects (
				code, title, description, status
			) VALUES ($1, $2, $3, $4)
			RETURNING id, code, title, description, sponsor, sponsor_type, manager_employee_id,
			          status, budget_total, created_at::text, updated_at::text, sponsor_name,
			          budget_currency, research_type, technology_area, priority,
			          start_date::text, end_date::text
		`,
      [code, title, description, status],
    )

    const project = result.rows[0] as ProjectResponse

    // 데이터 변환: snake_case를 camelCase로 변환
    const transformedProject = transformProjectData(project)

    const response: ApiResponse<unknown> = {
      success: true,
      data: transformedProject,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('프로젝트 생성 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
