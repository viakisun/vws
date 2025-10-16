import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 증빙 내역 타입 정의
interface BudgetEvidence {
  id: string
  status: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  updated_at: string
  [key: string]: unknown
}

// PUT /api/research-development/budget-evidence/[id]/approve - 증빙 내역 승인
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params
    const data = (await request.json()) as Record<string, unknown>
    const { approvedBy } = data

    // 증빙 내역 존재 확인
    const existingEvidence = await query<BudgetEvidence>(
      'SELECT id, project_id, budget_category_id, amount, description, evidence_type, file_s3_key, status, created_at::text as created_at, updated_at::text as updated_at FROM budget_evidence WHERE id = $1',
      [id],
    )
    if (existingEvidence.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        message: '증빙 내역을 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    // 증빙 내역 승인
    const updateQuery = `
			UPDATE budget_evidence
			SET
				status = 'approved',
				approved_by = $2,
				approved_at = CURRENT_TIMESTAMP,
				rejection_reason = NULL,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $1
			RETURNING id, project_budget_id, evidence_type, title, description, amount, evidence_date,
			          file_path, file_name, file_size, mime_type, status, created_by,
			          created_at::text, updated_at::text, approved_by, approved_at::text, rejection_reason
		`

    const result = await query<BudgetEvidence>(updateQuery, [id, approvedBy])

    const response: ApiResponse<BudgetEvidence> = {
      success: true,
      data: result.rows[0] as BudgetEvidence,
      message: '증빙 내역이 승인되었습니다.',
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('증빙 내역 승인 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      message: '증빙 내역 승인에 실패했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return json(response, { status: 500 })
  }
}
