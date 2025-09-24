import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { query } from "$lib/database/connection";
import { logger } from "$lib/utils/logger";

// 조직도 데이터 생성 (동적)
export const GET: RequestHandler = async () => {
  try {
    // 모든 직원 데이터 조회 (직책 정보 포함)
    const employeesResult = await query(`
			SELECT 
				e.id,
				e.first_name,
				e.last_name,
				e.email,
				e.department,
				e.position,
				e.salary,
				e.status,
				e.job_title_id,
				jt.name as job_title_name,
				jt.level as job_title_level,
				jt.category as job_title_category
			FROM employees e
			LEFT JOIN job_titles jt ON e.job_title_id = jt.id
			WHERE e.status = 'active'
			ORDER BY e.department, e.position
		`);

    const employees = Array.isArray(employeesResult)
      ? employeesResult
      : employeesResult.rows || [];

    // 부서별로 직원 그룹화
    const departmentGroups: { [key: string]: unknown[] } = {};
    employees.forEach((emp: any) => {
      const dept = emp.department || "기타";
      if (!departmentGroups[dept]) {
        departmentGroups[dept] = [];
      }
      departmentGroups[dept].push({
        name: `${emp.last_name}${emp.first_name}`,
        position: emp.position,
        email: emp.email,
        salary: emp.salary,
        job_title: emp.job_title_name,
        isTeamLead: emp.job_title_name === "Team Lead",
      });
    });

    // 부서를 임원별로 그룹화하는 매핑
    const executiveDepartmentMapping: { [key: string]: string[] } = {
      대표이사: ["경영기획팀"],
      재무이사: ["경영지원팀"],
      연구소장: ["PSR팀", "GRIT팀", "개발팀"],
    };

    // 동적으로 조직도 구조 생성
    const orgStructure: { [key: string]: any } = {};

    // 각 임원별로 구조 생성
    Object.entries(executiveDepartmentMapping).forEach(
      ([executiveName, departments]) => {
        const children: unknown[] = [];

        departments.forEach((deptName) => {
          // 해당 부서에 직원이 있는지 확인
          if (
            departmentGroups[deptName] &&
            departmentGroups[deptName].length > 0
          ) {
            children.push({
              name: deptName,
              position: "팀",
              type: "department",
              children: departmentGroups[deptName],
            });
          }
        });

        // 직원이 있는 부서가 있는 경우에만 임원 추가
        if (children.length > 0) {
          orgStructure[executiveName] = {
            name: executiveName,
            position: executiveName,
            email: `${executiveName.toLowerCase().replace("이사", "")}@company.com`,
            children: children,
          };
        }
      },
    );

    // 매핑되지 않은 부서들을 '기타' 임원으로 그룹화
    const mappedDepartments = Object.values(executiveDepartmentMapping).flat();
    const unmappedDepartments = Object.keys(departmentGroups).filter(
      (dept) => !mappedDepartments.includes(dept),
    );

    if (unmappedDepartments.length > 0) {
      const otherChildren: unknown[] = [];
      unmappedDepartments.forEach((deptName) => {
        otherChildren.push({
          name: deptName,
          position: "팀",
          type: "department",
          children: departmentGroups[deptName],
        });
      });

      orgStructure["기타"] = {
        name: "기타",
        position: "기타",
        email: "other@company.com",
        children: otherChildren,
      };
    }

    return json({
      success: true,
      data: orgStructure,
      metadata: {
        totalEmployees: employees.length,
        totalDepartments: Object.keys(departmentGroups).length,
        totalExecutives: Object.keys(orgStructure).length,
        departments: Object.keys(departmentGroups),
      },
      message: "조직도 데이터가 성공적으로 생성되었습니다.",
    });
  } catch (error: any) {
    logger.error("Error generating organization chart:", error);
    return json(
      {
        success: false,
        error: error.message || "조직도 생성에 실패했습니다.",
      },
      { status: 500 },
    );
  }
};
