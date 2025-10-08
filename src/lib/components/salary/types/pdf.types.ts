/**
 * PDF 출력용 급여명세서 데이터 타입
 */
export type PayslipPDFData = {
  /** 직원 이름 */
  employeeName: string
  /** 직원 번호 */
  employeeId: string
  /** 부서명 */
  department: string
  /** 직책 */
  position: string
  /** 연도 */
  year: number
  /** 월 */
  month: number
  /** 지급일 */
  paymentDate: string
  /** 지급 항목 목록 */
  payments: { name: string; amount: number }[]
  /** 공제 항목 목록 */
  deductions: { name: string; amount: number }[]
  /** 지급 총액 */
  totalPayments: number
  /** 공제 총액 */
  totalDeductions: number
  /** 실지급액 */
  netSalary: number
  /** 회사명 */
  companyName: string
  /** 대표자명 */
  ceoName: string
}

/**
 * 회사 정보 타입
 */
export type CompanyInfo = {
  /** 회사명 */
  name?: string
  /** 대표자명 */
  ceoName?: string
}

/**
 * Payroll Props 타입 (급여 이력에서 전달되는 데이터)
 */
export type PayrollProp = {
  /** 기간 (YYYY-MM) */
  period?: string
  /** 직원 이름 (레거시) */
  employeeName?: string
  /** 직원 정보 객체 */
  employeeInfo?: {
    name?: string
  }
}
