// Project Management API - Projects
// 프로젝트 관리 시스템의 프로젝트 관련 API

import { query } from "$lib/database/connection";
import {
  transformArrayData,
  transformProjectData,
} from "$lib/utils/api-data-transformer";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/utils/logger";

// 프로젝트 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const status = searchParams.get("status");
    const sponsorType = searchParams.get("sponsorType");
    const researchType = searchParams.get("researchType");
    const priority = searchParams.get("priority");
    const managerId = searchParams.get("managerId");
    const search = searchParams.get("search");
    const startDateFrom = searchParams.get("startDateFrom");
    const startDateTo = searchParams.get("startDateTo");

    let sqlQuery = `
			SELECT 
				p.*,
				e.first_name || ' ' || e.last_name as manager_name,
				COUNT(pm.id) as member_count,
				COALESCE(SUM(pm.participation_rate), 0) as total_participation_rate
			FROM projects p
			LEFT JOIN employees e ON p.manager_id = e.id
			LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.status = 'active'
		`;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status && status !== "all") {
      conditions.push(`p.status = $${paramIndex++}`);
      params.push(status);
    }

    if (sponsorType && sponsorType !== "all") {
      conditions.push(`p.sponsor_type = $${paramIndex++}`);
      params.push(sponsorType);
    }

    if (researchType && researchType !== "all") {
      conditions.push(`p.research_type = $${paramIndex++}`);
      params.push(researchType);
    }

    if (priority && priority !== "all") {
      conditions.push(`p.priority = $${paramIndex++}`);
      params.push(priority);
    }

    if (managerId) {
      conditions.push(`p.manager_id = $${paramIndex++}`);
      params.push(managerId);
    }

    if (search) {
      conditions.push(
        `(p.title ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`,
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (startDateFrom) {
      conditions.push(`p.start_date >= $${paramIndex++}`);
      params.push(startDateFrom);
    }

    if (startDateTo) {
      conditions.push(`p.start_date <= $${paramIndex++}`);
      params.push(startDateTo);
    }

    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ");
    }

    sqlQuery += `
			GROUP BY p.id, e.first_name, e.last_name
			ORDER BY p.created_at DESC
		`;

    const result = await query(sqlQuery, params);

    // 데이터 변환: snake_case를 camelCase로 변환
    const transformedData = transformArrayData(
      result.rows,
      transformProjectData,
    );

    return json({
      success: true,
      data: transformedData,
      total: transformedData.length,
    });
  } catch (error) {
    logger.error("프로젝트 목록 조회 실패:", error);
    return json(
      {
        success: false,
        message: "프로젝트 목록을 불러오는데 실패했습니다.",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
};

// 간소화된 프로젝트 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const {
      code,
      title,
      description = "",
      status = "planning", // 기본값을 '기획'으로 설정
    } = data;

    // 필수 필드 검증
    if (!code || !title) {
      return json(
        {
          success: false,
          error: "프로젝트 코드와 제목은 필수입니다.",
        },
        { status: 400 },
      );
    }

    // 상태 값 검증 - 기획, 진행, 완료만 허용
    const validStatuses = ["planning", "active", "completed"];
    if (!validStatuses.includes(status)) {
      return json(
        {
          success: false,
          error:
            "유효하지 않은 프로젝트 상태입니다. (기획, 진행, 완료 중 선택)",
        },
        { status: 400 },
      );
    }

    // 프로젝트 코드 중복 확인
    const existingProject = await query(
      "SELECT id FROM projects WHERE code = $1",
      [code],
    );

    if (existingProject.rows.length > 0) {
      return json(
        {
          success: false,
          error: "이미 존재하는 프로젝트 코드입니다.",
        },
        { status: 400 },
      );
    }

    // 간소화된 프로젝트 생성
    const result = await query(
      `
			INSERT INTO projects (
				code, title, description, status
			) VALUES ($1, $2, $3, $4)
			RETURNING *
		`,
      [code, title, description, status],
    );

    const project = result.rows[0];

    // 데이터 변환: snake_case를 camelCase로 변환
    const transformedProject = transformProjectData(project);

    return json({
      success: true,
      data: transformedProject,
      message: "프로젝트가 성공적으로 생성되었습니다.",
    });
  } catch (error) {
    logger.error("프로젝트 생성 실패:", error);
    return json(
      {
        success: false,
        error: "프로젝트 생성에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
};
