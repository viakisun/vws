/**
 * 이름 처리 검증 및 강제 유틸리티
 *
 * 이 모듈은 이름 처리가 표준 방식으로 이루어지도록 강제하는 도구들을 제공합니다.
 */

import { formatEmployeeName } from './format'
import { formatKoreanNameStandard } from './korean-name'
import { logger } from '$lib/utils/logger'

/**
 * 이름 표시를 위한 타입 가드
 * 모든 이름 표시는 이 타입을 사용해야 합니다.
 */
export type StandardizedName = string & {
  readonly __brand: 'StandardizedName'
}

/**
 * 직원 객체에서 표준화된 이름을 생성
 */
export function createStandardEmployeeName(employee: {
  last_name?: string
  first_name?: string
}): StandardizedName {
  return formatEmployeeName(employee) as StandardizedName
}

/**
 * 전체 이름에서 표준화된 이름을 생성
 */
export function createStandardFullName(fullName: string): StandardizedName {
  return formatKoreanNameStandard(fullName) as StandardizedName
}

/**
 * 이름이 표준 형식인지 검증
 */
export function isValidStandardName(name: string): name is StandardizedName {
  // 한국 이름인 경우 (성)(이름) 형식이고 공백이 없어야 함
  const koreanRegex = /^[가-힣]+$/
  if (koreanRegex.test(name)) {
    return name.length >= 2 && !name.includes(' ')
  }

  // 영문 이름인 경우 그대로 허용
  return name.length > 0
}

/**
 * 이름 표시 강제 함수 (개발 모드에서만 동작)
 */
export function enforceStandardName(name: string, context: string = '이름'): StandardizedName {
  if (process.env.NODE_ENV === 'development') {
    if (!isValidStandardName(name)) {
      logger.warn(`⚠️ [이름 표시 강제] ${context}에서 비표준 형식 발견: "${name}"`)
      logger.warn('표준 형식으로 변환 중...')
    }
  }

  return formatKoreanNameStandard(name) as StandardizedName
}

/**
 * 런타임 검증을 위한 데코레이터 함수
 */
export function withNameValidation<T extends (...args: unknown[]) => any>(
  fn: T,
  context: string = '함수',
): T {
  return ((...args: unknown[]) => {
    const result = fn(...args)

    if (process.env.NODE_ENV === 'development') {
      // 결과가 문자열인 경우 이름 형식 검증
      if (typeof result === 'string' && result.length > 0) {
        // 한국 이름 패턴이 있는지 확인
        const koreanRegex = /[가-힣]/
        if (koreanRegex.test(result) && result.includes(' ')) {
          logger.warn(`⚠️ [이름 검증] ${context}에서 비표준 형식 반환: "${result}"`)
          logger.warn('표준 형식: (성)(이름) - 공백 없음')
        }
      }
    }

    return result
  }) as T
}

/**
 * 이름 처리 표준 가이드라인
 */
export const NAME_STANDARDS = {
  /**
   * 한국 이름 표준 형식: (성)(이름) - 공백 없음
   * 예: "차지은", "이지후", "김성호"
   */
  KOREAN_FORMAT: '(성)(이름) - 공백 없음',

  /**
   * 영문 이름 표준 형식: (First) (Last) - 공백 있음
   * 예: "John Doe", "Jane Smith"
   */
  ENGLISH_FORMAT: '(First) (Last) - 공백 있음',

  /**
   * 사용 금지 패턴들
   */
  FORBIDDEN_PATTERNS: [
    'first_name + " " + last_name', // 직접 문자열 결합
    'last_name + " " + first_name', // 직접 문자열 결합
    '`${first} ${last}`', // 템플릿 리터럴 직접 사용
    'employee.name', // 원시 필드 직접 사용
  ],

  /**
   * 권장 패턴들
   */
  RECOMMENDED_PATTERNS: [
    'formatEmployeeName(employee)', // 직원 객체용
    'formatKoreanNameStandard(fullName)', // 전체 이름용
    'createStandardEmployeeName(employee)', // 타입 안전한 직원 이름
    'createStandardFullName(fullName)', // 타입 안전한 전체 이름
  ],
} as const
