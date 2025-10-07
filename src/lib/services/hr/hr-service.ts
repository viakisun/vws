/**
 * HR Service Layer
 *
 * API 호출 및 데이터 처리 로직
 * Clean Architecture: Service Layer
 */

import type {
  Employee,
  Department,
  Position,
  Executive,
  JobTitle,
  LeaveRequest,
  ApiResponse,
} from '$lib/types/hr'
import { logger } from '$lib/utils/logger'

// ============================================================================
// Employee Services
// ============================================================================

export async function loadEmployees(): Promise<ApiResponse<Employee[]>> {
  try {
    const response = await fetch('/api/employees')
    if (!response.ok) throw new Error('Failed to fetch employees')

    const data = await response.json()
    return { success: true, data: data.employees || [] }
  } catch (error) {
    logger.error('Failed to load employees:', error)
    return { success: false, error: '직원 목록을 불러오는데 실패했습니다.' }
  }
}

export async function createEmployee(employee: Partial<Employee>): Promise<ApiResponse<Employee>> {
  try {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee),
    })

    if (!response.ok) throw new Error('Failed to create employee')

    const data = await response.json()
    return { success: true, data: data.employee }
  } catch (error) {
    logger.error('Failed to create employee:', error)
    return { success: false, error: '직원 생성에 실패했습니다.' }
  }
}

export async function updateEmployee(
  id: string,
  employee: Partial<Employee>,
): Promise<ApiResponse<Employee>> {
  try {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee),
    })

    if (!response.ok) throw new Error('Failed to update employee')

    const data = await response.json()
    return { success: true, data: data.employee }
  } catch (error) {
    logger.error('Failed to update employee:', error)
    return { success: false, error: '직원 정보 수정에 실패했습니다.' }
  }
}

export async function deleteEmployee(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete employee')

    return { success: true }
  } catch (error) {
    logger.error('Failed to delete employee:', error)
    return { success: false, error: '직원 삭제에 실패했습니다.' }
  }
}

// ============================================================================
// Department Services
// ============================================================================

export async function loadDepartments(): Promise<ApiResponse<Department[]>> {
  try {
    const response = await fetch('/api/departments')
    if (!response.ok) throw new Error('Failed to fetch departments')

    const result = await response.json()
    return { success: true, data: result.data || [] }
  } catch (error) {
    logger.error('Failed to load departments:', error)
    return { success: false, error: '부서 목록을 불러오는데 실패했습니다.' }
  }
}

export async function createDepartment(
  department: Partial<Department>,
): Promise<ApiResponse<Department>> {
  try {
    const response = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(department),
    })

    if (!response.ok) throw new Error('Failed to create department')

    const data = await response.json()
    return { success: true, data: data.department }
  } catch (error) {
    logger.error('Failed to create department:', error)
    return { success: false, error: '부서 생성에 실패했습니다.' }
  }
}

export async function updateDepartment(
  id: string,
  department: Partial<Department>,
): Promise<ApiResponse<Department>> {
  try {
    const response = await fetch(`/api/departments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(department),
    })

    if (!response.ok) throw new Error('Failed to update department')

    const data = await response.json()
    return { success: true, data: data.department }
  } catch (error) {
    logger.error('Failed to update department:', error)
    return { success: false, error: '부서 정보 수정에 실패했습니다.' }
  }
}

export async function deleteDepartment(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/departments/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete department')

    return { success: true }
  } catch (error) {
    logger.error('Failed to delete department:', error)
    return { success: false, error: '부서 삭제에 실패했습니다.' }
  }
}

// ============================================================================
// Position Services
// ============================================================================

export async function loadPositions(): Promise<ApiResponse<Position[]>> {
  try {
    const response = await fetch('/api/positions')
    if (!response.ok) throw new Error('Failed to fetch positions')

    const result = await response.json()
    return { success: true, data: result.data || [] }
  } catch (error) {
    logger.error('Failed to load positions:', error)
    return { success: false, error: '직급 목록을 불러오는데 실패했습니다.' }
  }
}

export async function createPosition(position: Partial<Position>): Promise<ApiResponse<Position>> {
  try {
    const response = await fetch('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(position),
    })

    if (!response.ok) throw new Error('Failed to create position')

    const data = await response.json()
    return { success: true, data: data.position }
  } catch (error) {
    logger.error('Failed to create position:', error)
    return { success: false, error: '직급 생성에 실패했습니다.' }
  }
}

export async function updatePosition(
  id: string,
  position: Partial<Position>,
): Promise<ApiResponse<Position>> {
  try {
    const response = await fetch(`/api/positions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(position),
    })

    if (!response.ok) throw new Error('Failed to update position')

    const data = await response.json()
    return { success: true, data: data.position }
  } catch (error) {
    logger.error('Failed to update position:', error)
    return { success: false, error: '직급 정보 수정에 실패했습니다.' }
  }
}

export async function deletePosition(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/positions/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete position')

    return { success: true }
  } catch (error) {
    logger.error('Failed to delete position:', error)
    return { success: false, error: '직급 삭제에 실패했습니다.' }
  }
}

// ============================================================================
// Executive Services
// ============================================================================

export async function loadExecutives(): Promise<ApiResponse<Executive[]>> {
  try {
    const response = await fetch('/api/executives')
    if (!response.ok) throw new Error('Failed to fetch executives')

    const result = await response.json()
    return { success: true, data: result.data || [] }
  } catch (error) {
    logger.error('Failed to load executives:', error)
    return { success: false, error: '임원 목록을 불러오는데 실패했습니다.' }
  }
}

