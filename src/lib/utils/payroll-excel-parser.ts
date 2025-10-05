import * as XLSX from 'xlsx'
import { logger } from './logger'

export interface PayrollData {
  employee_id: string
  employee_name: string
  hire_date: string
  position: string
  department?: string
  basic_salary: number
  meal_allowance: number
  vehicle_allowance: number
  other_allowance: number
  research_allowance: number
  total_payments: number
  national_pension: number
  health_insurance: number
  employment_insurance: number
  long_term_care_insurance: number
  income_tax: number
  local_income_tax: number
  total_deductions: number
  net_salary: number
}

export interface ParsedPayrollData {
  period: string // YYYY-MM
  year: number
  month: number
  employees: PayrollData[]
  total_employees: number
  total_payments: number
  total_deductions: number
  total_net_salary: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Constants for Excel parsing
const EXCEL_CONFIG = {
  ROWS_PER_EMPLOYEE: 3,
  DEFAULT_DATA_START_ROW: 8,
  MAX_HEADER_SEARCH_ROWS: 10,
  CALCULATION_TOLERANCE: 1, // Tolerance for floating point comparison
} as const

// Column indices for row data (0-indexed)
const COLUMN_INDEX = {
  EMPLOYEE_ID: 0, // A
  EMPLOYEE_NAME: 1, // B
  BASIC_SALARY: 2, // C
  MEAL_ALLOWANCE: 3, // D
  VEHICLE_ALLOWANCE: 4, // E
  OTHER_ALLOWANCE: 5, // F
  RESEARCH_ALLOWANCE: 6, // G
  TOTAL_PAYMENTS: 8, // I (row 3)
  NATIONAL_PENSION: 9, // J
  HEALTH_INSURANCE: 10, // K
  EMPLOYMENT_INSURANCE: 11, // L
  LONG_TERM_CARE: 12, // M
  INCOME_TAX: 13, // N
  LOCAL_INCOME_TAX: 14, // O
} as const

type ExcelRow = any[]
type ExcelData = ExcelRow[]

export class PayrollExcelParser {
  /**
   * Parse Excel file and extract payroll data
   * @param file - Excel file to parse
   * @returns Parsed payroll data with period, employees, and totals
   * @throws Error if parsing fails
   */
  static async parsePayrollExcel(file: File): Promise<ParsedPayrollData> {
    try {
      const excelData = await this.loadExcelFile(file)
      logger.log('Excel data loaded:', excelData.length, 'rows')

      const period = this.extractPeriod(excelData)
      const dataStartRow = this.findDataStartRow(excelData)
      const employees = this.extractEmployeeData(excelData, dataStartRow)
      const totals = this.calculateTotals(employees)

      return {
        period,
        year: this.extractYear(period),
        month: this.extractMonth(period),
        employees,
        ...totals,
      }
    } catch (error) {
      logger.error('Error parsing payroll excel:', error)
      throw new Error('급여대장 엑셀 파일을 파싱하는 중 오류가 발생했습니다.')
    }
  }

  /**
   * Load and convert Excel file to array format
   */
  private static async loadExcelFile(file: File): Promise<ExcelData> {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    return XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as ExcelData
  }

  /**
   * Extract year from period string (YYYY-MM format)
   */
  private static extractYear(period: string): number {
    return parseInt(period.split('-')[0])
  }

  /**
   * Extract month from period string (YYYY-MM format)
   */
  private static extractMonth(period: string): number {
    return parseInt(period.split('-')[1])
  }

  /**
   * Calculate aggregate totals from employee data
   */
  private static calculateTotals(employees: PayrollData[]) {
    return {
      total_employees: employees.length,
      total_payments: employees.reduce((sum, emp) => sum + emp.total_payments, 0),
      total_deductions: employees.reduce((sum, emp) => sum + emp.total_deductions, 0),
      total_net_salary: employees.reduce((sum, emp) => sum + emp.net_salary, 0),
    }
  }

  /**
   * Extract period information from title (e.g., "2025년 09월분 급여대장" -> "2025-09")
   */
  private static extractPeriod(data: ExcelData): string {
    const periodPattern = /(\d{4})년\s*(\d{1,2})월분/

    for (let row = 0; row < Math.min(EXCEL_CONFIG.MAX_HEADER_SEARCH_ROWS, data.length); row++) {
      const cell = String(data[row][0] || '')
      if (cell.includes('년') && cell.includes('월분')) {
        const match = cell.match(periodPattern)
        if (match) {
          const year = match[1]
          const month = match[2].padStart(2, '0')
          return `${year}-${month}`
        }
      }
    }

    // 임시로 2025년 9월로 고정
    return '2025-09'
  }

