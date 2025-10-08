/**
 * 급여 관리 관련 유틸리티 함수
 * @module salary/utils
 */

export {
  calculateTotals,
  validateSalaryAmount,
  getSalaryValidationMessage,
  type ValidationResult,
} from './payslip-calculator'

export { isWithinContractPeriod } from './contract-validator'

export {
  getContractPeriodMissingPayslips,
  getMissingPayslipCount,
  type MissingPeriod,
} from './missing-payslip'

export { createEditablePayslip, createNewPayslip } from './payslip-editor'

export { mapPayslipToPDFData } from './pdf-mapper'

export {
  getCellDisplayValue,
  getRowClasses,
  getCellTextClasses,
  getStatusBadge,
  getActionButton,
} from './table-helpers'
