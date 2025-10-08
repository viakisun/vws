/**
 * 수당 항목 타입
 */
export type Allowance = {
  /** 수당 고유 ID */
  id?: string
  /** 수당명 */
  name?: string
  /** 수당 금액 */
  amount?: number
  /** 수당 유형 (basic, allowance, bonus, settlement 등) */
  type?: string
  /** 과세 대상 여부 */
  isTaxable?: boolean
}

/**
 * 공제 항목 타입
 */
export type Deduction = {
  /** 공제 고유 ID */
  id?: string
  /** 공제명 */
  name?: string
  /** 공제 금액 */
  amount?: number
  /** 공제율 (0~1 사이 값, 예: 0.034 = 3.4%) */
  rate?: number
  /** 공제 유형 (insurance, pension, tax, other 등) */
  type?: string
  /** 의무 공제 여부 */
  isMandatory?: boolean
}

/**
 * 급여명세서 상세 정보 타입
 */
export type PayslipDetail = {
  /** 기본급 */
  baseSalary?: number
  /** 지급 총액 */
  totalPayments?: number
  /** 공제 총액 */
  totalDeductions?: number
  /** 실지급액 */
  netSalary?: number
  /** 지급 항목 목록 */
  payments?: Allowance[]
  /** 공제 항목 목록 */
  deductions?: Deduction[]
  /** 지급일 (YYYY-MM-DD) */
  payDate?: string
}

/**
 * 월별 급여명세서 데이터 타입
 */
export type PayslipData = {
  /** 월 (1~12) */
  month?: number
  /** 월 표시 라벨 (예: "1월") */
  label?: string
  /** 기간 (YYYY-MM 형식) */
  period?: string
  /** 데이터 존재 여부 */
  hasData?: boolean
  /** 잠금 상태 (편집 불가) */
  isLocked?: boolean
  /** 입사 전 여부 */
  isBeforeHire?: boolean
  /** 수당 목록 (편집 시 사용) */
  allowances?: Allowance[]
  /** 공제 목록 (편집 시 사용) */
  deductions?: Deduction[]
  /** 지급 총액 (편집 시 사용) */
  totalPayments?: number
  /** 공제 총액 (편집 시 사용) */
  totalDeductions?: number
  /** 실지급액 (편집 시 사용) */
  netSalary?: number
  /** 급여명세서 상세 정보 */
  payslip?: PayslipDetail
}

/**
 * 급여명세서 저장 요청 타입
 */
export type PayslipSaveRequest = {
  /** 직원 ID */
  employeeId: string
  /** 기간 (YYYY-MM) */
  period: string
  /** 지급일 (YYYY-MM-DD) */
  payDate: string
  /** 기본급 */
  baseSalary: number
  /** 지급 총액 */
  totalPayments: number
  /** 공제 총액 */
  totalDeductions: number
  /** 실지급액 */
  netSalary: number
  /** 지급 항목 목록 */
  payments: Allowance[]
  /** 공제 항목 목록 */
  deductions: Deduction[]
  /** 상태 */
  status: string
  /** 자동 생성 여부 */
  isGenerated: boolean
}

/**
 * 급여 검증 결과 타입
 */
export type SalaryValidationResult = {
  /** 검증 통과 여부 */
  isValid: boolean
  /** 실제 급여 총액 (기본급 + 차량유지 + 식대) */
  coreSalaryTotal: number
  /** 계약 급여 */
  contractSalary: number
  /** 차액 */
  difference: number
}

/**
 * 누락된 급여명세서 기간 정보
 */
export type MissingPayslipPeriod = {
  /** 기간 (YYYY-MM) */
  period: string
  /** 연도 */
  year: number
  /** 월 */
  month: number
  /** 표시 라벨 */
  label: string
}