  /**
   * Get current period as fallback (YYYY-MM format)
   */
  private static getCurrentPeriod(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    return `${year}-${month}`
  }

  /**
   * Find the row where employee data starts (row after header)
   */
  private static findDataStartRow(data: ExcelData): number {
    for (let row = 0; row < data.length; row++) {
      const cell = String(data[row][0])
      if (cell === '1' || cell === '1') {
        return row
      }
    }
    return EXCEL_CONFIG.DEFAULT_DATA_START_ROW
  }

  /**
   * Extract all employee data (processes 3 rows per employee)
   */
  private static extractEmployeeData(data: ExcelData, startRow: number): PayrollData[] {
    const employees: PayrollData[] = []

    for (let row = startRow; row < data.length; row += EXCEL_CONFIG.ROWS_PER_EMPLOYEE) {
      try {
        const employee = this.parseEmployeeRow(data, row)
        if (this.isValidEmployee(employee)) {
          employees.push(employee)
        }
      } catch (error) {
        logger.warn(`Error parsing employee at row ${row}:`, error)
        continue
      }
    }

    return employees
  }

  /**
   * Check if employee data is valid (has required fields)
   */
  private static isValidEmployee(employee: PayrollData | null): employee is PayrollData {
    return employee !== null && Boolean(employee.employee_id) && Boolean(employee.employee_name)
  }

  /**
   * Parse individual employee data from 3 rows
   * Row 1: Employee ID, Name, Basic salary, Allowances
   * Row 2: Hire date, Position
   * Row 3: Total payments, Total deductions
   */
  private static parseEmployeeRow(data: ExcelData, startRow: number): PayrollData | null {
    if (!this.hasEnoughRows(data, startRow)) {
      return null
    }

    const rows = this.extractEmployeeRows(data, startRow)
    const basicInfo = this.parseBasicInfo(rows)

    if (!basicInfo) {
      return null
    }

    const payments = this.parsePayments(rows)
    const deductions = this.parseDeductions(rows)
    const totals = this.calculateEmployeeTotals(payments, deductions)

    return {
      ...basicInfo,
      ...payments,
      ...deductions,
      ...totals,
    }
  }

  /**
   * Check if there are enough rows for an employee record
   */
  private static hasEnoughRows(data: ExcelData, startRow: number): boolean {
    return startRow + EXCEL_CONFIG.ROWS_PER_EMPLOYEE <= data.length
  }

  /**
   * Extract 3 rows for a single employee
   */
  private static extractEmployeeRows(
    data: ExcelData,
    startRow: number,
  ): [ExcelRow, ExcelRow, ExcelRow] {
    return [data[startRow] || [], data[startRow + 1] || [], data[startRow + 2] || []]
  }

  /**
   * Parse basic employee information (ID, name, hire date, position)
   */
  private static parseBasicInfo(rows: [ExcelRow, ExcelRow, ExcelRow]) {
    const [row1, row2] = rows

    const employee_id = String(row1[COLUMN_INDEX.EMPLOYEE_ID] || '').trim()
    const employee_name = String(row1[COLUMN_INDEX.EMPLOYEE_NAME] || '').trim()

    if (!employee_id || !employee_name) {
      return null
    }

    return {
      employee_id,
      employee_name,
      hire_date: this.parseDate(String(row2[COLUMN_INDEX.EMPLOYEE_ID] || '')),
      position: String(row2[COLUMN_INDEX.EMPLOYEE_NAME] || '').trim() || '사원',
      department: undefined as string | undefined,
    }
  }

  /**
   * Parse payment details (salary and allowances)
   */
  private static parsePayments(rows: [ExcelRow, ExcelRow, ExcelRow]) {
    const [row1, , row3] = rows

    return {
      basic_salary: this.parseNumber(row1[COLUMN_INDEX.BASIC_SALARY]),
      meal_allowance: this.parseNumber(row1[COLUMN_INDEX.MEAL_ALLOWANCE]),
      vehicle_allowance: this.parseNumber(row1[COLUMN_INDEX.VEHICLE_ALLOWANCE]),
      other_allowance: this.parseNumber(row1[COLUMN_INDEX.OTHER_ALLOWANCE]),
      research_allowance: this.parseNumber(row1[COLUMN_INDEX.RESEARCH_ALLOWANCE]),
      total_payments: this.parseNumber(row3[COLUMN_INDEX.TOTAL_PAYMENTS]),
    }
  }

