// API 데이터 변환 유틸리티
// 데이터베이스 snake_case를 JavaScript camelCase로 변환하는 공통 함수들

import { formatDateForAPI } from './date-calculator'
import { formatEmployeeName } from './format'
import { logger } from './logger'

/**
 * 한국 이름을 표준 형식으로 포맷팅 (성+이름, 띄어쓰기 없음)
 */
function formatKoreanNameStandard(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return ''

  const trimmed = fullName.trim()

  // 이미 표준 형식인 경우 (띄어쓰기 없음)
  if (!trimmed.includes(' ')) {
    return trimmed
  }

  // 한국 이름인지 확인 (한글 정규식)
  const koreanRegex = /^[가-힣\s]+$/
  if (koreanRegex.test(trimmed)) {
    // 공백으로 분리
    const parts = trimmed.split(/\s+/)
    if (parts.length === 2) {
      const [first, second] = parts

      // 일반적으로 성은 1글자, 이름은 2글자 이상
      if (first.length >= 2 && second.length === 1) {
        // "지은 차" -> "차지은" (이름 성 -> 성 이름)
        return formatEmployeeName({ last_name: second, first_name: first })
      } else if (first.length === 1 && second.length >= 2) {
        // "차 지은" -> "차지은" (이미 올바른 순서)
        return formatEmployeeName({ last_name: first, first_name: second })
      }
    }
  }

  // 한국 이름이 아닌 경우 원본 반환
  return trimmed
}

/**
 * 프로젝트 데이터 변환
 */
export function transformProjectData(project: Record<string, unknown>) {
  // snake_case 필드들을 제거하고 camelCase로만 구성
  const {
    start_date,
    end_date,
    manager_id,
    budget_total,
    sponsor_type,
    sponsor_name,
    research_type,
    technology_area,
    created_at,
    updated_at,
    manager_name,
    member_count,
    total_participation_rate,
    budget_currency,
    ...otherFields
  } = project

  return {
    ...otherFields,
    // camelCase로 변환된 필드들만 포함
    startDate: start_date && start_date !== 'null' ? formatDateForAPI(String(start_date)) : null,
    endDate: end_date && end_date !== 'null' ? formatDateForAPI(String(end_date)) : null,
    managerId: manager_id,
    budgetTotal: budget_total,
    sponsorType: sponsor_type,
    sponsorName: sponsor_name,
    researchType: research_type,
    technologyArea: technology_area,
    createdAt: created_at,
    updatedAt: updated_at,
    budgetCurrency: budget_currency,
    // 추가 필드들
    ...(manager_name ? { managerName: String(manager_name) } : {}),
    ...(member_count ? { memberCount: parseInt(String(member_count)) || 0 } : {}),
    ...(total_participation_rate
      ? {
          totalParticipationRate: parseInt(String(total_participation_rate)) || 0,
        }
      : {}),
  }
}

/**
 * 프로젝트 멤버 데이터 변환
 */
export function transformProjectMemberData(member: Record<string, unknown>) {
  // snake_case 필드들을 제거하고 camelCase로만 구성
  const {
    employee_id,
    employee_name,
    project_id,
    start_date,
    end_date,
    participation_rate,
    monthly_amount,
    cash_amount,
    in_kind_amount,
    created_at,
    updated_at,
    ...otherFields
  } = member

  // 안전한 날짜 변환 함수
  function safeFormatDate(dateValue: unknown): string {
    if (!dateValue) return ''
    try {
      return formatDateForAPI(String(dateValue))
    } catch (error) {
      logger.error('Date formatting error:', error, 'for value:', dateValue)
      return String(dateValue)
    }
  }

  return {
    ...otherFields,
    // camelCase로 변환된 필드들만 포함
    employeeId: employee_id,
    employeeName: employee_name,
    projectId: project_id,
    startDate: safeFormatDate(start_date),
    endDate: safeFormatDate(end_date),
    participationRate: participation_rate,
    monthlyAmount: monthly_amount,
    cashAmount: cash_amount,
    inKindAmount: in_kind_amount,
    createdAt: safeFormatDate(created_at),
    updatedAt: safeFormatDate(updated_at),
  }
}

