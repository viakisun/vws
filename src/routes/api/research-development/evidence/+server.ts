// 증빙 관리 API
// Evidence Management API

import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface EvidenceItem {
  id: string
  project_budget_id: string
  category_id: string
  name: string
  description?: string
  budget_amount: number
  spent_amount: number
  assignee_id?: string
  assignee_name?: string
  due_date?: string
  start_date?: string
  end_date?: string
  status: string
  created_at: string
  updated_at: string
  category_name?: string
  assignee_full_name?: string
  period_number?: number
  document_count?: number
  approved_document_count?: number
  schedule_count?: number
  overdue_schedule_count?: number
  [key: string]: unknown
}

interface CreateEvidenceRequest {
  projectBudgetId: string
  categoryId: string
  name: string
  description?: string
  budgetAmount: number
  assigneeId?: string
  assigneeName?: string
  dueDate?: string
  startDate?: string
  endDate?: string
}

// 증빙 항목 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectBudgetId = url.searchParams.get('projectBudgetId')
    const categoryId = url.searchParams.get('categoryId')
    const status = url.searchParams.get('status')
    const assigneeId = url.searchParams.get('assigneeId')

    let queryText = `
			SELECT 
				ei.id,
				ei.project_budget_id,
				ei.category_id,
				ei.name,
				ei.description,
				ei.budget_amount,
				ei.spent_amount,
				ei.assignee_id,
				ei.assignee_name,
				ei.due_date::text,
				ei.start_date::text,
				ei.end_date::text,
				ei.status,
				ei.progress,
				ei.employee_id,
				ei.project_member_id,
				ei.evidence_month::text,
				ei.created_at::text,
				ei.updated_at::text,
				ec.name as category_name,
				CONCAT(e.last_name, e.first_name) as assignee_full_name,
				pb.period_number,
				COUNT(ed.id) as document_count,
				COUNT(CASE WHEN ed.status = 'approved' THEN 1 END) as approved_document_count,
				COUNT(es.id) as schedule_count,
				COUNT(CASE WHEN es.status = 'overdue' THEN 1 END) as overdue_schedule_count
			FROM evidence_items ei
			JOIN evidence_categories ec ON ei.category_id = ec.id
			LEFT JOIN employees e ON ei.assignee_id = e.id
			LEFT JOIN project_budgets pb ON ei.project_budget_id = pb.id
			LEFT JOIN evidence_documents ed ON ei.id = ed.evidence_item_id
			LEFT JOIN evidence_schedules es ON ei.id = es.evidence_item_id
			WHERE 1=1
		`
    const params: unknown[] = []
    let paramCount = 0

    if (projectBudgetId) {
      paramCount++
      queryText += ` AND ei.project_budget_id = $${paramCount}`
      params.push(projectBudgetId)
    }

    if (categoryId) {
      paramCount++
      queryText += ` AND ei.category_id = $${paramCount}`
      params.push(categoryId)
    }

    if (status) {
      paramCount++
      queryText += ` AND ei.status = $${paramCount}`
      params.push(status)
    }

    if (assigneeId) {
      paramCount++
      queryText += ` AND ei.assignee_id = $${paramCount}`
      params.push(assigneeId)
    }

    queryText += `
			GROUP BY ei.id, ei.project_budget_id, ei.category_id, ei.name, ei.description,
			         ei.budget_amount, ei.spent_amount, ei.assignee_id, ei.assignee_name,
			         ei.due_date, ei.start_date, ei.end_date, ei.status, ei.progress,
			         ei.employee_id, ei.project_member_id, ei.evidence_month,
			         ei.created_at, ei.updated_at,
			         ec.name, e.first_name, e.last_name, pb.period_number
			ORDER BY ei.created_at DESC
		`

    const result = await query<EvidenceItem>(queryText, params)

    logger.info(
      `Evidence API: projectBudgetId=${projectBudgetId}, categoryId=${categoryId}, found ${result.rows.length} items`,
    )

    const response: ApiResponse<EvidenceItem[]> = {
      success: true,
      data: result.rows,
      count: result.rows.length,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('증빙 항목 조회 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '증빙 항목 조회에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 증빙 항목 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const {
      projectBudgetId,
      categoryId,
      name,
      description,
      budgetAmount,
      assigneeId,
      assigneeName,
      dueDate,
      startDate,
      endDate,
    } = (await request.json()) as CreateEvidenceRequest

    // 필수 필드 검증
    if (!projectBudgetId || !categoryId || !name || !budgetAmount) {
      const response: ApiResponse<null> = {
        success: false,
        error: '필수 필드가 누락되었습니다.',
      }
      return json(response, { status: 400 })
    }

    // 프로젝트 예산 존재 확인
    const budgetCheck = await query('SELECT id FROM project_budgets WHERE id = $1', [
      projectBudgetId,
    ])
    if (budgetCheck.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: '프로젝트 예산을 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    // 증빙 카테고리 존재 확인
    const categoryCheck = await query('SELECT id FROM evidence_categories WHERE id = $1', [
      categoryId,
    ])
    if (categoryCheck.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: '증빙 카테고리를 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    // 증빙 항목 생성
    const result = await query<EvidenceItem>(
      `
			INSERT INTO evidence_items (
				project_budget_id, category_id, name, description, budget_amount,
				assignee_id, assignee_name, due_date, start_date, end_date
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id, project_budget_id, category_id, name, description, budget_amount, spent_amount,
			          assignee_id, assignee_name, progress, status, due_date, start_date, end_date,
			          created_at::text, updated_at::text
		`,
      [
        projectBudgetId,
        categoryId,
        name,
        description,
        budgetAmount,
        assigneeId,
        assigneeName,
        dueDate,
        startDate,
        endDate,
      ],
    )

    const newEvidenceItem = result.rows[0]

    // 생성된 증빙 항목의 상세 정보 조회
    const detailResult = await query<EvidenceItem>(
      `
			SELECT 
				ei.*,
				ec.name as category_name,
				CONCAT(e.last_name, e.first_name) as assignee_full_name,
				pb.period_number
			FROM evidence_items ei
			JOIN evidence_categories ec ON ei.category_id = ec.id
			LEFT JOIN employees e ON ei.assignee_id = e.id
			LEFT JOIN project_budgets pb ON ei.project_budget_id = pb.id
			WHERE ei.id = $1
		`,
      [newEvidenceItem.id],
    )

    const response: ApiResponse<EvidenceItem> = {
      success: true,
      data: detailResult.rows[0],
      message: '증빙 항목이 성공적으로 생성되었습니다.',
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('증빙 항목 생성 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '증빙 항목 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