  /**
   * Parse deduction details (taxes and insurance)
   */
  private static parseDeductions(rows: [ExcelRow, ExcelRow, ExcelRow]) {
    const [row1] = rows

    return {
      national_pension: this.parseNumber(row1[COLUMN_INDEX.NATIONAL_PENSION]),
      health_insurance: this.parseNumber(row1[COLUMN_INDEX.HEALTH_INSURANCE]),
      employment_insurance: this.parseNumber(row1[COLUMN_INDEX.EMPLOYMENT_INSURANCE]),
      long_term_care_insurance: this.parseNumber(row1[COLUMN_INDEX.LONG_TERM_CARE]),
      income_tax: this.parseNumber(row1[COLUMN_INDEX.INCOME_TAX]),
      local_income_tax: this.parseNumber(row1[COLUMN_INDEX.LOCAL_INCOME_TAX]),
    }
  }

  /**
   * Calculate employee totals (total deductions and net salary)
   */
  private static calculateEmployeeTotals(
    payments: ReturnType<typeof this.parsePayments>,
    deductions: ReturnType<typeof this.parseDeductions>,
  ) {
    const total_deductions =
      deductions.national_pension +
      deductions.health_insurance +
      deductions.employment_insurance +
      deductions.long_term_care_insurance +
      deductions.income_tax +
      deductions.local_income_tax

    const net_salary = payments.total_payments - total_deductions

    return {
      total_deductions,
      net_salary,
    }
  }

  /**
   * Parse numeric value (removes thousand separators)
   */
  private static parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0

    const str = String(value).replace(/,/g, '').trim()
    const num = parseFloat(str)
    return isNaN(num) ? 0 : num
  }

  /**
   * Parse date value (handles multiple formats including Excel serial dates)
   */
  private static parseDate(value: any): string {
    if (!value) return ''

    const str = String(value).trim()

    // YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str
    }

    // Excel serial date (numeric value)
    if (!isNaN(Number(str))) {
      const excelDate = Number(str)
      const date = new Date((excelDate - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0]
    }

    return str
  }

  /**
   * Validate parsed payroll data for consistency and completeness
   */
  static validateParsedData(data: ParsedPayrollData): ValidationResult {
    const errors: string[] = []

    // Validate period format
    if (!data.period || !/^\d{4}-\d{2}$/.test(data.period)) {
      errors.push('유효하지 않은 기간 형식입니다.')
    }

    // Validate employee count
    if (data.employees.length === 0) {
      errors.push('직원 데이터가 없습니다.')
    }

    // Validate each employee record
    for (let i = 0; i < data.employees.length; i++) {
      const emp = data.employees[i]
      this.validateEmployee(emp, i, errors)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate individual employee data
   */
  private static validateEmployee(emp: PayrollData, index: number, errors: string[]): void {
    // Validate required fields
    if (!emp.employee_id) {
      errors.push(`${index + 1}번째 직원의 사원번호가 없습니다.`)
    }

    if (!emp.employee_name) {
      errors.push(`${index + 1}번째 직원의 이름이 없습니다.`)
    }

    if (emp.basic_salary <= 0) {
      errors.push(`${emp.employee_name}의 기본급이 0원입니다.`)
    }

    // Validate calculations
    this.validateCalculations(emp, errors)
  }

  /**
   * Validate payment and deduction calculations for an employee
   */
  private static validateCalculations(emp: PayrollData, errors: string[]): void {
    const expectedTotal =
      emp.basic_salary +
      emp.meal_allowance +
      emp.vehicle_allowance +
      emp.other_allowance +
      emp.research_allowance

    const expectedDeductions =
      emp.national_pension +
      emp.health_insurance +
      emp.employment_insurance +
      emp.long_term_care_insurance +
      emp.income_tax +
      emp.local_income_tax

    const expectedNet = expectedTotal - expectedDeductions

    // Use tolerance for floating point comparison
    const tolerance = EXCEL_CONFIG.CALCULATION_TOLERANCE

    if (Math.abs(emp.total_payments - expectedTotal) > tolerance) {
      errors.push(`${emp.employee_name}의 지급합계 계산이 맞지 않습니다.`)
    }

    if (Math.abs(emp.total_deductions - expectedDeductions) > tolerance) {
      errors.push(`${emp.employee_name}의 공제합계 계산이 맞지 않습니다.`)
    }

    if (Math.abs(emp.net_salary - expectedNet) > tolerance) {
      errors.push(`${emp.employee_name}의 차인지급액 계산이 맞지 않습니다.`)
    }
  }
}
