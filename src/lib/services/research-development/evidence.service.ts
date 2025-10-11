/**
 * Project Management - Evidence Service
 * 증빙 관련 API 호출을 처리하는 서비스
 */

export interface Evidence {
  id: string
  projectId: string
  categoryId: string
  name: string
  description?: string
  // ... 기타 필드들
}

export interface EvidenceCategory {
  id: string
  name: string
  description?: string
}

export interface EvidenceType {
  id: string
  name: string
  code: string
}

/**
 * 증빙 상세 정보 조회
 */
export async function getEvidence(evidenceId: string): Promise<Evidence> {
  const response = await fetch(`/api/research-development/evidence/${evidenceId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch evidence: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { data: Evidence }
  return data.data
}

/**
 * 증빙 카테고리 목록 조회
 */
export async function getEvidenceCategories(): Promise<EvidenceCategory[]> {
  const response = await fetch('/api/research-development/evidence-categories')

  if (!response.ok) {
    throw new Error(
      `Failed to fetch evidence categories: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as { data: EvidenceCategory[] }
  return data.data || []
}

/**
 * 증빙 타입 목록 조회
 */
export async function getEvidenceTypes(): Promise<EvidenceType[]> {
  const response = await fetch('/api/research-development/evidence-types')

  if (!response.ok) {
    throw new Error(`Failed to fetch evidence types: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { data: EvidenceType[] }
  return data.data || []
}

/**
 * 증빙 생성
 */
export async function createEvidence(evidenceData: Partial<Evidence>): Promise<Evidence> {
  const response = await fetch('/api/research-development/evidence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evidenceData),
  })

  if (!response.ok) {
    throw new Error(`Failed to create evidence: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { data: Evidence }
  return data.data
}

/**
 * 증빙 업데이트
 */
export async function updateEvidence(
  evidenceId: string,
  evidenceData: Partial<Evidence>,
): Promise<Evidence> {
  const response = await fetch(`/api/research-development/evidence/${evidenceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evidenceData),
  })

  if (!response.ok) {
    throw new Error(`Failed to update evidence: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { data: Evidence }
  return data.data
}

/**
 * 증빙 삭제
 */
export async function deleteEvidence(evidenceId: string): Promise<void> {
  const response = await fetch(`/api/research-development/evidence/${evidenceId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete evidence: ${response.status} ${response.statusText}`)
  }
}
