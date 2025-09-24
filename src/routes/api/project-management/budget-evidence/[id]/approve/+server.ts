import { query } from "$lib/database/connection";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/utils/logger";

// PUT /api/project-management/budget-evidence/[id]/approve - 증빙 내역 승인
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const data = await request.json();
    const { approvedBy } = data;

    // 증빙 내역 존재 확인
    const existingEvidence = await query(
      "SELECT * FROM budget_evidence WHERE id = $1",
      [id],
    );
    if (existingEvidence.rows.length === 0) {
      return json(
        {
          success: false,
          message: "증빙 내역을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
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
			RETURNING *
		`;

    const result = await query(updateQuery, [id, approvedBy]);

    return json({
      success: true,
      data: result.rows[0],
      message: "증빙 내역이 승인되었습니다.",
    });
  } catch (error) {
    logger.error("증빙 내역 승인 실패:", error);
    return json(
      {
        success: false,
        message: "증빙 내역 승인에 실패했습니다.",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
};
