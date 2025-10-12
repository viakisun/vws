/**
 * Active Employees Hook
 * 현직 직원 데이터 중앙 관리 훅
 *
 * 특징:
 * - status='active' 직원만 자동 필터링
 * - 이름 자동 포맷팅 (한국: 성이름, 영문: 이름 성)
 * - 메모리 캐싱으로 중복 요청 방지
 * - Svelte 5 runes 사용
 */

import { validateEmployeeList } from '$lib/types/formatted-name'
import { formatKoreanName } from '$lib/utils/korean-name'
import { logger } from '$lib/utils/logger'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department?: string
  position?: string
  job_title_name?: string
  status: string
  formatted_name?: string
}

interface EmployeeState {
  employees: Employee[]
  loading: boolean
  error: string | null
}

// 모듈 레벨 캐시 (메모리 캐싱)
let cachedEmployees: Employee[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5분

export function useActiveEmployees() {
  const state = $state<EmployeeState>({
    employees: [],
    loading: false,
    error: null,
  })

  /**
   * 현직 직원 목록 로드
   * 캐시가 유효한 경우 캐시 사용
   */
  async function load(forceRefresh = false) {
    // 캐시 확인
    const now = Date.now()
    if (
      !forceRefresh &&
      cachedEmployees &&
      cacheTimestamp &&
      now - cacheTimestamp < CACHE_DURATION
    ) {
      state.employees = cachedEmployees
      return
    }

    try {
      state.loading = true
      state.error = null

      // status=active 직원만 조회
      const response = await fetch('/api/employees?status=active')

      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`)
      }

      const data = await response.json()
      const rawEmployees: Employee[] = data.employees || data.data || []

      // 이름 포맷팅 적용 (성+이름 순서)
      const formattedEmployees = rawEmployees.map((emp) => ({
        ...emp,
        formatted_name: formatKoreanName(emp.last_name, emp.first_name),
      }))

      // 개발 환경에서 이름 포맷 검증
      validateEmployeeList(formattedEmployees, 'useActiveEmployees')

      // 캐시 업데이트
      cachedEmployees = formattedEmployees
      cacheTimestamp = now
      state.employees = formattedEmployees
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '직원 목록 로드 실패'
      state.error = errorMessage
      logger.error('Error loading active employees:', error)
    } finally {
      state.loading = false
    }
  }

  /**
   * 캐시 초기화
   */
  function clearCache() {
    cachedEmployees = null
    cacheTimestamp = null
  }

  return {
    get employees() {
      return state.employees
    },
    get loading() {
      return state.loading
    },
    get error() {
      return state.error
    },
    load,
    clearCache,
  }
}
