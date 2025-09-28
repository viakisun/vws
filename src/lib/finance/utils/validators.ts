// 자금일보 시스템 검증 유틸리티

/**
 * 이메일 주소 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 전화번호 검증
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const phoneRegex = /^[0-9]{10,11}$/
  return phoneRegex.test(phoneNumber.replace(/\D/g, ''))
}

/**
 * 계좌번호 검증
 */
export function isValidAccountNumber(accountNumber: string): boolean {
  const cleanNumber = accountNumber.replace(/\D/g, '')
  return cleanNumber.length >= 10 && cleanNumber.length <= 20
}

/**
 * 금액 검증
 */
export function isValidAmount(amount: number | string): boolean {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return !isNaN(numAmount) && numAmount >= 0 && numAmount <= 999999999999999 // 999조
}

/**
 * 날짜 검증
 */
export function isValidDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return !isNaN(d.getTime())
}

/**
 * 미래 날짜 검증
 */
export function isFutureDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d > new Date()
}

/**
 * 과거 날짜 검증
 */
export function isPastDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d < new Date()
}

/**
 * 날짜 범위 검증
 */
export function isDateInRange(
  date: string | Date,
  startDate: string | Date,
  endDate: string | Date,
): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  return d >= start && d <= end
}

/**
 * 비밀번호 강도 검증
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push('비밀번호는 최소 8자 이상이어야 합니다.')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('소문자를 포함해야 합니다.')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('대문자를 포함해야 합니다.')
  } else {
    score += 1
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('숫자를 포함해야 합니다.')
  } else {
    score += 1
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('특수문자를 포함해야 합니다.')
  } else {
    score += 1
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  }
}

/**
 * 파일 크기 검증
 */
export function isValidFileSize(fileSize: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return fileSize <= maxSize
}

/**
 * 파일 확장자 검증
 */
export function isValidFileExtension(fileName: string, allowedExtensions: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? allowedExtensions.includes(extension) : false
}

/**
 * 거래 금액 범위 검증
 */
export function isValidTransactionAmount(
  amount: number,
  type: 'income' | 'expense' | 'transfer' | 'adjustment',
): boolean {
  if (!isValidAmount(amount)) return false

  // 조정 거래는 음수 허용
  if (type === 'adjustment') return true

  // 수입, 지출, 이체는 양수만 허용
  return amount > 0
}

/**
 * 계좌 잔액 검증
 */
export function isValidAccountBalance(balance: number): boolean {
  return isValidAmount(balance) && balance >= 0
}

/**
 * 예산 금액 검증
 */
export function isValidBudgetAmount(amount: number): boolean {
  return isValidAmount(amount) && amount > 0
}

/**
 * 정기 거래 패턴 검증
 */
export function isValidRecurringPattern(pattern: {
  frequency: string
  interval: number
  endDate?: string
  maxOccurrences?: number
}): boolean {
  const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']

  if (!validFrequencies.includes(pattern.frequency)) return false
  if (pattern.interval < 1) return false
  if (pattern.endDate && !isValidDate(pattern.endDate)) return false
  if (pattern.maxOccurrences && pattern.maxOccurrences < 1) return false

  return true
}

/**
 * 카테고리 이름 검증
 */
export function isValidCategoryName(name: string): boolean {
  return name.trim().length >= 1 && name.trim().length <= 100
}

/**
 * 거래 설명 검증
 */
export function isValidTransactionDescription(description: string): boolean {
  return description.trim().length >= 1 && description.trim().length <= 500
}

/**
 * 계좌 이름 검증
 */
export function isValidAccountName(name: string): boolean {
  return name.trim().length >= 1 && name.trim().length <= 200
}

/**
 * 참조번호 검증
 */
export function isValidReferenceNumber(referenceNumber: string): boolean {
  return referenceNumber.length <= 100
}

/**
 * 태그 검증
 */
export function isValidTags(tags: string[]): boolean {
  return tags.every((tag) => tag.trim().length >= 1 && tag.trim().length <= 50)
}

/**
 * 색상 코드 검증
 */
export function isValidColorCode(color: string): boolean {
  const colorRegex = /^#[0-9A-Fa-f]{6}$/
  return colorRegex.test(color)
}

/**
 * 은행 코드 검증
 */
export function isValidBankCode(code: string): boolean {
  return code.trim().length >= 2 && code.trim().length <= 20
}

/**
 * 은행 이름 검증
 */
export function isValidBankName(name: string): boolean {
  return name.trim().length >= 1 && name.trim().length <= 100
}

/**
 * 전체 폼 검증 결과 타입
 */
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
}

/**
 * 폼 데이터 검증
 */
export function validateFormData(
  data: Record<string, any>,
  rules: Record<string, (value: any) => boolean | string>,
): ValidationResult {
  const errors: Record<string, string[]> = {}
  let isValid = true

  for (const [field, value] of Object.entries(data)) {
    const rule = rules[field]
    if (rule) {
      const result = rule(value)
      if (result !== true) {
        errors[field] = Array.isArray(result) ? result : [String(result)]
        isValid = false
      }
    }
  }

  return { isValid, errors }
}

/**
 * 필수 필드 검증
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[],
): ValidationResult {
  const errors: Record<string, string[]> = {}
  let isValid = true

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors[field] = [`${field}는 필수 항목입니다.`]
      isValid = false
    }
  }

  return { isValid, errors }
}
