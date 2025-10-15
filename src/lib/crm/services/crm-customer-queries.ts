/**
 * CRM 고객 쿼리 헬퍼
 * 고객 CRUD 작업의 중복 코드를 제거하고 일관성을 유지
 */

// ============================================================================
// 컬럼 정의
// ============================================================================

/**
 * SELECT 쿼리에서 사용할 전체 컬럼 리스트
 */
export const CUSTOMER_COLUMNS = [
  'id',
  'name',
  'type',
  'business_number',
  'contact_person', // 담당자 이름
  'contact_phone', // 담당자 전화번호
  'contact_email', // 담당자 이메일
  'representative_name', // 대표자 이름 (사업자등록증)
  'address',
  'industry',
  'payment_terms',
  'status',
  'notes',
  'business_registration_file_url',
  'bank_account_file_url',
  'business_registration_s3_key',
  'bank_account_s3_key',
  'establishment_date',
  'corporation_status',
  'business_entity_type', // 사업자 유형 (개인사업자, 법인사업자 등)
  'business_type',
  'business_category',
  'bank_name',
  'account_number',
  'account_holder',
  'ocr_processed_at',
  'ocr_confidence',
  'created_at::text as created_at',
  'updated_at::text as updated_at',
]

/**
 * INSERT/UPDATE에서 사용할 컬럼 리스트 (created_at, updated_at 제외)
 */
export const INSERT_UPDATE_COLUMNS = [
  'name',
  'type',
  'business_number',
  'contact_person',
  'contact_phone',
  'contact_email',
  'representative_name',
  'address',
  'industry',
  'payment_terms',
  'status',
  'notes',
  'business_registration_file_url',
  'bank_account_file_url',
  'business_registration_s3_key',
  'bank_account_s3_key',
  'establishment_date',
  'corporation_status',
  'business_entity_type', // 사업자 유형 (개인사업자, 법인사업자 등)
  'business_type',
  'business_category',
  'bank_name',
  'account_number',
  'account_holder',
  'ocr_processed_at',
  'ocr_confidence',
]

// ============================================================================
// 쿼리 빌더
// ============================================================================

/**
 * 기본 SELECT 쿼리 (WHERE 절 없음)
 */
export const SELECT_QUERY = `
  SELECT ${CUSTOMER_COLUMNS.join(', ')}
  FROM crm_customers
`

/**
 * INSERT 쿼리 생성
 */
export function buildInsertQuery(): string {
  const placeholders = INSERT_UPDATE_COLUMNS.map((_, i) => `$${i + 1}`).join(', ')

  return `
    INSERT INTO crm_customers (${INSERT_UPDATE_COLUMNS.join(', ')})
    VALUES (${placeholders})
    RETURNING ${CUSTOMER_COLUMNS.join(', ')}
  `
}

/**
 * UPDATE 쿼리 생성
 */
export function buildUpdateQuery(): string {
  const updates = INSERT_UPDATE_COLUMNS.map((col, i) => `${col} = $${i + 1}`).join(', ')

  return `
    UPDATE crm_customers SET 
      ${updates},
      updated_at = NOW()
    WHERE id = $${INSERT_UPDATE_COLUMNS.length + 1}
    RETURNING ${CUSTOMER_COLUMNS.join(', ')}
  `
}

// ============================================================================
// 데이터 매핑
// ============================================================================

/**
 * 요청 데이터를 쿼리 파라미터 배열로 변환
 * INSERT와 UPDATE 모두 사용 가능 (컬럼 순서 동일)
 */
export function mapCustomerData(data: any): any[] {
  return [
    data.name,
    data.type || 'customer',
    data.business_number,
    data.contact_person || null, // 담당자
    data.contact_phone || null,
    data.contact_email || null,
    data.representative_name || null, // 대표자
    data.address || null,
    data.industry || null,
    data.payment_terms || 30,
    data.status || 'active',
    data.notes || null,
    data.business_registration_file_url || null,
    data.bank_account_file_url || null,
    data.business_registration_s3_key || null,
    data.bank_account_s3_key || null,
    data.establishment_date || null,
    data.corporation_status ?? null,
    data.business_entity_type || null, // 사업자 유형
    data.business_type || null,
    data.business_category || null,
    data.bank_name || null,
    data.account_number || null,
    data.account_holder || null,
    data.ocr_processed_at || null,
    data.ocr_confidence || null,
  ]
}
