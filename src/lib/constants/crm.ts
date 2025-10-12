/**
 * CRM 관련 상수 정의
 */

// ============================================================================
// 회사 코드
// ============================================================================

/**
 * 회사 코드 Enum
 */
export enum CompanyCode {
  VIA = '1001',
  // 향후 다른 회사 추가 가능
}

/**
 * 기본 회사 코드 (현재는 VIA만 사용)
 */
export const DEFAULT_COMPANY_CODE = CompanyCode.VIA

// ============================================================================
// CRM 문서 타입
// ============================================================================

/**
 * CRM 고객 문서 타입
 */
export enum CrmDocumentType {
  BUSINESS_REGISTRATION = 'business-registration',
  BANK_ACCOUNT = 'bank-account',
}

/**
 * CRM 문서 타입 정보
 */
export interface CrmDocumentTypeInfo {
  type: CrmDocumentType
  label: string
  description: string
  s3Folder: string // S3 폴더명
}

/**
 * CRM 문서 타입별 정보
 */
export const CRM_DOCUMENT_TYPES: Record<CrmDocumentType, CrmDocumentTypeInfo> = {
  [CrmDocumentType.BUSINESS_REGISTRATION]: {
    type: CrmDocumentType.BUSINESS_REGISTRATION,
    label: '사업자등록증',
    description: '사업자등록증 사본',
    s3Folder: 'business-registration',
  },
  [CrmDocumentType.BANK_ACCOUNT]: {
    type: CrmDocumentType.BANK_ACCOUNT,
    label: '통장사본',
    description: '계좌 통장사본',
    s3Folder: 'bank-account',
  },
}

/**
 * 문서 타입 라벨 조회
 */
export function getCrmDocumentTypeLabel(type: CrmDocumentType): string {
  return CRM_DOCUMENT_TYPES[type]?.label || '알 수 없음'
}

/**
 * 문서 타입 정보 조회
 */
export function getCrmDocumentTypeInfo(type: CrmDocumentType): CrmDocumentTypeInfo {
  return CRM_DOCUMENT_TYPES[type]
}

/**
 * DB 컬럼명 조회 (s3_key)
 */
export function getCrmDocumentS3KeyColumn(type: CrmDocumentType): string {
  return type === CrmDocumentType.BUSINESS_REGISTRATION
    ? 'business_registration_s3_key'
    : 'bank_account_s3_key'
}

// ============================================================================
// S3 경로 헬퍼
// ============================================================================

/**
 * CRM 문서 S3 키 생성
 */
export function generateCrmDocumentS3Key(
  companyCode: string,
  customerId: string,
  documentType: CrmDocumentType,
  filename: string,
): string {
  const info = getCrmDocumentTypeInfo(documentType)
  return `${companyCode}/customers/${customerId}/${info.s3Folder}/${filename}`
}
