// 증빙 일정 API
// Evidence Schedules API

import { query } from "$lib/database/connection";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/utils/logger";

// 증빙 일정 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const evidenceItemId = url.searchParams.get("evidenceItemId");
    const assigneeId = url.searchParams.get("assigneeId");
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");

    let queryText = `
			SELECT 
				es.*,
				ei.name as evidence_item_name,
				CONCAT(assignee.last_name, assignee.first_name) as assignee_name
			FROM evidence_schedules es
			JOIN evidence_items ei ON es.evidence_item_id = ei.id
			LEFT JOIN employees assignee ON es.assignee_id = assignee.id
			WHERE 1=1
		`;
    const params: unknown[] = [];
    let paramCount = 0;

    if (evidenceItemId) {
      paramCount++;
      queryText += ` AND es.evidence_item_id = $${paramCount}`;
      params.push(evidenceItemId);
    }

    if (assigneeId) {
      paramCount++;
      queryText += ` AND es.assignee_id = $${paramCount}`;
      params.push(assigneeId);
    }

    if (status) {
      paramCount++;
      queryText += ` AND es.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      queryText += ` AND es.priority = $${paramCount}`;
      params.push(priority);
    }

    queryText += ` ORDER BY es.due_date ASC, es.priority DESC`;

    const result = await query(queryText, params);

    return json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    logger.error("증빙 일정 조회 실패:", error);
    return json(
      {
        success: false,
        message: "증빙 일정 조회에 실패했습니다.",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
};

// 증빙 일정 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const {
      evidenceItemId,
      taskName,
      description,
      dueDate,
      assigneeId,
      priority = "medium",
    } = data;

    // 필수 필드 검증
    if (!evidenceItemId || !taskName || !dueDate) {
      return json(
        {
          success: false,
          message: "필수 필드가 누락되었습니다.",
        },
        { status: 400 },
      );
    }

    // 증빙 항목 존재 확인
    const itemCheck = await query(
      "SELECT id FROM evidence_items WHERE id = $1",
      [evidenceItemId],
    );
    if (itemCheck.rows.length === 0) {
      return json(
        {
          success: false,
          message: "증빙 항목을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // 증빙 일정 생성
    const result = await query(
      `
			INSERT INTO evidence_schedules (
				evidence_item_id, task_name, description, due_date, assignee_id, priority
			) VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING *
		`,
      [evidenceItemId, taskName, description, dueDate, assigneeId, priority],
    );

    const newSchedule = result.rows[0];

    // 생성된 일정의 상세 정보 조회
    const detailResult = await query(
      `
			SELECT 
				es.*,
				ei.name as evidence_item_name,
				CONCAT(assignee.last_name, assignee.first_name) as assignee_name
			FROM evidence_schedules es
			JOIN evidence_items ei ON es.evidence_item_id = ei.id
			LEFT JOIN employees assignee ON es.assignee_id = assignee.id
			WHERE es.id = $1
		`,
      [newSchedule.id],
    );

    return json({
      success: true,
      data: detailResult.rows[0],
      message: "증빙 일정이 성공적으로 생성되었습니다.",
    });
  } catch (error) {
    logger.error("증빙 일정 생성 실패:", error);
    return json(
      {
        success: false,
        message: "증빙 일정 생성에 실패했습니다.",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
};
