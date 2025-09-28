/**
 * 한국 이름 처리 유틸리티
 *
 * 이 모듈은 한국 이름의 다양한 형식을 표준화하고 처리하는 함수들을 제공합니다.
 *
 * 주요 기능:
 * - 한국 이름 감지 (isKoreanName)
 * - 이름 형식 변환 (processKoreanName, formatKoreanNameStandard)
 * - 성과 이름 분리 (splitKoreanName)
 * - 성+이름 결합 (formatKoreanName)
 *
 * 지원하는 입력 형식:
 * - "지은 차" → "차지은" (이름 성 → 성 이름)
 * - "차 지은" → "차지은" (성 이름 → 성 이름)
 * - "차지은" → "차지은" (이미 표준 형식)
 * - "John Doe" → "John Doe" (영문 이름은 그대로 유지)
 *
 * @example
 * ```typescript
 * import { formatKoreanNameStandard, splitKoreanName } from '$lib/utils/korean-name';
 *
 * // 이름 형식 변환
 * formatKoreanNameStandard("지은 차"); // "차지은"
 *
 * // 성과 이름 분리
 * splitKoreanName("차지은"); // { surname: "차", givenName: "지은" }
 * ```
 */

/**
 * 한국 이름인지 확인하는 함수
 * @param name 이름 문자열
 * @returns 한국 이름 여부
 */
export function isKoreanName(name: string): boolean {
  if (!name || typeof name !== 'string') return false

  // 한글 정규식 (가-힣)
  const koreanRegex = /^[가-힣\s]+$/
  return koreanRegex.test(name.trim())
}

/**
 * 한국 이름을 성+이름(띄어쓰기 없이) 형태로 변환
 * @param firstName 성
 * @param lastName 이름
 * @returns 가공된 한국 이름 또는 원본 이름
 */
export function formatKoreanName(firstName: string, lastName: string): string {
  if (!firstName || !lastName) return ''

  const fullName = `${firstName} ${lastName}`.trim()

  // 한국 이름인 경우에만 성+이름 형태로 변환
  if (isKoreanName(fullName)) {
    return `${firstName}${lastName}`
  }

  // 한국 이름이 아닌 경우 원본 형태 유지
  return fullName
}

/**
 * 전체 이름에서 한국 이름 부분만 가공
 * @param fullName 전체 이름 (예: "지은 차" 또는 "차지은")
 * @returns 가공된 이름 (예: "차지은")
 */
export function processKoreanName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return ''

  const trimmed = fullName.trim()

  // 한국 이름인 경우
  if (isKoreanName(trimmed)) {
    // 공백으로 분리
    const parts = trimmed.split(/\s+/)
    if (parts.length === 2) {
      const [first, second] = parts

      // 일반적으로 성은 1글자, 이름은 2글자 이상
      if (first.length >= 2 && second.length === 1) {
        // "지은 차" -> "차지은" (이름 성 -> 성 이름)
        return `${second}${first}`
      } else if (first.length === 1 && second.length >= 2) {
        // "차 지은" -> "차지은" (이미 올바른 순서)
        return `${first}${second}`
      }

      // 기타 경우는 단순 결합
      return `${first}${second}`
    }
  }

  // 한국 이름이 아니거나 공백이 없는 경우 원본 반환
  return trimmed
}

/**
 * 한국 이름을 성과 이름으로 분리
 * @param fullName 전체 이름 (예: "차지은" 또는 "지은 차")
 * @returns { surname: string, givenName: string }
 */
export function splitKoreanName(fullName: string): {
  surname: string
  givenName: string
} {
  if (!fullName || typeof fullName !== 'string') return { surname: '', givenName: '' }

  const trimmed = fullName.trim()

  // 한국 이름인지 확인
  if (isKoreanName(trimmed)) {
    // 공백으로 분리된 경우 (예: "지은 차")
    const parts = trimmed.split(/\s+/)
    if (parts.length === 2) {
      const [first, second] = parts

      // 일반적으로 성은 1글자, 이름은 2글자 이상
      if (first.length >= 2 && second.length === 1) {
        // "지은 차" -> surname: "차", givenName: "지은"
        return { surname: second, givenName: first }
      } else if (first.length === 1 && second.length >= 2) {
        // "차 지은" -> surname: "차", givenName: "지은"
        return { surname: first, givenName: second }
      }
    }

    // 공백이 없는 경우 (예: "차지은")
    if (trimmed.length >= 2) {
      // 첫 글자를 성으로, 나머지를 이름으로 분리
      return {
        surname: trimmed.charAt(0),
        givenName: trimmed.slice(1),
      }
    }
  }

  // 영문 이름인 경우 공백으로 분리
  const parts = trimmed.split(' ')
  if (parts.length >= 2) {
    return {
      surname: parts[0],
      givenName: parts.slice(1).join(' '),
    }
  }

  // 분리할 수 없는 경우 전체를 이름으로
  return {
    surname: '',
    givenName: trimmed,
  }
}

/**
 * 한국 이름을 표준 형식으로 포맷팅 (성+이름, 띄어쓰기 없음)
 * @param fullName 전체 이름 (다양한 형식 지원)
 * @returns 표준 형식의 한국 이름
 */
export function formatKoreanNameStandard(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return ''

  const trimmed = fullName.trim()

  // 이미 표준 형식인 경우 (띄어쓰기 없음)
  if (!trimmed.includes(' ')) {
    return trimmed
  }

  // 한국 이름인 경우 표준 형식으로 변환
  if (isKoreanName(trimmed)) {
    const { surname, givenName } = splitKoreanName(trimmed)
    return `${surname}${givenName}`
  }

  // 한국 이름이 아닌 경우 원본 반환
  return trimmed
}

/**
 * 한국 이름을 "성 이름" 형식으로 포맷팅 (띄어쓰기 있음)
 * @param fullName 전체 이름 (다양한 형식 지원)
 * @returns "성 이름" 형식의 한국 이름
 */
export function formatKoreanNameWithSpace(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return ''

  const trimmed = fullName.trim()

  // 한국 이름인 경우 "성 이름" 형식으로 변환
  if (isKoreanName(trimmed)) {
    const { surname, givenName } = splitKoreanName(trimmed)
    return `${surname} ${givenName}`
  }

  // 한국 이름이 아닌 경우 원본 반환
  return trimmed
}

/**
 * 한국 이름 정렬 함수
 * @param a 첫 번째 이름
 * @param b 두 번째 이름
 * @returns 정렬 순서 (-1, 0, 1)
 */
export function sortKoreanNames(a: string, b: string): number {
  if (!a || !b) return 0

  const { surname: surnameA, givenName: givenNameA } = splitKoreanName(a)
  const { surname: surnameB, givenName: givenNameB } = splitKoreanName(b)

  // 성으로 먼저 비교
  const surnameCompare = surnameA.localeCompare(surnameB, 'ko-KR')
  if (surnameCompare !== 0) return surnameCompare

  // 성이 같으면 이름으로 비교
  return givenNameA.localeCompare(givenNameB, 'ko-KR')
}
