// 증빙 카테고리 API
// Evidence Categories API

import { query } from "$lib/database/connection";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/utils/logger";

// 증빙 카테고리 목록 조회
export const GET: RequestHandler = async () => {
  try {
    const result = await query(
      `
			SELECT 
				ec.*,
				COUNT(ei.id) as item_count,
				COUNT(CASE WHEN ei.status = 'completed' THEN 1 END) as completed_count,
				COUNT(CASE WHEN ei.status = 'in_progress' THEN 1 END) as in_progress_count,
				COUNT(CASE WHEN ei.status = 'planned' THEN 1 END) as planned_count
			FROM evidence_categories ec
			LEFT JOIN evidence_items ei ON ec.id = ei.category_id
			GROUP BY ec.id, ec.name, ec.description, ec.created_at, ec.updated_at
			ORDER BY ec.name
		`,
    );

    return json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error("증빙 카테고리 조회 실패:", error);
    return json(
      {
        success: false,
        message: "증빙 카테고리 조회에 실패했습니다.",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
};

// 증빙 카테고리 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, description } = data;

    // 필수 필드 검증
    if (!name) {
      return json(
        {
          success: false,
          message: "카테고리 이름은 필수입니다.",
        },
        { status: 400 },
      );
    }

    // 중복 이름 확인
    const duplicateCheck = await query(
      "SELECT id FROM evidence_categories WHERE name = $1",
      [name],
    );
    if (duplicateCheck.rows.length > 0) {
      return json(
        {
          success: false,
          message: "이미 존재하는 카테고리 이름입니다.",
        },
        { status: 400 },
      );
    }

    // 증빙 카테고리 생성
    const result = await query(
      `
			INSERT INTO evidence_categories (name, description)
			VALUES ($1, $2)
			RETURNING *
		`,
      [name, description],
    );

    return json({
      success: true,
      data: result.rows[0],
      message: "증빙 카테고리가 성공적으로 생성되었습니다.",
    });
  } catch (error) {
    logger.error("증빙 카테고리 생성 실패:", error);
    return json(
      {
        success: false,
        message: "증빙 카테고리 생성에 실패했습니다.",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
};
