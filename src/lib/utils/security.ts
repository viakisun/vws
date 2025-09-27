/**
 * 보안 유틸리티 함수들
 * XSS, SQL Injection, CSRF 등 보안 위협 방지
 */

import { logger } from './logger'

/**
 * XSS 방지를 위한 HTML 이스케이프
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * SQL Injection 방지를 위한 입력 검증
 */
export function sanitizeSqlInput(input: string): string {
  // 기본적인 SQL 키워드 제거
  const dangerousKeywords = [
    'DROP',
    'DELETE',
    'INSERT',
    'UPDATE',
    'ALTER',
    'CREATE',
    'EXEC',
    'EXECUTE',
    'UNION',
    'SELECT',
    'SCRIPT',
  ]

  let sanitized = input
  dangerousKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    sanitized = sanitized.replace(regex, '')
  })

  // 특수 문자 제거
  sanitized = sanitized.replace(/[;'"]/g, '')

  return sanitized.trim()
}

/**
 * 이메일 형식 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
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

  if (!/\d/.test(password)) {
    feedback.push('숫자를 포함해야 합니다.')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
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
 * 파일 업로드 검증
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[],
  maxSize: number,
): {
  isValid: boolean
  error?: string
} {
  // 파일 크기 검증
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `파일 크기는 ${Math.round(maxSize / 1024 / 1024)}MB를 초과할 수 없습니다.`,
    }
  }

  // 파일 타입 검증
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `허용되지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`,
    }
  }

  return { isValid: true }
}

/**
 * CSRF 토큰 생성
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * CSRF 토큰 검증
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    logger.warn('CSRF token validation failed: missing tokens')
    return false
  }

  const isValid = token === sessionToken
  if (!isValid) {
    logger.warn('CSRF token validation failed: token mismatch')
  }

  return isValid
}

/**
 * IP 주소 검증
 */
export function isValidIP(ip: string): boolean {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

/**
 * 요청 속도 제한 (Rate Limiting)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15분
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  const current = requestCounts.get(key)

  if (!current || now > current.resetTime) {
    // 새로운 윈도우 시작
    requestCounts.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    }
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  // 요청 수 증가
  current.count++
  requestCounts.set(key, current)

  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  }
}

/**
 * 민감한 데이터 마스킹
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length)
  }

  const visible = data.slice(-visibleChars)
  const masked = '*'.repeat(data.length - visibleChars)

  return masked + visible
}

/**
 * 로그에서 민감한 정보 제거
 */
export function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard']
  const sanitized = { ...data }

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    }
  }

  return sanitized
}
