// 급여 관리 시스템 타입 정의

import type { EmployeeId } from './hr'

// ===== 기본 타입 =====
export type SalaryId = string
export type PayrollId = string
export type PayslipId = string

// ===== 급여 구조 관련 타입 =====
export interface SalaryStructure {
  id: SalaryId
  employeeId: EmployeeId
  baseSalary: number // 기본급
  allowances: Allowance[] // 수당
  deductions: Deduction[] // 공제
  totalAllowances: number // 총 수당
  totalDeductions: number // 총 공제
  netSalary: number // 실지급액
  effectiveDate: string // 적용 시작일
  endDate?: string // 적용 종료일
  status: 'active' | 'inactive' | 'pending' | 'cancelled'
  createdAt: string
  updatedAt: string
  createdBy: string
  approvedBy?: string
  approvedAt?: string
}

export interface Allowance {
  id: string
  type: AllowanceType
  name: string
  amount: number
  isTaxable: boolean // 과세 여부
  isRegular: boolean // 정기 지급 여부
  description?: string
}

export interface Deduction {
  id: string
  type: DeductionType
  name: string
  amount: number
  isMandatory: boolean // 법정 공제 여부
  description?: string
}

export type AllowanceType =
  | 'housing' // 주거비
  | 'transport' // 교통비
  | 'meal' // 식비
  | 'overtime' // 초과근무수당
  | 'bonus' // 상여금
  | 'incentive' // 인센티브
  | 'holiday' // 휴일수당
  | 'night_shift' // 야간수당
  | 'weekend' // 주말수당
  | 'performance' // 성과급
  | 'special' // 특별수당
  | 'other' // 기타

export type DeductionType =
  | 'income_tax' // 소득세
  | 'local_tax' // 지방소득세
  | 'national_pension' // 국민연금
  | 'health_insurance' // 건강보험
  | 'employment_insurance' // 고용보험
  | 'long_term_care' // 장기요양보험
  | 'meal_deduction' // 식대 공제
  | 'transport_deduction' // 교통비 공제
  | 'loan' // 대출
  | 'advance' // 선급금
  | 'penalty' // 벌금
  | 'other' // 기타

// ===== 급여 지급 관련 타입 =====
export interface Payroll {
  id: PayrollId
  period: string // 급여 기간 (예: "2024-01")
  payDate: string // 지급일
  status: PayrollStatus
  totalEmployees: number // 총 직원 수
  totalGrossSalary: number // 총 지급액
  totalDeductions: number // 총 공제액
  totalNetSalary: number // 총 실지급액
  createdAt: string
  updatedAt: string
  createdBy: string
  approvedBy?: string
  approvedAt?: string
}

export type PayrollStatus = 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled'

// ===== 급여명세서 관련 타입 =====
export interface Payslip {
  id: PayslipId
  employeeId: EmployeeId
  payrollId: PayrollId
  period: string // 급여 기간
  payDate: string // 지급일
  employeeInfo: EmployeePayslipInfo
  salaryInfo: SalaryPayslipInfo
  allowances: Allowance[]
  deductions: Deduction[]
  totals: PayslipTotals
  status: PayslipStatus
  generatedAt: string
  generatedBy: string
}

export interface EmployeePayslipInfo {
  name: string
  employeeId: string
  department: string
  position: string
  hireDate: string
  bankAccount?: string
  bankName?: string
}

export interface SalaryPayslipInfo {
  baseSalary: number
  totalAllowances: number
  totalDeductions: number
  grossSalary: number
  netSalary: number
  workingDays: number
  actualWorkingDays: number
}

export interface PayslipTotals {
  grossSalary: number // 총 지급액
  totalAllowances: number // 총 수당
  totalDeductions: number // 총 공제
  netSalary: number // 실지급액
  taxableIncome: number // 과세소득
  nonTaxableIncome: number // 비과세소득
}

export type PayslipStatus = 'generated' | 'sent' | 'viewed' | 'downloaded'

// ===== 급여 이력 관련 타입 =====
export interface SalaryHistory {
  id: string
  employeeId: EmployeeId
  period: string // 급여 기간
  baseSalary: number
  totalAllowances: number
  totalDeductions: number
  grossSalary: number
  netSalary: number
  changeType: SalaryChangeType
  changeReason: string
  effectiveDate: string
  createdAt: string
  createdBy: string
}

