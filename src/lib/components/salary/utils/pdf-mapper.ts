import type { Employee, PayslipData, PayslipPDFData } from '../types'

/**
 * Converts a PayslipData to PayslipPDFData format for PDF generation
 */
export function mapPayslipToPDFData(
  monthData: PayslipData,
  employee: Employee,
  year: number,
  companyName: string,
  ceoName: string,
): PayslipPDFData | null {
  if (!monthData.payslip) return null

  const payslip = monthData.payslip

  const allPayments = (payslip.payments || []).map((p) => ({
    name: p.name || '',
    amount: Number(p.amount) || 0,
  }))

  const deductions = (payslip.deductions || []).map((d) => ({
    name: d.name || '',
    amount: Number(d.amount) || 0,
  }))

  return {
    employeeName: employee.name || '',
    employeeId: employee.employeeId || '',
    department: employee.department || '',
    position: employee.position || '',
    year: year,
    month: monthData.month || 1,
    paymentDate: payslip.payDate || monthData.period || '',
    payments: allPayments,
    deductions: deductions,
    totalPayments: payslip.totalPayments || 0,
    totalDeductions: payslip.totalDeductions || 0,
    netSalary: payslip.netSalary || 0,
    companyName: companyName,
    ceoName: ceoName,
  }
}