export async function createExecutive(
  executive: Partial<Executive>,
): Promise<ApiResponse<Executive>> {
  try {
    const response = await fetch('/api/executives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(executive),
    })

    if (!response.ok) throw new Error('Failed to create executive')

    const data = await response.json()
    return { success: true, data: data.executive }
  } catch (error) {
    logger.error('Failed to create executive:', error)
    return { success: false, error: '임원 생성에 실패했습니다.' }
  }
}

export async function updateExecutive(
  id: string,
  executive: Partial<Executive>,
): Promise<ApiResponse<Executive>> {
  try {
    const response = await fetch(`/api/executives/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(executive),
    })

    if (!response.ok) throw new Error('Failed to update executive')

    const data = await response.json()
    return { success: true, data: data.executive }
  } catch (error) {
    logger.error('Failed to update executive:', error)
    return { success: false, error: '임원 정보 수정에 실패했습니다.' }
  }
}

export async function deleteExecutive(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/executives/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete executive')

    return { success: true }
  } catch (error) {
    logger.error('Failed to delete executive:', error)
    return { success: false, error: '임원 삭제에 실패했습니다.' }
  }
}

// ============================================================================
// Job Title Services
// ============================================================================

export async function loadJobTitles(): Promise<ApiResponse<JobTitle[]>> {
  try {
    const response = await fetch('/api/job-titles')
    if (!response.ok) throw new Error('Failed to fetch job titles')

    const result = await response.json()
    return { success: true, data: result.data || [] }
  } catch (error) {
    logger.error('Failed to load job titles:', error)
    return { success: false, error: '직책 목록을 불러오는데 실패했습니다.' }
  }
}

export async function createJobTitle(jobTitle: Partial<JobTitle>): Promise<ApiResponse<JobTitle>> {
  try {
    const response = await fetch('/api/job-titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobTitle),
    })

    if (!response.ok) throw new Error('Failed to create job title')

    const data = await response.json()
    return { success: true, data: data.jobTitle }
  } catch (error) {
    logger.error('Failed to create job title:', error)
    return { success: false, error: '직책 생성에 실패했습니다.' }
  }
}

export async function updateJobTitle(
  id: string,
  jobTitle: Partial<JobTitle>,
): Promise<ApiResponse<JobTitle>> {
  try {
    const response = await fetch(`/api/job-titles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobTitle),
    })

    if (!response.ok) throw new Error('Failed to update job title')

    const data = await response.json()
    return { success: true, data: data.jobTitle }
  } catch (error) {
    logger.error('Failed to update job title:', error)
    return { success: false, error: '직책 정보 수정에 실패했습니다.' }
  }
}

export async function deleteJobTitle(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/job-titles/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete job title')

    return { success: true }
  } catch (error) {
    logger.error('Failed to delete job title:', error)
    return { success: false, error: '직책 삭제에 실패했습니다.' }
  }
}

// ============================================================================
// Leave Request Services
// ============================================================================

export async function loadLeaveRequests(): Promise<ApiResponse<LeaveRequest[]>> {
  try {
    const response = await fetch('/api/hr/leave-approval')
    if (!response.ok) throw new Error('Failed to fetch leave requests')

    const result = await response.json()
    return { success: true, data: result.data?.requests || [] }
  } catch (error) {
    logger.error('Failed to load leave requests:', error)
    return { success: false, error: '휴가 신청 목록을 불러오는데 실패했습니다.' }
  }
}

export async function approveLeaveRequest(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch('/api/hr/leave-approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id, action: 'approve' }),
    })

    if (!response.ok) throw new Error('Failed to approve leave request')

    return { success: true }
  } catch (error) {
    logger.error('Failed to approve leave request:', error)
    return { success: false, error: '휴가 승인에 실패했습니다.' }
  }
}

export async function rejectLeaveRequest(id: string, reason: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch('/api/hr/leave-approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id, action: 'reject', reason }),
    })

    if (!response.ok) throw new Error('Failed to reject leave request')

    return { success: true }
  } catch (error) {
    logger.error('Failed to reject leave request:', error)
    return { success: false, error: '휴가 거절에 실패했습니다.' }
  }
}

// ============================================================================
// Statistics Services
// ============================================================================

export async function loadLeaveStatistics() {
  try {
    const response = await fetch('/api/hr/leave-stats')
    if (!response.ok) throw new Error('Failed to fetch leave statistics')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Failed to load leave statistics:', error)
    return { success: false, error: '휴가 통계를 불러오는데 실패했습니다.' }
  }
}

// ============================================================================
// Batch Load All HR Data
// ============================================================================

export async function loadAllHRData() {
  const [employees, departments, positions, executives, jobTitles, leaveRequests] =
    await Promise.all([
      loadEmployees(),
      loadDepartments(),
      loadPositions(),
      loadExecutives(),
      loadJobTitles(),
      loadLeaveRequests(),
    ])

  return {
    employees: employees.success ? employees.data : [],
    departments: departments.success ? departments.data : [],
    positions: positions.success ? positions.data : [],
    executives: executives.success ? executives.data : [],
    jobTitles: jobTitles.success ? jobTitles.data : [],
    leaveRequests: leaveRequests.success ? leaveRequests.data : [],
  }
}
