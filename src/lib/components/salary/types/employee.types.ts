/**
 * 직원 기본 정보 타입
 */
export type Employee = {
  /** 직원 고유 ID */
  id?: string
  /** 직원 번호 */
  employeeId?: string
  /** 직원 이름 */
  name?: string
  /** 부서명 */
  department?: string
  /** 직책 */
  position?: string
  /** 재직 상태 */
  status?: 'active' | 'inactive' | 'terminated'
  /** 입사일 (YYYY-MM-DD) */
  hireDate?: string
}

/**
 * 급여 계약 정보 타입
 */
export type EmployeeContract = {
  /** 월급 */
  monthlySalary?: number
  /** 연봉 */
  annualSalary?: number
  /** 계약 시작일 (YYYY-MM-DD) */
  startDate?: string
  /** 계약 종료일 (YYYY-MM-DD) */
  endDate?: string
  /** 계약 종료일 표시용 텍스트 */
  contractEndDisplay?: string
  /** 계약 상태 */
  status?: string
}
