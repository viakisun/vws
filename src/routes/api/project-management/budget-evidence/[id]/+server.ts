import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger';

// GET /api/project-management/budget-evidence/[id] - 특정 증빙 내역 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    const sqlQuery = `
			SELECT 
				be.*,
				et.name as evidence_type_name,
				pb.fiscal_year,
				p.title as project_title,
				creator.first_name as created_by_name,
				approver.first_name as approved_by_name
			FROM budget_evidence be
			LEFT JOIN evidence_types et ON be.evidence_type = et.code
			LEFT JOIN project_budgets pb ON be.project_budget_id = pb.id
			LEFT JOIN projects p ON pb.project_id = p.id
			LEFT JOIN employees creator ON be.created_by = creator.id
			LEFT JOIN employees approver ON be.approved_by = approver.id
			WHERE be.id = $1
		`

    const result = await query(sqlQuery, [id])

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          message: '증빙 내역을 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    return json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    logger.error('증빙 내역 조회 실패:', error)
    return json(
      {
        success: false,
        message: '증빙 내역을 불러오는데 실패했습니다.',
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// PUT /api/project-management/budget-evidence/[id] - 증빙 내역 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params
    const data = await request.json()
    const {
      evidenceType,
      title,
      description,
      amount,
      evidenceDate,
      filePath,
      fileName,
      fileSize,
      mimeType
    } = data

    // 증빙 내역 존재 확인
    const existingEvidence = await query('SELECT * FROM budget_evidence WHERE id = $1', [id])
    if (existingEvidence.rows.length === 0) {
      return json(
        {
          success: false,
          message: '증빙 내역을 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    // 증빙 내역 수정
    const updateQuery = `
			UPDATE budget_evidence 
			SET 
				evidence_type = COALESCE($2, evidence_type),
				title = COALESCE($3, title),
				description = COALESCE($4, description),
				amount = COALESCE($5, amount),
				evidence_date = COALESCE($6, evidence_date),
				file_path = COALESCE($7, file_path),
				file_name = COALESCE($8, file_name),
				file_size = COALESCE($9, file_size),
				mime_type = COALESCE($10, mime_type),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $1
			RETURNING *
		`

    const result = await query(updateQuery, [
      id,
      evidenceType,
      title,
      description,
      amount ? parseFloat(amount) : null,
      evidenceDate,
      filePath,
      fileName,
      fileSize,
      mimeType
    ])

    return json({
      success: true,
      data: result.rows[0],
      message: '증빙 내역이 수정되었습니다.'
    })
  } catch (error) {
    logger.error('증빙 내역 수정 실패:', error)
    return json(
      {
        success: false,
        message: '증빙 내역 수정에 실패했습니다.',
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// DELETE /api/project-management/budget-evidence/[id] - 증빙 내역 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    // 증빙 내역 존재 확인
    const existingEvidence = await query('SELECT * FROM budget_evidence WHERE id = $1', [id])
    if (existingEvidence.rows.length === 0) {
      return json(
        {
          success: false,
          message: '증빙 내역을 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    // 증빙 내역 삭제
    await query('DELETE FROM budget_evidence WHERE id = $1', [id])

    return json({
      success: true,
      message: '증빙 내역이 삭제되었습니다.'
    })
  } catch (error) {
    logger.error('증빙 내역 삭제 실패:', error)
    return json(
      {
        success: false,
        message: '증빙 내역 삭제에 실패했습니다.',
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}
