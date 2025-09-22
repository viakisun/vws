import { Pool } from 'pg'

// 데이터베이스 연결 풀
const pool = new Pool({
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: { rejectUnauthorized: false }
})

// 검증 결과 타입 정의
export interface ValidationResult {
  isValid: boolean
  reason: string
  message: string
  issues?: string[]
  details?: any
}

export interface ValidationResponse {
  success: boolean
  projectId: string
  projectTitle?: string
  validationResults: any[]
  overallValidation: {
    isValid: boolean
    totalItems: number
    validItems: number
    invalidItems: number
  }
  generatedAt: string
}

// 공통 검증 유틸리티 함수들
export class ValidationUtils {
  // 데이터베이스 연결 풀 접근자
  static get pool() {
    return pool
  }

  // 쿼리 메서드
  static async query(text: string, params?: any[]) {
    return await pool.query(text, params)
  }

  // 프로젝트 ID로 조회
  static async getProjectById(projectId: string) {
    return await this.getProjectInfo(projectId)
  }

  // 검증 결과 생성 메서드
  static createValidationResult(
    isValid: boolean,
    reason: string,
    message: string,
    issues?: string[],
    details?: any
  ): ValidationResult {
    return {
      isValid,
      reason,
      message,
      issues,
      details
    }
  }
  /**
   * 프로젝트 기본 정보 조회
   */
  static async getProjectInfo(projectId: string) {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId])
    if (result.rows.length === 0) {
      throw new Error('프로젝트를 찾을 수 없습니다.')
    }
    return result.rows[0]
  }

  /**
   * 프로젝트 예산 정보 조회
   */
  static async getProjectBudgets(projectId: string) {
    const result = await pool.query(
      'SELECT * FROM project_budgets WHERE project_id = $1 ORDER BY period_number',
      [projectId]
    )
    return result.rows
  }

  /**
   * 프로젝트 참여연구원 정보 조회 (인사 데이터 포함)
   */
  static async getProjectMembers(projectId: string) {
    const result = await pool.query(
      `
			SELECT 
				pm.*,
				e.first_name,
				e.last_name,
				e.hire_date,
				e.termination_date,
				e.status,
				e.employment_type,
				e.department,
				e.position
			FROM project_members pm
			LEFT JOIN employees e ON pm.employee_id = e.id
			WHERE pm.project_id = $1
			ORDER BY pm.start_date
		`,
      [projectId]
    )
    return result.rows
  }

  /**
   * 증빙 항목 정보 조회
   */
  static async getEvidenceItems(projectId: string, categoryName?: string) {
    let query = `
			SELECT 
				ei.*,
				pb.period_number,
				pb.fiscal_year,
				pb.start_date as period_start_date,
				pb.end_date as period_end_date,
				ec.name as category_name
			FROM evidence_items ei
			JOIN project_budgets pb ON ei.project_budget_id = pb.id
			JOIN evidence_categories ec ON ei.category_id = ec.id
			WHERE pb.project_id = $1
		`
    const params = [projectId]

    if (categoryName) {
      query += ' AND ec.name = $2'
      params.push(categoryName)
    }

    query += ' ORDER BY pb.period_number, ei.due_date'

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * 직원 정보 조회
   */
  static async getEmployeeInfo(employeeId: string) {
    const result = await pool.query(
      `
			SELECT 
				id,
				first_name,
				last_name,
				hire_date,
				termination_date,
				status,
				employment_type,
				department,
				position
			FROM employees 
			WHERE id = $1
		`,
      [employeeId]
    )
    return result.rows[0] || null
  }

  /**
   * 날짜 범위 겹침 확인
   */
  static isDateRangeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 <= end2 && start2 <= end1
  }

  /**
   * 날짜 차이 계산 (월 단위)
   */
  static getMonthsDifference(startDate: Date, endDate: Date): number {
    return (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) +
      1
    )
  }

  /**
   * 금액 차이 계산 (허용 오차 포함)
   */
  static isAmountWithinTolerance(
    expected: number,
    actual: number,
    tolerance: number = 1000
  ): boolean {
    return Math.abs(expected - actual) <= tolerance
  }

  /**
   * 전체 검증 결과 생성
   */
  static createOverallValidation(validationResults: any[]) {
    const validItems = validationResults.filter(result => result.validation.isValid).length
    const invalidItems = validationResults.filter(result => !result.validation.isValid).length

    return {
      isValid: invalidItems === 0,
      totalItems: validationResults.length,
      validItems,
      invalidItems
    }
  }

  /**
   * 표준 검증 응답 생성
   */
  static createValidationResponse(
    projectId: string,
    projectTitle: string,
    validationResults: any[],
    overallValidation: any
  ): ValidationResponse {
    return {
      success: true,
      projectId,
      projectTitle,
      validationResults,
      overallValidation,
      generatedAt: new Date().toISOString()
    }
  }

  /**
   * 에러 응답 생성
   */
  static createErrorResponse(error: any, message: string = '검증 중 오류가 발생했습니다.') {
    return {
      success: false,
      error: message,
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  /**
   * 프로젝트 예산 업데이트
   */
  static async updateProjectBudget(budgetId: string, data: any): Promise<boolean> {
    try {
      const fields = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ')
      const values = Object.values(data)
      const query = `UPDATE project_budgets SET ${fields} WHERE id = $1`
      await ValidationUtils.query(query, [budgetId, ...values])
      return true
    } catch (error) {
      console.error('❌ [ValidationUtils] 프로젝트 예산 업데이트 실패:', error)
      return false
    }
  }

  /**
   * 프로젝트 업데이트
   */
  static async updateProject(projectId: string, data: any): Promise<boolean> {
    try {
      const fields = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ')
      const values = Object.values(data)
      const query = `UPDATE projects SET ${fields} WHERE id = $1`
      await ValidationUtils.query(query, [projectId, ...values])
      return true
    } catch (error) {
      console.error('❌ [ValidationUtils] 프로젝트 업데이트 실패:', error)
      return false
    }
  }

  /**
   * 프로젝트 멤버 업데이트
   */
  static async updateProjectMember(memberId: string, data: any): Promise<boolean> {
    try {
      const fields = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ')
      const values = Object.values(data)
      const query = `UPDATE project_members SET ${fields} WHERE id = $1`
      await ValidationUtils.query(query, [memberId, ...values])
      return true
    } catch (error) {
      console.error('❌ [ValidationUtils] 프로젝트 멤버 업데이트 실패:', error)
      return false
    }
  }

  /**
   * 증빙 항목 업데이트
   */
  static async updateEvidenceItem(itemId: string, data: any): Promise<boolean> {
    try {
      const fields = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ')
      const values = Object.values(data)
      const query = `UPDATE evidence_items SET ${fields} WHERE id = $1`
      await ValidationUtils.query(query, [itemId, ...values])
      return true
    } catch (error) {
      console.error('❌ [ValidationUtils] 증빙 항목 업데이트 실패:', error)
      return false
    }
  }
}

// 인건비 검증 로직
export class PersonnelCostValidator {
  /**
   * 참여연구원의 실제 인건비 계산
   */
  static calculateActualPersonnelCost(members: any[], budget: any): number {
    const budgetStartDate = new Date(budget.start_date)
    const budgetEndDate = new Date(budget.end_date)

    const relevantMembers = members.filter(member => {
      const memberStartDate = new Date(member.start_date)
      const memberEndDate = new Date(member.end_date)
      return ValidationUtils.isDateRangeOverlap(
        memberStartDate,
        memberEndDate,
        budgetStartDate,
        budgetEndDate
      )
    })

    let totalCost = 0
    relevantMembers.forEach(member => {
      const memberStartDate = new Date(member.start_date)
      const memberEndDate = new Date(member.end_date)

      const actualStartDate = memberStartDate > budgetStartDate ? memberStartDate : budgetStartDate
      const actualEndDate = memberEndDate < budgetEndDate ? memberEndDate : budgetEndDate

      const months = ValidationUtils.getMonthsDifference(actualStartDate, actualEndDate)
      const monthlyAmount = parseFloat(member.monthly_amount) || 0
      const participationRate = parseFloat(member.participation_rate) || 0

      const memberCost = monthlyAmount * months * (participationRate / 100)
      totalCost += memberCost
    })

    return totalCost
  }

  /**
   * 인건비 검증
   */
  static validatePersonnelCost(budget: any, actualCost: number): ValidationResult {
    const budgetedCost = parseFloat(budget.personnel_cost) || 0
    const isWithinTolerance = ValidationUtils.isAmountWithinTolerance(budgetedCost, actualCost)

    if (isWithinTolerance) {
      return ValidationUtils.createValidationResult(true, 'VALID', '인건비가 예산과 일치합니다.')
    }

    return ValidationUtils.createValidationResult(
      false,
      'PERSONNEL_COST_MISMATCH',
      `인건비 불일치: 예산 ${budgetedCost.toLocaleString()}원 vs 실제 ${actualCost.toLocaleString()}원`,
      [`예산: ${budgetedCost.toLocaleString()}원`, `실제: ${actualCost.toLocaleString()}원`],
      { budgetedCost, actualCost, difference: Math.abs(budgetedCost - actualCost) }
    )
  }
}

// 재직 기간 검증 로직
export class EmploymentPeriodValidator {
  /**
   * 참여연구원 재직 기간 검증
   */
  static validateMemberEmploymentPeriod(member: any, project: any): ValidationResult {
    const memberStartDate = new Date(member.start_date)
    const memberEndDate = new Date(member.end_date)
    const hireDate = member.hire_date ? new Date(member.hire_date) : null
    const terminationDate = member.termination_date ? new Date(member.termination_date) : null
    const projectStartDate = new Date(project.start_date)
    const projectEndDate = new Date(project.end_date)

    const issues: string[] = []

    // 1. 직원 정보가 없는 경우
    if (!member.first_name || !member.last_name) {
      return ValidationUtils.createValidationResult(
        false,
        'EMPLOYEE_NOT_FOUND',
        '직원 정보를 찾을 수 없습니다.',
        ['직원 정보 없음']
      )
    }

    // 2. 퇴사한 직원인지 확인
    if (member.status === 'terminated' && terminationDate) {
      if (memberStartDate > terminationDate) {
        issues.push(
          `퇴사일: ${terminationDate.toLocaleDateString()}, 참여시작일: ${memberStartDate.toLocaleDateString()}`
        )
      }
    }

    // 3. 입사 전에 프로젝트에 참여했는지 확인
    if (hireDate && memberStartDate < hireDate) {
      issues.push(
        `입사일: ${hireDate.toLocaleDateString()}, 참여시작일: ${memberStartDate.toLocaleDateString()}`
      )
    }

    // 4. 현재 비활성 상태인 직원인지 확인
    if (member.status === 'inactive') {
      issues.push(`상태: ${member.status}`)
    }

    // 5. 프로젝트 기간과 재직 기간이 겹치는지 확인
    if (hireDate && projectEndDate < hireDate) {
      issues.push(
        `프로젝트 종료: ${projectEndDate.toLocaleDateString()}, 입사일: ${hireDate.toLocaleDateString()}`
      )
    }

    if (terminationDate && projectStartDate > terminationDate) {
      issues.push(
        `프로젝트 시작: ${projectStartDate.toLocaleDateString()}, 퇴사일: ${terminationDate.toLocaleDateString()}`
      )
    }

    if (issues.length > 0) {
      return ValidationUtils.createValidationResult(
        false,
        'EMPLOYMENT_PERIOD_INVALID',
        '재직 기간이 유효하지 않습니다.',
        issues
      )
    }

    return ValidationUtils.createValidationResult(true, 'VALID', '재직 기간이 유효합니다.')
  }

  /**
   * 증빙 항목 재직 기간 검증
   */
  static validateEvidenceEmploymentPeriod(evidence: any, employee: any): ValidationResult {
    if (!employee) {
      return ValidationUtils.createValidationResult(
        false,
        'EMPLOYEE_NOT_FOUND',
        '담당 직원을 찾을 수 없습니다.'
      )
    }

    const dueDate = new Date(evidence.due_date)
    const hireDate = employee.hire_date ? new Date(employee.hire_date) : null
    const terminationDate = employee.termination_date ? new Date(employee.termination_date) : null

    const issues: string[] = []

    // 1. 퇴사한 직원인지 확인
    if (employee.status === 'terminated' || terminationDate) {
      if (terminationDate && dueDate > terminationDate) {
        issues.push(
          `퇴사일(${terminationDate.toLocaleDateString()}) 이후에 인건비가 집행되었습니다.`
        )
      }
    }

    // 2. 입사 전에 인건비가 집행되었는지 확인
    if (hireDate && dueDate < hireDate) {
      issues.push(`입사일(${hireDate.toLocaleDateString()}) 이전에 인건비가 집행되었습니다.`)
    }

    // 3. 현재 비활성 상태인 직원인지 확인
    if (employee.status === 'inactive') {
      issues.push('비활성 상태인 직원에게 인건비가 집행되었습니다.')
    }

    // 4. 프로젝트 기간과 재직 기간이 겹치는지 확인
    const periodStartDate = new Date(evidence.period_start_date)
    const periodEndDate = new Date(evidence.period_end_date)

    if (hireDate && periodEndDate < hireDate) {
      issues.push(
        `프로젝트 기간(${periodStartDate.toLocaleDateString()} ~ ${periodEndDate.toLocaleDateString()}) 이후에 입사했습니다.`
      )
    }

    if (terminationDate && periodStartDate > terminationDate) {
      issues.push(
        `프로젝트 기간(${periodStartDate.toLocaleDateString()} ~ ${periodEndDate.toLocaleDateString()}) 이전에 퇴사했습니다.`
      )
    }

    if (issues.length > 0) {
      return ValidationUtils.createValidationResult(
        false,
        'EMPLOYMENT_PERIOD_INVALID',
        '재직 기간이 유효하지 않습니다.',
        issues
      )
    }

    return ValidationUtils.createValidationResult(true, 'VALID', '재직 기간이 유효합니다.')
  }
}

// 참여율 검증 로직
export class ParticipationRateValidator {
  /**
   * 참여율 검증
   */
  static validateParticipationRate(members: any[]): ValidationResult {
    const issues: string[] = []

    // 1. 개별 참여율이 100%를 초과하는지 확인
    members.forEach(member => {
      const participationRate = parseFloat(member.participation_rate) || 0
      if (participationRate > 100) {
        issues.push(
          `${member.first_name} ${member.last_name}: 참여율 ${participationRate}% (100% 초과)`
        )
      }
    })

    // 2. 동일 기간 내 참여율 합계가 100%를 초과하는지 확인
    const periodGroups = new Map<string, number>()

    members.forEach(member => {
      const key = `${member.start_date}_${member.end_date}`
      const currentTotal = periodGroups.get(key) || 0
      const participationRate = parseFloat(member.participation_rate) || 0
      periodGroups.set(key, currentTotal + participationRate)
    })

    periodGroups.forEach((total, period) => {
      if (total > 100) {
        issues.push(`기간 ${period}: 총 참여율 ${total}% (100% 초과)`)
      }
    })

    if (issues.length > 0) {
      return ValidationUtils.createValidationResult(
        false,
        'PARTICIPATION_RATE_INVALID',
        '참여율이 유효하지 않습니다.',
        issues
      )
    }

    return ValidationUtils.createValidationResult(true, 'VALID', '참여율이 유효합니다.')
  }
}

// 예산 일관성 검증 로직
export class BudgetConsistencyValidator {
  /**
   * 예산 일관성 검증
   */
  static validateBudgetConsistency(project: any, budgets: any[]): ValidationResult {
    const totalBudgetFromBudgets = budgets.reduce((sum, budget) => {
      return sum + (parseFloat(budget.total_budget) || 0)
    }, 0)

    const projectTotalBudget = parseFloat(project.budget_total) || 0

    if (ValidationUtils.isAmountWithinTolerance(projectTotalBudget, totalBudgetFromBudgets)) {
      return ValidationUtils.createValidationResult(true, 'VALID', '예산이 일관성 있습니다.')
    }

    return ValidationUtils.createValidationResult(
      false,
      'BUDGET_INCONSISTENCY',
      `예산 일관성 문제: 프로젝트 총 예산 ${projectTotalBudget.toLocaleString()}원 vs 연차별 예산 합계 ${totalBudgetFromBudgets.toLocaleString()}원`,
      [
        `프로젝트 총 예산: ${projectTotalBudget.toLocaleString()}원`,
        `연차별 예산 합계: ${totalBudgetFromBudgets.toLocaleString()}원`
      ],
      {
        projectTotalBudget,
        totalBudgetFromBudgets,
        difference: Math.abs(projectTotalBudget - totalBudgetFromBudgets)
      }
    )
  }
}

// 사용률 검증 로직
export class UsageRateValidator {
  /**
   * 사용률 검증
   */
  static validateUsageRate(budget: any, evidenceItems: any[]): ValidationResult {
    const totalBudget = parseFloat(budget.total_budget) || 0
    const spentAmount = parseFloat(budget.spent_amount) || 0
    const overallUsageRate = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0

    const categories = ['인건비', '재료비', '연구활동비', '간접비']
    const issues: string[] = []

    categories.forEach(categoryName => {
      const categoryEvidence = evidenceItems.filter(
        item => item.period_number === budget.period_number && item.category_name === categoryName
      )

      const categorySpent = categoryEvidence.reduce(
        (sum, item) => sum + (parseFloat(item.spent_amount) || 0),
        0
      )

      let categoryBudget = 0
      switch (categoryName) {
        case '인건비':
          categoryBudget = parseFloat(budget.personnel_cost) || 0
          break
        case '재료비':
          categoryBudget = parseFloat(budget.research_material_cost) || 0
          break
        case '연구활동비':
          categoryBudget = parseFloat(budget.research_activity_cost) || 0
          break
        case '간접비':
          categoryBudget = parseFloat(budget.indirect_cost) || 0
          break
      }

      const categoryUsageRate = categoryBudget > 0 ? (categorySpent / categoryBudget) * 100 : 0
      const tolerance = 5 // 5% 허용 오차

      if (Math.abs(categoryUsageRate - overallUsageRate) > tolerance) {
        issues.push(
          `${categoryName}: 전체 ${overallUsageRate.toFixed(1)}% vs ${categoryName} ${categoryUsageRate.toFixed(1)}%`
        )
      }
    })

    if (issues.length > 0) {
      return ValidationUtils.createValidationResult(
        false,
        'USAGE_RATE_INCONSISTENCY',
        '사용률이 일관성 없습니다.',
        issues
      )
    }

    return ValidationUtils.createValidationResult(true, 'VALID', '사용률이 일관성 있습니다.')
  }
}

export { pool }
