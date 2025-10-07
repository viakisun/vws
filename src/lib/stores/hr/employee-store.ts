// 인사 관리 시스템 - 직원 스토어

import type { ApiResponse, Employee, EmployeeSearchFilter, EmployeeStatistics } from '$lib/types/hr'
import { derived, writable } from 'svelte/store'

// ===== 기본 스토어 =====
export const employees = writable<Employee[]>([])
export const selectedEmployee = writable<Employee | null>(null)
export const isLoading = writable<boolean>(false)
export const error = writable<string | null>(null)

// ===== 검색 및 필터 스토어 =====
export const searchFilter = writable<EmployeeSearchFilter>({})
export const currentPage = writable<number>(1)
export const pageSize = writable<number>(20)

// ===== 필터된 직원 목록 =====
export const filteredEmployees = derived([employees, searchFilter], ([$employees, $filter]) => {
  if (!$employees.length) return []

  let filtered = [...$employees]

  // 검색어 필터
  if ($filter.query) {
    const query = $filter.query.toLowerCase()
    filtered = filtered.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.employee_id.toLowerCase().includes(query),
    )
  }

  // 부서 필터
  if ($filter.department) {
    filtered = filtered.filter((emp) => emp.department === $filter.department)
  }

  // 직위 필터
  if ($filter.position) {
    filtered = filtered.filter((emp) => emp.position === $filter.position)
  }

  // 상태 필터
  if ($filter.status) {
    filtered = filtered.filter((emp) => emp.status === $filter.status)
  }

  // 고용 형태 필터
  if ($filter.employmentType) {
    filtered = filtered.filter((emp) => emp.employment_type === $filter.employmentType)
  }

  // 레벨 필터
  if ($filter.level) {
    filtered = filtered.filter((emp) => emp.level === $filter.level)
  }

  // 입사일 필터
  if ($filter.hireDateFrom) {
    filtered = filtered.filter((emp) => emp.hire_date >= $filter.hireDateFrom!)
  }

  if ($filter.hireDateTo) {
    filtered = filtered.filter((emp) => emp.hire_date <= $filter.hireDateTo!)
  }

  return filtered
})

// ===== 페이지네이션된 직원 목록 =====
export const paginatedEmployees = derived(
  [filteredEmployees, currentPage, pageSize],
  ([$filteredEmployees, $currentPage, $pageSize]) => {
    const startIndex = ($currentPage - 1) * $pageSize
    const endIndex = startIndex + $pageSize
    return $filteredEmployees.slice(startIndex, endIndex)
  },
)

// ===== 통계 정보 =====
export const employeeStatistics = derived(employees, ($employees) => {
  const stats: EmployeeStatistics = {
    totalEmployees: $employees.length,
    activeEmployees: $employees.filter((emp) => emp.status === 'active').length,
    byDepartment: {},
    byPosition: {},
    byEmploymentType: {
      'full-time': 0,
      'part-time': 0,
      contract: 0,
      intern: 0,
    },
    byLevel: {
      intern: 0,
      junior: 0,
      mid: 0,
      senior: 0,
      lead: 0,
      manager: 0,
      director: 0,
    },
    recentHires: 0,
    recentTerminations: 0,
    averageTenure: 0,
  }

  // 부서별 통계
  $employees.forEach((emp) => {
    stats.byDepartment[emp.department] = (stats.byDepartment[emp.department] || 0) + 1
    stats.byPosition[emp.position] = (stats.byPosition[emp.position] || 0) + 1
    if (emp.employment_type) {
      stats.byEmploymentType[emp.employment_type]++
    }
    if (emp.level) {
      stats.byLevel[emp.level]++
    }
  })

  // 최근 입사/퇴사 통계
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  stats.recentHires = $employees.filter((emp) => new Date(emp.hire_date) >= thirtyDaysAgo).length

  stats.recentTerminations = $employees.filter(
    (emp) => emp.termination_date && new Date(emp.termination_date) >= thirtyDaysAgo,
  ).length

  // 평균 근속년수
  const activeEmployees = $employees.filter((emp) => emp.status === 'active')
  if (activeEmployees.length > 0) {
    const totalTenure = activeEmployees.reduce((sum, emp) => {
      const hireDate = new Date(emp.hire_date)
      const now = new Date()
      const tenureYears = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      return sum + tenureYears
    }, 0)
    stats.averageTenure = totalTenure / activeEmployees.length
  }

  return stats
})

