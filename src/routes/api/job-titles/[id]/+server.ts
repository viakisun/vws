import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { query } from "$lib/database/connection";
import { logger } from "$lib/utils/logger";

// 특정 직책 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query(
      `
			SELECT id, name, level, category, description, is_active, created_at, updated_at
			FROM job_titles
			WHERE id = $1
		`,
      [params.id],
    );

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: "직책을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error("Error fetching job title:", error);
    return json(
      {
        success: false,
        error: error.message || "직책 정보를 가져오는데 실패했습니다.",
      },
      { status: 500 },
    );
  }
};

// 직책 정보 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();

    // 필수 필드 검증
    if (!data.name || data.name.trim() === "") {
      return json(
        {
          success: false,
          error: "직책명은 필수 입력 항목입니다.",
        },
        { status: 400 },
      );
    }

    if (!data.level || data.level < 1 || data.level > 10) {
      return json(
        {
          success: false,
          error: "레벨은 1-10 사이의 값이어야 합니다.",
        },
        { status: 400 },
      );
    }

    if (!data.category || data.category.trim() === "") {
      return json(
        {
          success: false,
          error: "카테고리는 필수 선택 항목입니다.",
        },
        { status: 400 },
      );
    }

    // 중복 직책명 검증 (자신 제외)
    const existingTitle = await query(
      "SELECT id FROM job_titles WHERE LOWER(name) = LOWER($1) AND id != $2",
      [data.name.trim(), params.id],
    );

    if (existingTitle.rows.length > 0) {
      return json(
        {
          success: false,
          error: "이미 존재하는 직책명입니다.",
        },
        { status: 400 },
      );
    }

    const result = await query(
      `
			UPDATE job_titles SET
				name = $1,
				level = $2,
				category = $3,
				description = $4,
				is_active = $5,
				updated_at = $6
			WHERE id = $7
			RETURNING id, name, level, category, description, is_active, created_at, updated_at
		`,
      [
        data.name.trim(),
        data.level,
        data.category.trim(),
        data.description?.trim() || "",
        data.is_active !== false,
        new Date(),
        params.id,
      ],
    );

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: "직책을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return json({
      success: true,
      data: result.rows[0],
      message: "직책 정보가 성공적으로 수정되었습니다.",
    });
  } catch (error: any) {
    logger.error("Error updating job title:", error);
    return json(
      {
        success: false,
        error: error.message || "직책 정보 수정에 실패했습니다.",
      },
      { status: 500 },
    );
  }
};

// 직책 삭제 (비활성화)
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    // 해당 직책을 사용하는 이사가 있는지 확인
    const executivesUsingTitle = await query(
      "SELECT COUNT(*) as count FROM executives WHERE job_title_id = $1 AND status = $2",
      [params.id, "active"],
    );

    if (parseInt(executivesUsingTitle.rows[0].count) > 0) {
      return json(
        {
          success: false,
          error: "해당 직책을 사용하는 활성 이사가 있어 삭제할 수 없습니다.",
        },
        { status: 400 },
      );
    }

    const result = await query(
      `
			UPDATE job_titles SET
				is_active = false,
				updated_at = $1
			WHERE id = $2
			RETURNING id, name
		`,
      [new Date(), params.id],
    );

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: "직책을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return json({
      success: true,
      message: "직책이 비활성화되었습니다.",
    });
  } catch (error: any) {
    logger.error("Error deleting job title:", error);
    return json(
      {
        success: false,
        error: error.message || "직책 삭제에 실패했습니다.",
      },
      { status: 500 },
    );
  }
};
