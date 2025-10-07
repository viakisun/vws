import type { BaseEntity } from './index'

// 태그 타입 (시스템 태그)
export type AccountTagType =
  | 'dashboard' // 대시보드에 표시
  | 'revenue' // 매출 분석 대상
  | 'operation' // 운영비 분석 대상
  | 'fund' // 자금관리 분석 대상
  | 'rnd' // R&D (회사 자금에서 제외)
  | 'custom' // 사용자 정의

// 태그 정보
export interface AccountTag extends BaseEntity {
  name: string
  color: string // UI에서 사용할 색상 (예: #3B82F6)
  description?: string
  isActive: boolean
  tagType: AccountTagType // 태그 타입
  isSystem: boolean // 시스템 태그 여부 (삭제 불가)
}

// 태그 생성 요청
export interface CreateAccountTagRequest {
  name: string
  color: string
  description?: string
}

// 태그 업데이트 요청
export interface UpdateAccountTagRequest extends Partial<CreateAccountTagRequest> {
  id: string
}

// 태그 필터
export interface AccountTagFilter {
  isActive?: boolean
  search?: string
}
