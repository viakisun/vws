/**
 * 이름 처리 유틸리티 함수들
 */

/**
 * 직원 이름을 표준 형식으로 조합합니다.
 * @param lastName 성
 * @param firstName 이름
 * @returns 조합된 이름 (예: "홍길동")
 */
export function formatEmployeeName(lastName: string, firstName: string): string {
  if (!lastName || !firstName) {
    return ''
  }
  return `${lastName}${firstName}`
}

/**
 * 한국어 이름을 표준 형식으로 조합합니다.
 * @param lastName 성
 * @param firstName 이름
 * @returns 조합된 이름 (예: "홍길동")
 */
export function formatKoreanNameStandard(lastName: string, firstName: string): string {
  return formatEmployeeName(lastName, firstName)
}

/**
 * 이름을 성과 이름으로 분리합니다.
 * @param fullName 전체 이름
 * @returns {lastName: string, firstName: string}
 */
export function splitKoreanName(fullName: string): { lastName: string; firstName: string } {
  if (!fullName || fullName.length < 2) {
    return { lastName: '', firstName: '' }
  }

  // 한국어 이름은 보통 성이 1글자, 이름이 1-2글자
  if (fullName.length === 2) {
    return { lastName: fullName[0], firstName: fullName[1] }
  } else if (fullName.length === 3) {
    return { lastName: fullName[0], firstName: fullName.slice(1) }
  } else {
    // 4글자 이상인 경우 첫 글자를 성으로, 나머지를 이름으로
    return { lastName: fullName[0], firstName: fullName.slice(1) }
  }
}