// ===== 부서 목록 =====
export const departments = derived(employees, ($employees) => {
  const deptSet = new Set($employees.map((emp) => emp.department))
  return Array.from(deptSet).sort()
})

// ===== 직위 목록 =====
export const positions = derived(employees, ($employees) => {
  const posSet = new Set($employees.map((emp) => emp.position))
  return Array.from(posSet).sort()
})

// ===== 팀 리더 목록 =====
export const teamLeaders = derived(employees, ($employees) => {
  const leaderPositions = [
    'CEO',
    'CFO',
    'CTO',
    '대표이사',
    '재무이사',
    '기술이사',
    '연구소장',
    '상무',
  ]
  return $employees.filter((emp) => leaderPositions.includes(emp.position))
})

// ===== 계약직 직원 목록 =====
export const contractEmployees = derived(employees, ($employees) => {
  return $employees.filter((emp) => emp.employment_type === 'contract')
})

// ===== 퇴사 예정자 목록 =====
export const terminationPending = derived(employees, ($employees) => {
  const now = new Date()
  const oneMonthFromNow = new Date()
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

  return $employees.filter(
    (emp) =>
      emp.termination_date &&
      new Date(emp.termination_date) >= now &&
      new Date(emp.termination_date) <= oneMonthFromNow,
  )
})

// ===== 퇴사자 목록 =====
export const terminatedEmployees = derived(employees, ($employees) => {
  return $employees
    .filter((emp) => emp.status === 'terminated')
    .sort((a, b) => {
      if (!a.termination_date || !b.termination_date) return 0
      return new Date(b.termination_date).getTime() - new Date(a.termination_date).getTime()
    })
})

// ===== 액션 함수들 =====

// 직원 목록 로드
export async function loadEmployees(): Promise<void> {
  isLoading.set(true)
  error.set(null)

  try {
    const response = await fetch('/api/employees')
    const result = (await response.json()) as ApiResponse<Employee[]>

    if (result.success && result.data) {
      employees.set(result.data)
    } else {
      error.set(result.error || '직원 목록을 불러오는데 실패했습니다.')
    }
  } catch (err) {
    error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
  } finally {
    isLoading.set(false)
  }
}

// 직원 추가
export async function addEmployee(
  employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<boolean> {
  isLoading.set(true)
  error.set(null)

  try {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    })

    const result = (await response.json()) as ApiResponse<Employee>

    if (result.success && result.data) {
      employees.update((current) => [...current, result.data!])
      return true
    } else {
      error.set(result.error || '직원 추가에 실패했습니다.')
      return false
    }
  } catch (err) {
    error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    return false
  } finally {
    isLoading.set(false)
  }
}

// 직원 수정
export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<boolean> {
  isLoading.set(true)
  error.set(null)

  try {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    const result = (await response.json()) as ApiResponse<Employee>

    if (result.success && result.data) {
      employees.update((current) => current.map((emp) => (emp.id === id ? result.data! : emp)))
      return true
    } else {
      error.set(result.error || '직원 수정에 실패했습니다.')
      return false
    }
  } catch (err) {
    error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    return false
  } finally {
    isLoading.set(false)
  }
}

// 직원 삭제
export async function deleteEmployee(id: string): Promise<boolean> {
  isLoading.set(true)
  error.set(null)

  try {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
    })

    const result = (await response.json()) as ApiResponse<void>

    if (result.success) {
      employees.update((current) => current.filter((emp) => emp.id !== id))
      return true
    } else {
      error.set(result.error || '직원 삭제에 실패했습니다.')
      return false
    }
  } catch (err) {
    error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    return false
  } finally {
    isLoading.set(false)
  }
}

// 검색 필터 설정
export function setSearchFilter(filter: Partial<EmployeeSearchFilter>): void {
  searchFilter.update((current) => ({ ...current, ...filter }))
}

// 페이지 설정
export function setPage(page: number): void {
  currentPage.set(page)
}

// 페이지 크기 설정
export function setPageSize(size: number): void {
  pageSize.set(size)
  currentPage.set(1) // 페이지 크기 변경 시 첫 페이지로
}

// 직원 선택
export function selectEmployee(employee: Employee | null): void {
  selectedEmployee.set(employee)
}

// 오류 초기화
export function clearError(): void {
  error.set(null)
}
