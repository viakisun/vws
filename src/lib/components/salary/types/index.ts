/**
 * 급여 관리 관련 모든 타입 정의
 * @module salary/types
 */

// Employee 관련 타입
export type { Employee, EmployeeContract } from './employee.types'

// Payslip 관련 타입
export type {
  Allowance,
  Deduction,
  PayslipDetail,
  PayslipData,
  PayslipSaveRequest,
  SalaryValidationResult,
  MissingPayslipPeriod,
} from './payslip.types'

// PDF 및 기타 타입
export type { PayslipPDFData, CompanyInfo, PayrollProp } from './pdf.types'
