import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { formatEmployeeName } from '$lib/utils/format'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface EmployeeData {
  id: string
  first_name: string
  last_name: string
  email: string
  department: string
  position: string
  salary: number
  status: string
  job_title_id: string
  job_title_name: string
  job_title_level: number
  job_title_category: string
  [key: string]: unknown
}

interface EmployeeNode {
  name: string
  position: string
  email: string
  salary: number
  job_title: string
  isTeamLead: boolean
}

interface DepartmentNode {
  name: string
  position: string
  type: string
  children: EmployeeNode[]
}

interface ExecutiveNode {
  name: string
  position: string
  email: string
  children: DepartmentNode[]
}

interface OrganizationStructure {
  [executiveName: string]: ExecutiveNode
}

interface OrganizationMetadata {
  totalEmployees: number
  totalDepartments: number
  totalExecutives: number
  departments: string[]
}

// 조직도 데이터 생성 (동적)
export const GET: RequestHandler = async () => {
  try {
    // 모든 직원 데이터 조회 (직책 정보 포함)
    const employeesResult = await query<EmployeeData>(`
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
		`)

    const employees = employeesResult.rows || []

    // 부서별로 직원 그룹화
    const departmentGroups: { [key: string]: EmployeeNode[] } = {}
    employees.forEach((emp) => {
      const dept = emp.department || '기타'
      if (!departmentGroups[dept]) {
        departmentGroups[dept] = []
      }
      departmentGroups[dept].push({
        name: formatEmployeeName(emp),
        position: emp.position,
        email: emp.email,
        salary: emp.salary,
        job_title: emp.job_title_name,
        isTeamLead: emp.job_title_name === 'Team Lead',
      })
    })

    // 부서를 임원별로 그룹화하는 매핑
    const executiveDepartmentMapping: { [key: string]: string[] } = {
      대표이사: ['경영기획팀'],
      재무이사: ['경영지원팀'],
      연구소장: ['PSR팀', 'GRIT팀', '개발팀'],
    }

    // 동적으로 조직도 구조 생성
    const orgStructure: OrganizationStructure = {}

    // 각 임원별로 구조 생성
    Object.entries(executiveDepartmentMapping).forEach(([executiveName, departments]) => {
      const children: DepartmentNode[] = []

      departments.forEach((deptName) => {
        // 해당 부서에 직원이 있는지 확인
        if (departmentGroups[deptName] && departmentGroups[deptName].length > 0) {
          children.push({
            name: deptName,
            position: '팀',
            type: 'department',
            children: departmentGroups[deptName],
          })
        }
      })

      // 직원이 있는 부서가 있는 경우에만 임원 추가
      if (children.length > 0) {
        orgStructure[executiveName] = {
          name: executiveName,
          position: executiveName,
          email: `${executiveName.toLowerCase().replace('이사', '')}@company.com`,
          children: children,
        }
      }
    })

    // 매핑되지 않은 부서들을 '기타' 임원으로 그룹화
    const mappedDepartments = Object.values(executiveDepartmentMapping).flat()
    const unmappedDepartments = Object.keys(departmentGroups).filter(
      (dept) => !mappedDepartments.includes(dept),
    )

    if (unmappedDepartments.length > 0) {
      const otherChildren: DepartmentNode[] = []
      unmappedDepartments.forEach((deptName) => {
        otherChildren.push({
          name: deptName,
          position: '팀',
          type: 'department',
          children: departmentGroups[deptName],
        })
      })

      orgStructure['기타'] = {
        name: '기타',
        position: '기타',
        email: 'other@company.com',
        children: otherChildren,
      }
    }

    const metadata: OrganizationMetadata = {
      totalEmployees: employees.length,
      totalDepartments: Object.keys(departmentGroups).length,
      totalExecutives: Object.keys(orgStructure).length,
      departments: Object.keys(departmentGroups),
    }

    const response: ApiResponse<OrganizationStructure> = {
      success: true,
      data: orgStructure,
      message: '조직도 데이터가 성공적으로 생성되었습니다.',
    }

    return json({
      ...response,
      metadata,
    })
  } catch (error: unknown) {
    logger.error('Error generating organization chart:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '조직도 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
