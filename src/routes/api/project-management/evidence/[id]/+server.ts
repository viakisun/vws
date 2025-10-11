// 개별 증빙 항목 API
// Individual Evidence Item API

import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 증빙 항목 상세 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params as Record<string, string>

    // 증빙 항목 상세 정보 조회
    const result = await query(
      `
			SELECT
				ei.*,
				ec.name as category_name,
				CONCAT(e.last_name, e.first_name) as assignee_full_name,
				pb.period_number,
				pb.personnel_cost_cash,
				pb.personnel_cost_in_kind,
				pb.research_material_cost_cash,
				pb.research_material_cost_in_kind,
				pb.research_activity_cost_cash,
				pb.research_activity_cost_in_kind,
				pb.indirect_cost_cash,
				pb.indirect_cost_in_kind
			FROM evidence_items ei
			JOIN evidence_categories ec ON ei.category_id = ec.id
			LEFT JOIN employees e ON ei.assignee_id = e.id
			LEFT JOIN project_budgets pb ON ei.project_budget_id = pb.id
			WHERE ei.id = $1
		`,
      [id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          message: '증빙 항목을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const evidenceItem = result.rows[0] as Record<string, unknown>

    // 증빙 서류 목록 조회
    const documentsResult = await query(
      `
			SELECT
				ed.*,
				uploader.first_name || ' ' || uploader.last_name as uploader_name,
				reviewer.first_name || ' ' || reviewer.last_name as reviewer_name
			FROM evidence_documents ed
			LEFT JOIN employees uploader ON ed.uploader_id = uploader.id
			LEFT JOIN employees reviewer ON ed.reviewer_id = reviewer.id
			WHERE ed.evidence_item_id = $1
			ORDER BY ed.upload_date DESC
		`,
      [id],
    )

    // 증빙 일정 목록 조회
    const schedulesResult = await query(
      `
			SELECT
				es.*,
				CONCAT(assignee.last_name, assignee.first_name) as assignee_name
			FROM evidence_schedules es
			LEFT JOIN employees assignee ON es.assignee_id = assignee.id
			WHERE es.evidence_item_id = $1
			ORDER BY es.due_date ASC
		`,
      [id],
    )

    // 증빙 검토 이력 조회
    const reviewHistoryResult = await query(
      `
			SELECT
				erh.*,
				reviewer.first_name || ' ' || reviewer.last_name as reviewer_name
			FROM evidence_review_history erh
			LEFT JOIN employees reviewer ON erh.reviewer_id = reviewer.id
			WHERE erh.evidence_item_id = $1
			ORDER BY erh.reviewed_at DESC
		`,
      [id],
    )

    const response: ApiResponse<unknown> = {
      success: true,
      data: {
        ...evidenceItem,
        documents: documentsResult.rows as Record<string, unknown>[],
        schedules: schedulesResult.rows as Record<string, unknown>[],
        reviewHistory: reviewHistoryResult.rows as Record<string, unknown>[],
      },
    }

    return json(response)
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

// 증빙 항목 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params as Record<string, string>
    const data = (await request.json()) as Record<string, unknown>
    const {
      name,
      description,
      budgetAmount,
      spentAmount,
      assigneeId,
      assigneeName,
      progress,
      status,
      dueDate,
      startDate,
      endDate,
    } = data

    // 증빙 항목 존재 확인
    const existingItem = await query('SELECT id FROM evidence_items WHERE id = $1', [id])
    if (existingItem.rows.length === 0) {
      return json(
        {
          success: false,
          message: '증빙 항목을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 업데이트할 필드들 동적 생성
    const updateFields: string[] = []
    const updateValues: (string | number | null)[] = []
    let paramIndex = 1

    const fieldsToUpdate: Record<string, unknown> = {
      name,
      description,
      budget_amount: budgetAmount,
      spent_amount: spentAmount,
      assignee_id: assigneeId,
      assignee_name: assigneeName,
      progress,
      status,
      due_date: dueDate,
      start_date: startDate,
      end_date: endDate,
    }

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex++}`)
        updateValues.push(value as string | number | null)
      }
    })

    if (updateFields.length === 0) {
      return json(
        {
          success: false,
          message: '수정할 데이터가 없습니다.',
        },
        { status: 400 },
      )
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(id) // Add id as the last parameter for WHERE clause

    const result = await query(
      `UPDATE evidence_items SET ${updateFields.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, project_budget_id, category_id, name, description, budget_amount, spent_amount,
                 assignee_id, assignee_name, progress, status, due_date, start_date, end_date,
                 created_at::text, updated_at::text`,
      updateValues,
    )

    const _updatedItem = result.rows[0] as Record<string, unknown>

    // 업데이트된 증빙 항목의 상세 정보 조회
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
      [id],
    )

    return json({
      success: true,
      data: detailResult.rows[0] as Record<string, unknown>,
      message: '증빙 항목이 성공적으로 수정되었습니다.',
    })
  } catch (error) {
    logger.error('증빙 항목 수정 실패:', error)
    return json(
      {
        success: false,
        message: '증빙 항목 수정에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}

// 증빙 항목 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params as Record<string, string>

    // 증빙 항목 존재 확인
    const existingItem = await query('SELECT id FROM evidence_items WHERE id = $1', [id])
    if (existingItem.rows.length === 0) {
      return json(
        {
          success: false,
          message: '증빙 항목을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 증빙 항목 삭제 (CASCADE로 관련 데이터도 함께 삭제됨)
    await query('DELETE FROM evidence_items WHERE id = $1', [id])

    return json({
      success: true,
      message: '증빙 항목이 성공적으로 삭제되었습니다.',
    })
  } catch (error) {
    logger.error('증빙 항목 삭제 실패:', error)
    return json(
      {
        success: false,
        message: '증빙 항목 삭제에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}
