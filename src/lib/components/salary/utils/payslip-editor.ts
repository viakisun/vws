import type { Allowance, Deduction, EmployeeContract, PayslipData } from '../types'
import { createDefaultAllowances, createDefaultDeductions } from '../constants'

/**
 * Parses JSON string or returns array as-is
 */
function parseJSONField<T>(field: string | T[]): T[] {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field)
    } catch {
      return []
    }
  }
  return field || []
}

/**
 * Maps saved payments to allowances structure
 */
export function mapPaymentsToAllowances(
  payments: Allowance[],
  baseSalary: number | undefined,
  employeeContract: EmployeeContract | null,
): Allowance[] {
  const allowances = createDefaultAllowances(employeeContract)

  // Update basic salary if provided
  if (baseSalary) {
    const basicSalaryIndex = allowances.findIndex((a) => a.id === 'basic_salary')
    if (basicSalaryIndex !== -1) {
      allowances[basicSalaryIndex].amount = Number(baseSalary)
    }
  }

  // Map saved payments to allowances
  if (Array.isArray(payments) && payments.length > 0) {
    payments.forEach((payment) => {
      let allowanceIndex = allowances.findIndex((a) => a.id === payment.id)
      if (allowanceIndex === -1) {
        allowanceIndex = allowances.findIndex((a) => a.name === payment.name)
      }
      if (allowanceIndex !== -1) {
        allowances[allowanceIndex].amount = Number(payment.amount || 0)
      }
    })
  }

  return allowances
}

/**
 * Maps saved deductions to deductions structure
 */
export function mapDeductionsToDeductions(deductions: Deduction[]): Deduction[] {
  const defaultDeductions = createDefaultDeductions()

  if (Array.isArray(deductions) && deductions.length > 0) {
    deductions.forEach((deduction) => {
      let deductionIndex = defaultDeductions.findIndex((d) => d.id === deduction.id)
      if (deductionIndex === -1) {
        deductionIndex = defaultDeductions.findIndex((d) => d.name === deduction.name)
      }
      if (deductionIndex !== -1) {
        defaultDeductions[deductionIndex].amount = Number(deduction.amount || 0)
      }
    })
  }

  return defaultDeductions
}

/**
 * Creates an editable payslip from existing data
 */
export function createEditablePayslip(
  payslip: PayslipData['payslip'] & { baseSalary?: number },
  employeeContract: EmployeeContract | null,
): PayslipData {
  const paymentsArray = parseJSONField<Allowance>(payslip.payments || [])
  const deductionsArray = parseJSONField<Deduction>(payslip.deductions || [])

  const allowances = mapPaymentsToAllowances(paymentsArray, payslip.baseSalary, employeeContract)
  const deductions = mapDeductionsToDeductions(deductionsArray)

  return {
    ...payslip,
    allowances,
    deductions,
  }
}

/**
 * Creates a new empty payslip for a given period
 */
export function createNewPayslip(
  year: number,
  month: number,
  employeeContract: EmployeeContract | null,
): PayslipData {
  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    allowances: createDefaultAllowances(employeeContract),
    deductions: createDefaultDeductions(),
    totalPayments: 0,
    totalDeductions: 0,
    netSalary: 0,
  }
}
