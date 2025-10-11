/**
 * Project Management - Member Service
 * 프로젝트 멤버 관련 API 호출을 처리하는 서비스
 */

// ============================================================================
// Types
// ============================================================================

export interface MemberPayload {
  projectId: string
  personnelId: string
  role: string
  monthlyRate: number
  startDate: string
  endDate: string
  participationRate: number
  isSalaryBased: boolean
  contractualSalary: number | null
  weeklyHours: number | null
}

export interface MemberUpdatePayload extends Partial<MemberPayload> {
  id: string
}

interface ApiResponse<T> {
  data: T
}

// ============================================================================
// API Helper
// ============================================================================

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)

  if (!response.ok) {
    const action = options?.method || 'fetch'
    throw new Error(`Failed to ${action.toLowerCase()}: ${response.status} ${response.statusText}`)
  }

  const result = (await response.json()) as ApiResponse<T>
  return result.data
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 프로젝트 멤버 목록 조회
 */
export async function getProjectMembers(projectId: string): Promise<any[]> {
  const data = await fetchApi<any[]>(
    `/api/research-development/project-members?projectId=${projectId}`,
  )
  return data || []
}

/**
 * 멤버 추가
 */
export async function addMember(payload: MemberPayload): Promise<any> {
  return fetchApi('/api/research-development/project-members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/**
 * 멤버 수정
 */
export async function updateMember(payload: MemberUpdatePayload): Promise<any> {
  const { id, ...memberData } = payload
  return fetchApi(`/api/research-development/project-members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData),
  })
}

/**
 * 멤버 삭제
 */
export async function deleteMember(memberId: string): Promise<void> {
  await fetchApi<void>(`/api/research-development/project-members/${memberId}`, {
    method: 'DELETE',
  })
}

/**
 * 사용 가능한 직원 목록 조회
 */
export async function getAvailableEmployees(projectId: string): Promise<any[]> {
  const data = await fetchApi<any[]>(`/api/research-development/employees?projectId=${projectId}`)
  return data || []
}
