/**
 * Project Management - Project Service
 * 프로젝트 관련 API 호출을 처리하는 서비스
 */

import type { Project } from '$lib/types'

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

/**
 * 프로젝트 기간 업데이트
 */
export async function updateProjectPeriod(
  payload: ProjectPeriodUpdatePayload,
): Promise<ProjectPeriodUpdateResponse> {
  const response = await fetch(`/api/project-management/projects/${payload.projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: payload.startDate,
      endDate: payload.endDate,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update project period: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

/**
 * 프로젝트 상세 정보 조회
 */
export async function getProject(projectId: string): Promise<Project> {
  const response = await fetch(`/api/project-management/projects/${projectId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch project: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * 프로젝트 목록 조회
 */
export async function getProjects(): Promise<Project[]> {
  const response = await fetch('/api/project-management/projects')

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

/**
 * 프로젝트 생성
 */
export async function createProject(projectData: Partial<Project>): Promise<Project> {
  const response = await fetch('/api/project-management/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData),
  })

  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * 프로젝트 삭제
 */
export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(`/api/project-management/projects/${projectId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.status} ${response.statusText}`)
  }
}
