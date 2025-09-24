import { query } from "$lib/database/connection";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/utils/logger";

// GET /api/project-management/evidence-types - 증빙 유형 목록 조회
export const GET: RequestHandler = async () => {
  try {
    const sqlQuery = `
			SELECT 
				id,
				code,
				name,
				description,
				is_active
			FROM evidence_types
			WHERE is_active = true
			ORDER BY id ASC
		`;

    const result = await query(sqlQuery);

    return json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error("증빙 유형 조회 실패:", error);
    return json(
      {
        success: false,
        message: "증빙 유형을 불러오는데 실패했습니다.",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
};
