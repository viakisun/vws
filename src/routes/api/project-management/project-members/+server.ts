import { query } from "$lib/database/connection";
import {
  transformArrayData,
  transformProjectMemberData,
} from "$lib/utils/api-data-transformer";
import {
  formatDateForAPI,
  formatDateForKorean,
} from "$lib/utils/date-calculator";
import { calculateMonthlySalary } from "$lib/utils/salary-calculator";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/utils/logger";

// GET /api/project-management/project-members - 프로젝트 멤버 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get("projectId");
    const employeeId = url.searchParams.get("employeeId");
    const status = url.searchParams.get("status");
    const role = url.searchParams.get("role");

    let sqlQuery = `
			SELECT 
				pm.*,
				CASE 
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$' 
					THEN CONCAT(e.last_name, e.first_name)
					ELSE CONCAT(e.first_name, ' ', e.last_name)
				END as employee_name,
				e.first_name,
				e.last_name,
				e.email as employee_email,
				e.department as employee_department,
				e.position as employee_position,
				p.title as project_title,
				p.code as project_code
			FROM project_members pm
			JOIN employees e ON pm.employee_id = e.id
			JOIN projects p ON pm.project_id = p.id
			WHERE 1=1
		`;

    const params: unknown[] = [];
    let paramIndex = 1;

    if (projectId) {
      sqlQuery += ` AND pm.project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
    }

    if (employeeId) {
      sqlQuery += ` AND pm.employee_id = $${paramIndex}`;
      params.push(employeeId);
      paramIndex++;
    }

    if (status) {
      sqlQuery += ` AND pm.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (role) {
      sqlQuery += ` AND pm.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY pm.created_at DESC`;

    const result = await query(sqlQuery, params);

    // 데이터 변환: snake_case를 camelCase로 변환
    const transformedData = transformArrayData(
      result.rows,
      transformProjectMemberData,
    );

    return json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    logger.error("프로젝트 멤버 조회 실패:", error);
    return json(
      {
        success: false,
        message: "프로젝트 멤버를 불러오는데 실패했습니다.",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
};

// POST /api/project-management/project-members - 프로젝트 멤버 추가
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const {
      projectId,
      employeeId,
      role = "researcher",
      startDate,
      endDate,
      participationRate = 100,
      contributionType = "cash",
      contractAmount = 0,
      status = "active",
    } = data;

    // 필수 필드 검증
    if (!projectId || !employeeId) {
      return json(
        {
          success: false,
          message: "프로젝트 ID와 직원 ID는 필수입니다.",
        },
        { status: 400 },
      );
    }

    // 참여율 검증 (0-100 사이)
    if (participationRate < 0 || participationRate > 100) {
      return json(
        {
          success: false,
          message: "참여율은 0-100 사이의 값이어야 합니다.",
        },
        { status: 400 },
      );
    }

    // 중복 검사
    const existingMember = await query(
      "SELECT id FROM project_members WHERE project_id = $1 AND employee_id = $2",
      [projectId, employeeId],
    );

    if (existingMember.rows.length > 0) {
      return json(
        {
          success: false,
          message: "해당 직원은 이미 이 프로젝트의 멤버입니다.",
        },
        { status: 400 },
      );
    }

    // 해당 직원의 프로젝트 참여 기간에 유효한 급여 계약서 조회
    // 프로젝트 참여 기간과 계약서 기간이 겹치는 경우를 찾음
    const contractResult = await query(
      `
			SELECT sc.annual_salary, sc.monthly_salary
			FROM salary_contracts sc
			WHERE sc.employee_id = $1
				AND sc.status = 'active'
				AND (
					-- 계약서 시작일이 프로젝트 참여 기간 내에 있거나
					(sc.start_date <= COALESCE($3, CURRENT_DATE) AND (sc.end_date IS NULL OR sc.end_date >= COALESCE($2, CURRENT_DATE)))
					OR
					-- 프로젝트 참여 기간이 계약서 기간 내에 있거나
					(COALESCE($2, CURRENT_DATE) <= sc.start_date AND COALESCE($3, CURRENT_DATE) >= sc.start_date)
				)
			ORDER BY sc.start_date DESC
			LIMIT 1
		`,
      [employeeId, startDate, endDate],
    );

    // 계약서에서 연봉을 가져오거나, 제공된 계약금액 사용
    let finalContractAmount = contractAmount;
    if (contractResult.rows.length > 0) {
      // 연봉을 월급으로 변환 (연봉 / 12)
      finalContractAmount = contractResult.rows[0].annual_salary / 12;
    } else {
      // 계약서가 없는 경우, 해당 직원의 모든 계약서 정보를 조회하여 안내 메시지 생성
      const allContractsResult = await query(
        `
				SELECT sc.start_date, sc.end_date, sc.annual_salary, sc.status
				FROM salary_contracts sc
				WHERE sc.employee_id = $1
				ORDER BY sc.start_date DESC
			`,
        [employeeId],
      );

      if (allContractsResult.rows.length === 0) {
        return json(
          {
            success: false,
            message:
              "해당 직원의 급여 계약서가 등록되지 않았습니다. 급여 계약서를 먼저 등록해주세요.",
            errorCode: "NO_CONTRACT",
          },
          { status: 400 },
        );
      } else {
        // 계약서는 있지만 기간이 맞지 않는 경우
        const contracts = allContractsResult.rows;
        const projectStartDate = startDate ? new Date(startDate) : new Date();
        const projectEndDate = endDate ? new Date(endDate) : new Date();

        // 가장 가까운 계약서 찾기
        const futureContracts = contracts.filter(
          (c) => new Date(c.start_date) > projectStartDate,
        );
        const pastContracts = contracts.filter(
          (c) => new Date(c.start_date) <= projectStartDate,
        );

        let message = `프로젝트 참여 기간(${startDate || "시작일 미정"} ~ ${endDate || "종료일 미정"})에 해당 직원이 재직 중이 아닙니다.\n\n`;

        if (futureContracts.length > 0) {
          const nextContract = futureContracts[futureContracts.length - 1]; // 가장 가까운 미래 계약
          const contractStartDate = formatDateForKorean(
            nextContract.start_date,
          );
          message += `다음 계약 시작일: ${contractStartDate}\n`;
          message += `해당 날짜부터 프로젝트 참여가 가능합니다.`;
        } else if (pastContracts.length > 0) {
          const lastContract = pastContracts[0];
          if (lastContract.end_date) {
            const contractEndDate = formatDateForKorean(lastContract.end_date);
            message += `마지막 계약 종료일: ${contractEndDate}\n`;
            message += `해당 직원은 이미 퇴사한 상태입니다.`;
          } else {
            message += `계약서 상태를 확인해주세요.`;
          }
        }

        return json(
          {
            success: false,
            message: message,
            errorCode: "CONTRACT_PERIOD_MISMATCH",
            contracts: contracts.map((c) => ({
              startDate: c.start_date,
              endDate: c.end_date,
              status: c.status,
            })),
          },
          { status: 400 },
        );
      }
    }

    // 실제 근로계약서에서 월급 가져오기
    let contractMonthlySalary = 0;
    if (contractResult.rows.length > 0) {
      const contract = contractResult.rows[0];
      contractMonthlySalary =
        contract.monthly_salary || contract.annual_salary / 12;
    }

    // 월간 금액 계산: 중앙화된 급여 계산 함수 사용
    const monthlyAmount = calculateMonthlySalary(
      contractMonthlySalary * 12, // 연봉으로 변환
      participationRate,
    );

    // 프로젝트 멤버 추가 (contract_amount 제거)
    const result = await query(
      `
			INSERT INTO project_members (project_id, employee_id, role, start_date, end_date, participation_rate, contribution_type, monthly_amount, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING *
		`,
      [
        projectId,
        employeeId,
        role,
        startDate,
        endDate,
        participationRate,
        contributionType,
        monthlyAmount,
        status,
      ],
    );

    // 추가된 멤버 정보와 관련 정보 조회
    const memberWithDetails = await query(
      `
			SELECT 
				pm.*,
				CASE 
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$' 
					THEN CONCAT(e.last_name, e.first_name)
					ELSE CONCAT(e.first_name, ' ', e.last_name)
				END as employee_name,
				e.first_name,
				e.last_name,
				e.email as employee_email,
				e.department as employee_department,
				e.position as employee_position,
				p.title as project_title,
				p.code as project_code
			FROM project_members pm
			JOIN employees e ON pm.employee_id = e.id
			JOIN projects p ON pm.project_id = p.id
			WHERE pm.id = $1
		`,
      [result.rows[0].id],
    );

    // TIMESTAMP 데이터를 YYYY-MM-DD 형식으로 변환 (중앙화된 함수 사용)
    const memberData = memberWithDetails.rows[0];
    const formattedMemberData = {
      ...memberData,
      start_date: formatDateForAPI(memberData.start_date),
      end_date: formatDateForAPI(memberData.end_date),
    };

    return json({
      success: true,
      data: formattedMemberData,
      message: "프로젝트 멤버가 성공적으로 추가되었습니다.",
    });
  } catch (error) {
    logger.error("프로젝트 멤버 추가 실패:", error);
    return json(
      {
        success: false,
        message: "프로젝트 멤버 추가에 실패했습니다.",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
};