export type SalaryChangeType =
  | 'initial' // 초기 설정
  | 'promotion' // 승진
  | 'demotion' // 강등
  | 'adjustment' // 조정
  | 'bonus' // 상여금
  | 'overtime' // 초과근무
  | 'deduction' // 공제
  | 'other' // 기타

// ===== 급여 통계 관련 타입 =====
export interface SalaryStatistics {
  period: string
  totalEmployees: number
  averageSalary: number
  medianSalary: number
  totalGrossSalary: number
  totalDeductions: number
  totalNetSalary: number
  byDepartment: Record<string, DepartmentSalaryStats>
  byPosition: Record<string, PositionSalaryStats>
  salaryDistribution: SalaryDistribution
}

export interface DepartmentSalaryStats {
  employeeCount: number
  averageSalary: number
  totalGrossSalary: number
  totalNetSalary: number
}

export interface PositionSalaryStats {
  employeeCount: number
  averageSalary: number
  minSalary: number
  maxSalary: number
}

export interface SalaryDistribution {
  under30: number // 3000만원 미만
  under40: number // 3000-4000만원
  under50: number // 4000-5000만원
  under60: number // 5000-6000만원
  under70: number // 6000-7000만원
  over70: number // 7000만원 이상
}

// ===== 급여 검색 및 필터 관련 타입 =====
export interface SalarySearchFilter {
  employeeId?: string
  employeeName?: string
  department?: string
  position?: string
  periodFrom?: string
  periodTo?: string
  status?: PayrollStatus
  amountFrom?: number
  amountTo?: number
}

export interface SalarySearchResult {
  payslips: Payslip[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ===== 급여 계산 관련 타입 =====
export interface SalaryCalculation {
  employeeId: EmployeeId
  period: string
  baseSalary: number
  allowances: Allowance[]
  deductions: Deduction[]
  overtimeHours?: number
  overtimeRate?: number
  workingDays: number
  actualWorkingDays: number
  calculatedGrossSalary: number
  calculatedNetSalary: number
  calculationDetails: CalculationDetail[]
}

export interface CalculationDetail {
  type: 'allowance' | 'deduction'
  name: string
  amount: number
  formula?: string
  description?: string
}

// ===== 급여 승인 관련 타입 =====
export interface SalaryApproval {
  id: string
  payrollId: PayrollId
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  status: ApprovalStatus
  comments?: string
  rejectionReason?: string
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// ===== 급여 템플릿 관련 타입 =====
export interface SalaryTemplate {
  id: string
  name: string
  description: string
  baseSalary: number
  defaultAllowances: Allowance[]
  defaultDeductions: Deduction[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

// ===== 급여 설정 관련 타입 =====
export interface SalarySettings {
  id: string
  companyId: string
  payDay: number // 급여 지급일 (매월 N일)
  overtimeRate: number // 초과근무 수당 비율
  holidayRate: number // 휴일 수당 비율
  nightShiftRate: number // 야간 수당 비율
  weekendRate: number // 주말 수당 비율
  taxSettings: TaxSettings
  deductionSettings: DeductionSettings
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TaxSettings {
  incomeTaxRate: number // 소득세율
  localTaxRate: number // 지방소득세율
  nationalPensionRate: number // 국민연금율
  healthInsuranceRate: number // 건강보험율
  employmentInsuranceRate: number // 고용보험율
  longTermCareRate: number // 장기요양보험율
}

export interface DeductionSettings {
  mealDeductionLimit: number // 식대 공제 한도
  transportDeductionLimit: number // 교통비 공제 한도
  otherDeductionLimit: number // 기타 공제 한도
}

// ===== API 응답 관련 타입 =====
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ===== 급여 보고서 관련 타입 =====
export interface SalaryReport {
  id: string
  name: string
  type: ReportType
  period: string
  parameters: ReportParameters
  generatedAt: string
  generatedBy: string
  filePath?: string
  status: ReportStatus
}

export type ReportType =
  | 'monthly_summary' // 월별 급여 요약
  | 'department_breakdown' // 부서별 급여 분석
  | 'salary_history' // 급여 이력
  | 'tax_summary' // 세금 요약
  | 'custom' // 사용자 정의

export interface ReportParameters {
  department?: string
  position?: string
  employeeIds?: EmployeeId[]
  dateFrom?: string
  dateTo?: string
  includeInactive?: boolean
}

export type ReportStatus = 'generating' | 'completed' | 'failed' | 'cancelled'
