// 증빙 관리 API
// Evidence Management API

import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 증빙 항목 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectBudgetId = url.searchParams.get('projectBudgetId')
    const categoryId = url.searchParams.get('categoryId')
    const status = url.searchParams.get('status')
    const assigneeId = url.searchParams.get('assigneeId')

    let queryText = `
			SELECT 
				ei.*,
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
			GROUP BY ei.id, ec.name, e.first_name, e.last_name, pb.period_number
			ORDER BY ei.created_at DESC
		`

    const result = await query(queryText, params)

    return json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    logger.error('증빙 항목 조회 실패:', error)
    return json(
      {
        success: false,
        message: '증빙 항목 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}

// 증빙 항목 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json()
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
    } = data

    // 필수 필드 검증
    if (!projectBudgetId || !categoryId || !name || !budgetAmount) {
      return json(
        {
          success: false,
          message: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 프로젝트 예산 존재 확인
    const budgetCheck = await query('SELECT id FROM project_budgets WHERE id = $1', [
      projectBudgetId,
    ])
    if (budgetCheck.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 예산을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 증빙 카테고리 존재 확인
    const categoryCheck = await query('SELECT id FROM evidence_categories WHERE id = $1', [
      categoryId,
    ])
    if (categoryCheck.rows.length === 0) {
      return json(
        {
          success: false,
          message: '증빙 카테고리를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 증빙 항목 생성
    const result = await query(
      `
			INSERT INTO evidence_items (
				project_budget_id, category_id, name, description, budget_amount,
				assignee_id, assignee_name, due_date, start_date, end_date
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING *
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
    const detailResult = await query(
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

    return json({
      success: true,
      data: detailResult.rows[0],
      message: '증빙 항목이 성공적으로 생성되었습니다.',
    })
  } catch (error) {
    logger.error('증빙 항목 생성 실패:', error)
    return json(
      {
        success: false,
        message: '증빙 항목 생성에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}
