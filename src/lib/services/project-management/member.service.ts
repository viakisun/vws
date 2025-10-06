/**
 * Project Management - Member Service
 * 프로젝트 멤버 관련 API 호출을 처리하는 서비스
 */

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

/**
 * 프로젝트 멤버 목록 조회
 */
export async function getProjectMembers(projectId: string): Promise<any[]> {
  const response = await fetch(`/api/project-management/project-members?projectId=${projectId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch project members: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

/**
 * 멤버 추가
 */
export async function addMember(payload: MemberPayload): Promise<any> {
  const response = await fetch('/api/project-management/project-members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to add member: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * 멤버 수정
 */
export async function updateMember(payload: MemberUpdatePayload): Promise<any> {
  const { id, ...memberData } = payload
  const response = await fetch(`/api/project-management/project-members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData),
  })

  if (!response.ok) {
    throw new Error(`Failed to update member: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * 멤버 삭제
 */
export async function deleteMember(memberId: string): Promise<void> {
  const response = await fetch(`/api/project-management/project-members/${memberId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete member: ${response.status} ${response.statusText}`)
  }
}

/**
 * 사용 가능한 직원 목록 조회
 */
export async function getAvailableEmployees(projectId: string): Promise<any[]> {
  const response = await fetch(`/api/project-management/employees?projectId=${projectId}`)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch available employees: ${response.status} ${response.statusText}`,
    )
  }

  const data = await response.json()
  return data.data || []
}
