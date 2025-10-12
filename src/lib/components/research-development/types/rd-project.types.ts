/**
 * Research Development Project Type Definitions
 * 연구개발사업 관련 타입 정의
 */

/**
 * 연구개발사업 상태
 */
export enum RDProjectStatus {
  ACTIVE = 'active',
  PLANNING = 'planning',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

/**
 * 연구개발사업 우선순위
 */
export enum RDProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 연구개발사업 후원기관 유형
 */
export enum RDSponsorType {
  GOVERNMENT_RND = 'government_rnd', // 정부RND
  LOCAL_GOV_RND = 'local_gov_rnd', // 지자체RND
  NON_RND = 'non_rnd', // 비RND
}

/**
 * 연구개발사업 연구 타입
 */
export enum RDResearchType {
  BASIC = 'basic',
  APPLIED = 'applied',
  DEVELOPMENT = 'development',
}

/**
 * Badge Variant 타입 (ThemeBadge 컴포넌트에서 사용)
 */
export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'ghost'
  | 'default'
