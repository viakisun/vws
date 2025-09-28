// 필드명 규칙 강제를 위한 타입 정의

// 프론트엔드에서 사용할 camelCase 필드명 타입
export type CamelCaseFields = {
  // 급여 계약 관련
  monthlySalary: number
  annualSalary: number
  startDate: string
  endDate?: string
  contractType: string
  contractEndDisplay?: string
  statusDisplay?: string

  // 직원 관련
  employeeId: string
  employeeName: string
  employeeIdNumber: string
  department: string
  position: string

  // 공통
  id: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
}

// 서버사이드에서 사용할 snake_case 필드명 타입
export type SnakeCaseFields = {
  // 급여 계약 관련
  monthly_salary: string | number
  annual_salary: string | number
  start_date: string
  end_date: string | null
  contract_type: string
  contract_end_display: string
  status_display: string

  // 직원 관련
  employee_id: string
  employee_name: string
  employee_id_number: string
  department: string
  position: string

  // 공통
  id: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

// 필드명 변환 유틸리티 타입
export type ToCamelCase<T extends string> = T extends `${infer P1}_${infer P2}`
  ? `${P1}${Capitalize<ToCamelCase<P2>>}`
  : T

export type ToSnakeCase<T extends string> = T extends `${infer P1}${infer P2}`
  ? P2 extends Capitalize<P2>
    ? `${P1}_${ToSnakeCase<Uncapitalize<P2>>}`
    : T
  : T

// 필드명 검증 함수들
export function validateCamelCaseField(fieldName: string): boolean {
  return /^[a-z]+([A-Z][a-z]*)*$/.test(fieldName)
}

export function validateSnakeCaseField(fieldName: string): boolean {
  return /^[a-z]+(_[a-z]+)*$/.test(fieldName)
}

// 필드명 변환 함수들
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

// 필드명 규칙 위반 시 에러를 던지는 함수
export function enforceCamelCase(obj: Record<string, any>, context: string = 'Object'): void {
  for (const key of Object.keys(obj)) {
    if (key.includes('_') && !validateCamelCaseField(key)) {
      throw new Error(
        `${context}에서 snake_case 필드명 '${key}' 사용 금지. camelCase로 변경하세요.`,
      )
    }
  }
}

export function enforceSnakeCase(obj: Record<string, any>, context: string = 'Object'): void {
  for (const key of Object.keys(obj)) {
    if (/[A-Z]/.test(key) && !validateSnakeCaseField(key)) {
      throw new Error(
        `${context}에서 camelCase 필드명 '${key}' 사용 금지. snake_case로 변경하세요.`,
      )
    }
  }
}
