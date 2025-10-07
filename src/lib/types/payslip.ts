/**
 * 급여명세서 관련 타입 정의
 */

export interface PayslipItem {
  name: string
  amount: number
}

export interface PayslipPDFData {
  // 직원 정보
  employeeName: string
  employeeId: string
  department?: string
  position?: string

  // 급여 기간
  year: number
  month: number
  paymentDate?: string

  // 급여 항목
  payments: PayslipItem[]
  deductions: PayslipItem[]

  // 합계
  totalPayments: number
  totalDeductions: number
  netSalary: number

  // 회사 정보 (옵션)
  companyName?: string
  companyAddress?: string
  ceoName?: string
}
