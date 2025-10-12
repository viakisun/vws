/**
 * Project Management - Evidence Service
 * 증빙 관련 API 호출을 처리하는 서비스
 */

export interface EvidenceItem {
  id: string
  project_budget_id: string
  category_id: string
  category_code?: string
  category_name?: string
  name: string
  description?: string
  budget_amount: number
  spent_amount: number
  assignee_id?: string
  assignee_name?: string
  progress: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  start_date?: string
  end_date?: string

  // 거래처 정보 (신규)
  vendor_id?: string
  vendor_name?: string
  vendor_full_name?: string
  vendor_business_number?: string
  item_detail?: string
  tax_amount?: number
  payment_date?: string
  notes?: string

  // 인건비 관련 (기존)
  employee_id?: string
  project_member_id?: string
  evidence_month?: string

  created_at: string
  updated_at: string

  // 집계 정보
  document_count?: number
  approved_document_count?: number
  schedule_count?: number
  overdue_schedule_count?: number
}

export interface EvidenceCategory {
  id: string
  code: string
  name: string
  description?: string
  parent_code?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EvidenceType {
  id: string
  name: string
  code: string
}

// Legacy type alias for backward compatibility
export type Evidence = EvidenceItem

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
