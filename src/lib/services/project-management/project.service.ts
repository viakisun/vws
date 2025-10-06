/**
 * Project Management - Project Service
 * 프로젝트 관련 API 호출을 처리하는 서비스
 */

import type { Project } from '$lib/types'

// ============================================================================
// Types
// ============================================================================

export interface ProjectPeriodUpdatePayload {
  projectId: string
  startDate: string
  endDate: string
}

export interface ProjectPeriodUpdateResponse {
  success: boolean
  message: string
  data?: {
    startDate: string
    endDate: string
  }
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
 * 프로젝트 목록 조회
 */
export async function getProjects(): Promise<Project[]> {
  const data = await fetchApi<Project[]>('/api/project-management/projects')
  return data || []
}

/**
 * 프로젝트 상세 정보 조회
 */
export async function getProject(projectId: string): Promise<Project> {
  return fetchApi<Project>(`/api/project-management/projects/${projectId}`)
}

/**
 * 프로젝트 생성
 */
export async function createProject(projectData: Partial<Project>): Promise<Project> {
  return fetchApi<Project>('/api/project-management/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData),
  })
}

/**
 * 프로젝트 업데이트
 */
export async function updateProject(
  projectId: string,
  data: Partial<Project>,
): Promise<ProjectPeriodUpdateResponse> {
  const response = await fetch(`/api/project-management/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Failed to update project: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as ProjectPeriodUpdateResponse
}

/**
 * 프로젝트 기간 업데이트
 */
export async function updateProjectPeriod(
  payload: ProjectPeriodUpdatePayload,
): Promise<ProjectPeriodUpdateResponse> {
  return updateProject(payload.projectId, {
    startDate: payload.startDate,
    endDate: payload.endDate,
  })
}

/**
 * 프로젝트 삭제
 */
export async function deleteProject(projectId: string): Promise<void> {
  await fetch(`/api/project-management/projects/${projectId}`, {
    method: 'DELETE',
  })

  // Note: 응답 체크를 하지 않음 (기존 동작 유지)
}