/**
 * 프로젝트 예산 데이터 변환
 */
export function transformProjectBudgetData(budget: Record<string, unknown>) {
  // snake_case 필드들을 제거하고 camelCase로만 구성
  const {
    project_id,
    start_date,
    end_date,
    period_number,
    created_at,
    updated_at,
    ...otherFields
  } = budget

  return {
    ...otherFields,
    // camelCase로 변환된 필드들만 포함
    projectId: project_id,
    startDate: formatDateForAPI(String(start_date)),
    endDate: formatDateForAPI(String(end_date)),
    fiscalYear: period_number,
    periodNumber: period_number,
    createdAt: created_at,
    updatedAt: updated_at,
  }
}

/**
 * 마일스톤 데이터 변환
 */
export function transformMilestoneData(milestone: Record<string, unknown>) {
  return {
    ...milestone,
    projectId: milestone.project_id,
    dueDate: formatDateForAPI(String(milestone.due_date)),
    createdAt: milestone.created_at,
    updatedAt: milestone.updated_at,
  }
}

/**
 * 리스크 데이터 변환
 */
export function transformRiskData(risk: Record<string, unknown>) {
  return {
    ...risk,
    projectId: risk.project_id,
    ownerId: risk.owner_id,
    ownerName: risk.owner_name,
    createdAt: risk.created_at,
    updatedAt: risk.updated_at,
  }
}

/**
 * 직원 데이터 변환
 */
export function transformEmployeeData(employee: Record<string, unknown>) {
  const lastName = employee.last_name || ''
  const firstName = employee.first_name || ''

  return {
    ...employee,
    employeeId: employee.employee_id,
    firstName: firstName,
    lastName: lastName,
    phoneNumber: employee.phone_number,
    emailAddress: employee.email_address,
    departmentId: employee.department_id,
    positionId: employee.position_id,
    hireDate: formatDateForAPI(String(employee.hire_date)),
    salaryAmount: employee.salary_amount,
    createdAt: employee.created_at,
    updatedAt: employee.updated_at,
    // 직원 이름을 표준 형식으로 변환
    ...(lastName && firstName
      ? {
          displayName: formatEmployeeName({
            last_name: String(lastName),
            first_name: String(firstName),
          }),
        }
      : {}),
    ...(employee.name
      ? {
          name: formatKoreanNameStandard(String(employee.name)),
        }
      : {}),
  }
}

/**
 * 증빙 항목 데이터 변환
 */
export function transformEvidenceItemData(evidence: Record<string, unknown>) {
  return {
    ...evidence,
    projectId: evidence.project_id,
    projectBudgetId: evidence.project_budget_id,
    dueDate: formatDateForAPI(String(evidence.due_date)),
    createdAt: evidence.created_at,
    updatedAt: evidence.updated_at,
    // 담당자 이름을 표준 형식으로 변환
    ...(evidence.assignee_full_name
      ? {
          assigneeFullName: formatKoreanNameStandard(String(evidence.assignee_full_name)),
        }
      : {}),
    ...(evidence.assignee_name
      ? {
          assigneeName: formatKoreanNameStandard(String(evidence.assignee_name)),
        }
      : {}),
  }
}

/**
 * 배열 데이터 일괄 변환
 */
export function transformArrayData<T>(
  data: unknown[],
  transformer: (item: Record<string, unknown>) => T,
): T[] {
  return data.map(transformer)
}

/**
 * 일반적인 snake_case to camelCase 변환
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => (letter as string).toUpperCase())
}

/**
 * 객체의 모든 키를 snake_case에서 camelCase로 변환
 */
export function transformObjectKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(transformObjectKeys)
  if (typeof obj !== 'object') return obj

  const transformed: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key)
    transformed[camelKey] = transformObjectKeys(value)
  }
  return transformed
}
