/**
 * Formatted Name Type System
 *
 * 이름 포맷팅의 타입 안정성을 보장합니다.
 * Branded Type을 사용하여 포맷되지 않은 이름이 잘못 사용되는 것을 방지합니다.
 */

// ============================================================================
// Branded Type Definitions
// ============================================================================

/**
 * 올바르게 포맷된 이름을 나타내는 Branded Type
 *
 * @example
 * const name: FormattedName = formatKoreanName('박', '기선') // ✅ OK
 * const name: FormattedName = '기선 박' // ❌ Type Error
 */
export type FormattedName = string & { readonly __brand: 'FormattedName' }

/**
 * 이름 포맷 정보를 포함한 Employee 타입
 */
export interface EmployeeWithFormattedName {
  id: string | number
  first_name: string
  last_name: string
  formatted_name: FormattedName
  department?: string
  position?: string
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * 문자열이 올바른 한국 이름 포맷인지 확인
 *
 * ✅ Valid: "박기선", "John Doe"
 * ❌ Invalid: "기선 박" (한국 이름인데 띄어쓰기)
 */
export function isValidKoreanNameFormat(name: string): name is FormattedName {
  if (!name || typeof name !== 'string') return false

  // 한글만 있는 경우
  const isKorean = /^[가-힣]+$/.test(name)
  if (isKorean) {
    // 한국 이름은 띄어쓰기가 없어야 함
    return !name.includes(' ')
  }

  // 영문 이름은 띄어쓰기 허용
  return true
}

/**
 * 런타임에서 FormattedName으로 단언
 * 개발 환경에서는 경고를 출력합니다.
 */
export function assertFormattedName(name: string): FormattedName {
  if (import.meta.env.DEV && !isValidKoreanNameFormat(name)) {
    console.error(
      `[Name Format Error] 잘못된 이름 포맷 감지: "${name}"\n` +
        `한국 이름은 띄어쓰기 없이 "성+이름" 형식이어야 합니다.\n` +
        `올바른 사용법: formatKoreanName(last_name, first_name)`,
    )
  }

  return name as FormattedName
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Employee 객체의 이름이 올바르게 포맷되어 있는지 검증
 */
export function validateEmployeeName(employee: {
  first_name?: string
  last_name?: string
  formatted_name?: string
}): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // formatted_name이 있는지 확인
  if (!employee.formatted_name) {
    warnings.push('formatted_name이 없습니다. formatKoreanName()을 사용하세요.')
  }

  // formatted_name이 올바른 포맷인지 확인
  if (employee.formatted_name && !isValidKoreanNameFormat(employee.formatted_name)) {
    errors.push(
      `잘못된 이름 포맷: "${employee.formatted_name}". ` +
        `formatKoreanName(last_name, first_name)을 사용하세요.`,
    )
  }

  // 한국 이름인데 first_name과 last_name 순서가 잘못된 경우
  if (
    employee.first_name &&
    employee.last_name &&
    /^[가-힣]+$/.test(employee.first_name) &&
    /^[가-힣]+$/.test(employee.last_name)
  ) {
    // first_name이 last_name보다 길면 순서가 잘못되었을 가능성
    if (employee.first_name.length > employee.last_name.length + 1) {
      warnings.push(
        `이름 순서 의심: first_name="${employee.first_name}", last_name="${employee.last_name}". ` +
          `한국 이름은 last_name=성, first_name=이름이어야 합니다.`,
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 개발 환경에서 모든 Employee 배열을 자동 검증
 */
export function validateEmployeeList<T extends { formatted_name?: string }>(
  employees: T[],
  context: string = 'Employee List',
): void {
  if (!import.meta.env.DEV) return

  const invalidEmployees = employees.filter(
    (emp) => emp.formatted_name && !isValidKoreanNameFormat(emp.formatted_name),
  )

  if (invalidEmployees.length > 0) {
    console.group(`[Name Format Warning] ${context}`)
    console.warn(`${invalidEmployees.length}명의 직원 이름이 잘못된 포맷입니다:`)
    invalidEmployees.forEach((emp, i) => {
      console.warn(`${i + 1}. "${emp.formatted_name}"`)
    })
    console.warn('formatKoreanName(last_name, first_name)을 사용하세요.')
    console.groupEnd()
  }
}
