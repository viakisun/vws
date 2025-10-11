/**
 * Employee Validator
 * 개발 환경에서 직원 데이터 사용 패턴 검증
 *
 * 목적:
 * - 직접 fetch 대신 ThemeEmployeeDropdown 사용 권장
 * - 이름 포맷팅 누락 감지
 * - status='active' 필터링 누락 경고
 */

import { logger } from './logger'

/**
 * 직접 직원 API fetch 감지 시 경고
 * 개발 환경에서만 동작
 */
export function warnDirectEmployeeFetch(context: string = 'Unknown') {
  if (import.meta.env.DEV) {
    console.warn(
      `⚠️ [${context}] 직원 데이터를 직접 fetch하고 있습니다.\n\n` +
        '권장 방법:\n' +
        '1. ThemeEmployeeDropdown 컴포넌트 사용:\n' +
        "   import ThemeEmployeeDropdown from '$lib/components/ui/ThemeEmployeeDropdown.svelte'\n" +
        '   <ThemeEmployeeDropdown bind:value={employeeId} />\n\n' +
        '2. useActiveEmployees() 훅 사용:\n' +
        "   import { useActiveEmployees } from '$lib/hooks/employee/useActiveEmployees.svelte'\n" +
        '   const { employees, load } = useActiveEmployees()\n\n' +
        '이유:\n' +
        "- 자동으로 status='active' 필터링\n" +
        '- 이름 자동 포맷팅 (한국: 성이름, 영문: 이름 성)\n' +
        '- 캐싱으로 성능 최적화\n',
    )
  }
}

/**
 * 이름 포맷팅 검증
 * 한국 이름에 띄어쓰기가 있는지 체크
 */
export function validateEmployeeName(name: string, context: string = 'Unknown'): boolean {
  if (!name || typeof name !== 'string') return true

  const trimmed = name.trim()

  // 한국 이름인지 확인
  const koreanRegex = /^[가-힣\s]+$/
  if (koreanRegex.test(trimmed)) {
    // 띄어쓰기가 있는 경우 경고
    if (trimmed.includes(' ')) {
      if (import.meta.env.DEV) {
        console.warn(
          `⚠️ [${context}] 한국 이름에 띄어쓰기가 포함되어 있습니다: "${name}"\n\n` +
            '올바른 형식: "김철수" (띄어쓰기 없음)\n' +
            '잘못된 형식: "김 철수" 또는 "철수 김"\n\n' +
            '해결 방법:\n' +
            '- formatEmployeeName(employee) 함수 사용\n' +
            '- ThemeEmployeeDropdown 컴포넌트 사용 (자동 포맷팅)\n',
        )
      }
      return false
    }
  }

  return true
}

/**
 * 직원 목록에서 status='active' 필터링 확인
 */
export function validateActiveEmployees(
  employees: Array<{ status?: string }>,
  context: string = 'Unknown',
): boolean {
  if (!employees || employees.length === 0) return true

  const nonActiveEmployees = employees.filter((emp) => emp.status !== 'active')

  if (nonActiveEmployees.length > 0) {
    if (import.meta.env.DEV) {
      console.warn(
        `⚠️ [${context}] 직원 목록에 비활성 직원이 포함되어 있습니다.\n\n` +
          `총 직원 수: ${employees.length}\n` +
          `비활성 직원 수: ${nonActiveEmployees.length}\n\n` +
          '해결 방법:\n' +
          '1. API 호출 시: /api/employees?status=active\n' +
          '2. ThemeEmployeeDropdown 사용 (자동 필터링)\n' +
          '3. useActiveEmployees() 훅 사용 (자동 필터링)\n',
      )
    }
    return false
  }

  return true
}

/**
 * 개발 환경에서 fetch 요청 감지 래퍼
 */
export function monitorEmployeeFetch() {
  if (import.meta.env.DEV) {
    const originalFetch = window.fetch

    window.fetch = function (...args) {
      const url = args[0]?.toString() || ''

      // /api/employees 호출 감지
      if (url.includes('/api/employees') && !url.includes('status=active')) {
        logger.warn(`⚠️ /api/employees 호출 시 status=active 필터가 누락되었습니다: ${url}`)
      }

      return originalFetch.apply(this, args)
    } as typeof fetch
  }
}
