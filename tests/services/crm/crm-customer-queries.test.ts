import {
    CUSTOMER_COLUMNS,
    INSERT_UPDATE_COLUMNS,
    SELECT_QUERY,
    buildInsertQuery,
    buildUpdateQuery,
    mapCustomerData,
} from '$lib/crm/services/crm-customer-queries'
import { describe, expect, it } from 'vitest'

describe('CRM Customer Queries', () => {
  describe('CUSTOMER_COLUMNS', () => {
    it('모든 필요한 컬럼이 포함되어야 함', () => {
      expect(CUSTOMER_COLUMNS).toContain('id')
      expect(CUSTOMER_COLUMNS).toContain('name')
      expect(CUSTOMER_COLUMNS).toContain('type')
      expect(CUSTOMER_COLUMNS).toContain('business_number')
      expect(CUSTOMER_COLUMNS).toContain('contact_person')
      expect(CUSTOMER_COLUMNS).toContain('contact_phone')
      expect(CUSTOMER_COLUMNS).toContain('contact_email')
      expect(CUSTOMER_COLUMNS).toContain('representative_name')
      expect(CUSTOMER_COLUMNS).toContain('address')
      expect(CUSTOMER_COLUMNS).toContain('industry')
      expect(CUSTOMER_COLUMNS).toContain('payment_terms')
      expect(CUSTOMER_COLUMNS).toContain('status')
      expect(CUSTOMER_COLUMNS).toContain('notes')
      expect(CUSTOMER_COLUMNS).toContain('business_registration_file_url')
      expect(CUSTOMER_COLUMNS).toContain('bank_account_file_url')
      expect(CUSTOMER_COLUMNS).toContain('business_registration_s3_key')
      expect(CUSTOMER_COLUMNS).toContain('bank_account_s3_key')
      expect(CUSTOMER_COLUMNS).toContain('establishment_date')
      expect(CUSTOMER_COLUMNS).toContain('corporation_status')
      expect(CUSTOMER_COLUMNS).toContain('business_entity_type')
      expect(CUSTOMER_COLUMNS).toContain('business_type')
      expect(CUSTOMER_COLUMNS).toContain('business_category')
      expect(CUSTOMER_COLUMNS).toContain('bank_name')
      expect(CUSTOMER_COLUMNS).toContain('account_number')
      expect(CUSTOMER_COLUMNS).toContain('account_holder')
      expect(CUSTOMER_COLUMNS).toContain('ocr_processed_at')
      expect(CUSTOMER_COLUMNS).toContain('ocr_confidence')
      expect(CUSTOMER_COLUMNS).toContain('created_at::text as created_at')
      expect(CUSTOMER_COLUMNS).toContain('updated_at::text as updated_at')
    })

    it('created_at과 updated_at이 텍스트로 변환되어야 함', () => {
      expect(CUSTOMER_COLUMNS).toContain('created_at::text as created_at')
      expect(CUSTOMER_COLUMNS).toContain('updated_at::text as updated_at')
    })

    it('총 29개의 컬럼이 있어야 함', () => {
      expect(CUSTOMER_COLUMNS).toHaveLength(29)
    })
  })

  describe('INSERT_UPDATE_COLUMNS', () => {
    it('created_at과 updated_at이 제외되어야 함', () => {
      expect(INSERT_UPDATE_COLUMNS).not.toContain('created_at::text as created_at')
      expect(INSERT_UPDATE_COLUMNS).not.toContain('updated_at::text as updated_at')
      expect(INSERT_UPDATE_COLUMNS).not.toContain('id') // id는 자동 생성
    })

    it('모든 필수 업데이트 컬럼이 포함되어야 함', () => {
      expect(INSERT_UPDATE_COLUMNS).toContain('name')
      expect(INSERT_UPDATE_COLUMNS).toContain('type')
      expect(INSERT_UPDATE_COLUMNS).toContain('business_number')
      expect(INSERT_UPDATE_COLUMNS).toContain('contact_person')
      expect(INSERT_UPDATE_COLUMNS).toContain('contact_phone')
      expect(INSERT_UPDATE_COLUMNS).toContain('contact_email')
      expect(INSERT_UPDATE_COLUMNS).toContain('representative_name')
      expect(INSERT_UPDATE_COLUMNS).toContain('address')
      expect(INSERT_UPDATE_COLUMNS).toContain('industry')
      expect(INSERT_UPDATE_COLUMNS).toContain('payment_terms')
      expect(INSERT_UPDATE_COLUMNS).toContain('status')
      expect(INSERT_UPDATE_COLUMNS).toContain('notes')
      expect(INSERT_UPDATE_COLUMNS).toContain('business_registration_file_url')
      expect(INSERT_UPDATE_COLUMNS).toContain('bank_account_file_url')
      expect(INSERT_UPDATE_COLUMNS).toContain('business_registration_s3_key')
      expect(INSERT_UPDATE_COLUMNS).toContain('bank_account_s3_key')
      expect(INSERT_UPDATE_COLUMNS).toContain('establishment_date')
      expect(INSERT_UPDATE_COLUMNS).toContain('corporation_status')
      expect(INSERT_UPDATE_COLUMNS).toContain('business_entity_type')
      expect(INSERT_UPDATE_COLUMNS).toContain('business_type')
      expect(INSERT_UPDATE_COLUMNS).toContain('business_category')
      expect(INSERT_UPDATE_COLUMNS).toContain('bank_name')
      expect(INSERT_UPDATE_COLUMNS).toContain('account_number')
      expect(INSERT_UPDATE_COLUMNS).toContain('account_holder')
      expect(INSERT_UPDATE_COLUMNS).toContain('ocr_processed_at')
      expect(INSERT_UPDATE_COLUMNS).toContain('ocr_confidence')
    })

    it('총 27개의 컬럼이 있어야 함', () => {
      expect(INSERT_UPDATE_COLUMNS).toHaveLength(27)
    })
  })

  describe('SELECT_QUERY', () => {
    it('올바른 SELECT 쿼리를 생성해야 함', () => {
      expect(SELECT_QUERY).toContain('SELECT')
      expect(SELECT_QUERY).toContain('FROM crm_customers')
      expect(SELECT_QUERY).toContain('id,')
      expect(SELECT_QUERY).toContain('name,')
      expect(SELECT_QUERY).toContain('type,')
      expect(SELECT_QUERY).toContain('business_number,')
    })

    it('모든 컬럼이 포함되어야 함', () => {
      CUSTOMER_COLUMNS.forEach(column => {
        expect(SELECT_QUERY).toContain(column)
      })
    })
  })

  describe('buildInsertQuery', () => {
    it('올바른 INSERT 쿼리를 생성해야 함', () => {
      const query = buildInsertQuery()

      expect(query).toContain('INSERT INTO crm_customers')
      expect(query).toContain('VALUES')
      expect(query).toContain('RETURNING')
      expect(query).toContain('crm_customers')
    })

    it('올바른 플레이스홀더를 생성해야 함', () => {
      const query = buildInsertQuery()

      // 27개 컬럼에 대해 $1부터 $27까지의 플레이스홀더가 있어야 함
      for (let i = 1; i <= 27; i++) {
        expect(query).toContain(`$${i}`)
      }
    })

    it('모든 INSERT_UPDATE_COLUMNS가 포함되어야 함', () => {
      const query = buildInsertQuery()

      INSERT_UPDATE_COLUMNS.forEach(column => {
        expect(query).toContain(column)
      })
    })

    it('RETURNING 절에 모든 CUSTOMER_COLUMNS가 포함되어야 함', () => {
      const query = buildInsertQuery()

      CUSTOMER_COLUMNS.forEach(column => {
        expect(query).toContain(column)
      })
    })
  })

  describe('buildUpdateQuery', () => {
    it('올바른 UPDATE 쿼리를 생성해야 함', () => {
      const query = buildUpdateQuery()

      expect(query).toContain('UPDATE crm_customers SET')
      expect(query).toContain('WHERE id = $28') // 27개 컬럼 + 1개 ID = 28번째 파라미터
      expect(query).toContain('updated_at = NOW()')
      expect(query).toContain('RETURNING')
    })

    it('올바른 플레이스홀더를 생성해야 함', () => {
      const query = buildUpdateQuery()

      // 27개 컬럼에 대해 $1부터 $27까지의 플레이스홀더가 있어야 함
      for (let i = 1; i <= 27; i++) {
        expect(query).toContain(`$${i}`)
      }
      // WHERE 절에서 $28 (ID 파라미터)
      expect(query).toContain('$28')
    })

    it('모든 컬럼이 SET 절에 포함되어야 함', () => {
      const query = buildUpdateQuery()

      INSERT_UPDATE_COLUMNS.forEach(column => {
        expect(query).toContain(`${column} = $`)
      })
    })

    it('updated_at이 NOW()로 설정되어야 함', () => {
      const query = buildUpdateQuery()
      expect(query).toContain('updated_at = NOW()')
    })

    it('RETURNING 절에 모든 CUSTOMER_COLUMNS가 포함되어야 함', () => {
      const query = buildUpdateQuery()

      CUSTOMER_COLUMNS.forEach(column => {
        expect(query).toContain(column)
      })
    })
  })

  describe('mapCustomerData', () => {
    it('기본 고객 데이터를 올바르게 매핑해야 함', () => {
      const data = {
        name: '테스트 고객사',
        business_number: '123-45-67890',
        type: 'customer',
        contact_person: '홍길동',
        contact_phone: '010-1234-5678',
        contact_email: 'hong@example.com',
        address: '서울시 강남구',
        industry: 'IT서비스',
        payment_terms: 30,
        status: 'active',
        notes: '테스트 고객입니다.',
      }

      const result = mapCustomerData(data)

      expect(result).toHaveLength(27)
      expect(result[0]).toBe('테스트 고객사') // name
      expect(result[1]).toBe('customer') // type
      expect(result[2]).toBe('123-45-67890') // business_number
      expect(result[3]).toBe('홍길동') // contact_person
      expect(result[4]).toBe('010-1234-5678') // contact_phone
      expect(result[5]).toBe('hong@example.com') // contact_email
      expect(result[6]).toBe(null) // representative_name (없음)
      expect(result[7]).toBe('서울시 강남구') // address
      expect(result[8]).toBe('IT서비스') // industry
      expect(result[9]).toBe(30) // payment_terms
      expect(result[10]).toBe('active') // status
      expect(result[11]).toBe('테스트 고객입니다.') // notes
    })

    it('기본값이 올바르게 설정되어야 함', () => {
      const data = {
        name: '기본값 테스트',
        business_number: '987-65-43210',
      }

      const result = mapCustomerData(data)

      expect(result[1]).toBe('customer') // type 기본값
      expect(result[9]).toBe(30) // payment_terms 기본값
      expect(result[10]).toBe('active') // status 기본값
      expect(result[3]).toBe(null) // contact_person 기본값
      expect(result[4]).toBe(null) // contact_phone 기본값
      expect(result[5]).toBe(null) // contact_email 기본값
      expect(result[6]).toBe(null) // representative_name 기본값
      expect(result[7]).toBe(null) // address 기본값
      expect(result[8]).toBe(null) // industry 기본값
      expect(result[11]).toBe(null) // notes 기본값
    })

    it('OCR 관련 데이터를 올바르게 매핑해야 함', () => {
      const data = {
        name: 'OCR 고객사',
        business_number: '555-66-77777',
        type: 'customer',
        representative_name: 'OCR 대표자',
        establishment_date: '2020-01-01',
        corporation_status: true,
        business_entity_type: '법인사업자',
        business_type: '서비스업',
        business_category: 'IT서비스',
        bank_name: '국민은행',
        account_number: '123456-78-901234',
        account_holder: 'OCR 고객사',
        ocr_processed_at: '2025-01-15T10:00:00Z',
        ocr_confidence: 0.95,
        business_registration_file_url: 'https://example.com/business-reg.pdf',
        bank_account_file_url: 'https://example.com/bank-account.pdf',
        business_registration_s3_key: 's3://bucket/business-reg-123.pdf',
        bank_account_s3_key: 's3://bucket/bank-account-123.pdf',
      }

      const result = mapCustomerData(data)

      expect(result[6]).toBe('OCR 대표자') // representative_name
      expect(result[12]).toBe('https://example.com/business-reg.pdf') // business_registration_file_url
      expect(result[13]).toBe('https://example.com/bank-account.pdf') // bank_account_file_url
      expect(result[14]).toBe('s3://bucket/business-reg-123.pdf') // business_registration_s3_key
      expect(result[15]).toBe('s3://bucket/bank-account-123.pdf') // bank_account_s3_key
      expect(result[16]).toBe('2020-01-01') // establishment_date
      expect(result[17]).toBe(true) // corporation_status
      expect(result[18]).toBe('법인사업자') // business_entity_type
      expect(result[19]).toBe('서비스업') // business_type
      expect(result[20]).toBe('IT서비스') // business_category
      expect(result[21]).toBe('국민은행') // bank_name
      expect(result[22]).toBe('123456-78-901234') // account_number
      expect(result[23]).toBe('OCR 고객사') // account_holder
      expect(result[24]).toBe('2025-01-15T10:00:00Z') // ocr_processed_at
      expect(result[25]).toBe(0.95) // ocr_confidence
    })

    it('빈 객체를 처리해야 함', () => {
      const data = {}

      const result = mapCustomerData(data)

      expect(result).toHaveLength(27)
      expect(result[0]).toBe(undefined) // name
      expect(result[1]).toBe('customer') // type 기본값
      expect(result[2]).toBe(undefined) // business_number
      expect(result[3]).toBe(null) // contact_person 기본값
      expect(result[4]).toBe(null) // contact_phone 기본값
      expect(result[5]).toBe(null) // contact_email 기본값
      expect(result[6]).toBe(null) // representative_name 기본값
      expect(result[7]).toBe(null) // address 기본값
      expect(result[8]).toBe(null) // industry 기본값
      expect(result[9]).toBe(30) // payment_terms 기본값
      expect(result[10]).toBe('active') // status 기본값
      expect(result[11]).toBe(null) // notes 기본값
    })

    it('null 값을 올바르게 처리해야 함', () => {
      const data = {
        name: 'Null 테스트',
        business_number: '111-22-33333',
        contact_person: null,
        contact_phone: null,
        contact_email: null,
        address: null,
        industry: null,
        notes: null,
      }

      const result = mapCustomerData(data)

      expect(result[3]).toBe(null) // contact_person
      expect(result[4]).toBe(null) // contact_phone
      expect(result[5]).toBe(null) // contact_email
      expect(result[7]).toBe(null) // address
      expect(result[8]).toBe(null) // industry
      expect(result[11]).toBe(null) // notes
    })

    it('undefined 값을 올바르게 처리해야 함', () => {
      const data = {
        name: 'Undefined 테스트',
        business_number: '444-55-66666',
        contact_person: undefined,
        contact_phone: undefined,
        contact_email: undefined,
        address: undefined,
        industry: undefined,
        notes: undefined,
      }

      const result = mapCustomerData(data)

      expect(result[3]).toBe(null) // contact_person (undefined -> null)
      expect(result[4]).toBe(null) // contact_phone (undefined -> null)
      expect(result[5]).toBe(null) // contact_email (undefined -> null)
      expect(result[7]).toBe(null) // address (undefined -> null)
      expect(result[8]).toBe(null) // industry (undefined -> null)
      expect(result[11]).toBe(null) // notes (undefined -> null)
    })

    it('복합 데이터를 올바르게 매핑해야 함', () => {
      const data = {
        name: '복합 테스트 고객사',
        business_number: '777-88-99999',
        type: 'supplier',
        contact_person: '복합 담당자',
        contact_phone: '010-7777-8888',
        contact_email: 'complex@example.com',
        representative_name: '복합 대표자',
        address: '부산시 해운대구',
        industry: '제조업',
        payment_terms: 60,
        status: 'inactive',
        notes: '복합 테스트 고객입니다.',
        business_registration_file_url: 'https://example.com/complex-business.pdf',
        bank_account_file_url: 'https://example.com/complex-bank.pdf',
        business_registration_s3_key: 's3://bucket/complex-business-456.pdf',
        bank_account_s3_key: 's3://bucket/complex-bank-456.pdf',
        establishment_date: '2018-05-20',
        corporation_status: false,
        business_entity_type: '개인사업자',
        business_type: '제조업',
        business_category: '전자제품',
        bank_name: '우리은행',
        account_number: '987654-32-109876',
        account_holder: '복합 테스트 고객사',
        ocr_processed_at: '2025-01-15T14:30:00Z',
        ocr_confidence: 0.88,
      }

      const result = mapCustomerData(data)

      expect(result[0]).toBe('복합 테스트 고객사') // name
      expect(result[1]).toBe('supplier') // type
      expect(result[2]).toBe('777-88-99999') // business_number
      expect(result[3]).toBe('복합 담당자') // contact_person
      expect(result[4]).toBe('010-7777-8888') // contact_phone
      expect(result[5]).toBe('complex@example.com') // contact_email
      expect(result[6]).toBe('복합 대표자') // representative_name
      expect(result[7]).toBe('부산시 해운대구') // address
      expect(result[8]).toBe('제조업') // industry
      expect(result[9]).toBe(60) // payment_terms
      expect(result[10]).toBe('inactive') // status
      expect(result[11]).toBe('복합 테스트 고객사입니다.') // notes
      expect(result[12]).toBe('https://example.com/complex-business.pdf') // business_registration_file_url
      expect(result[13]).toBe('https://example.com/complex-bank.pdf') // bank_account_file_url
      expect(result[14]).toBe('s3://bucket/complex-business-456.pdf') // business_registration_s3_key
      expect(result[15]).toBe('s3://bucket/complex-bank-456.pdf') // bank_account_s3_key
      expect(result[16]).toBe('2018-05-20') // establishment_date
      expect(result[17]).toBe(false) // corporation_status
      expect(result[18]).toBe('개인사업자') // business_entity_type
      expect(result[19]).toBe('제조업') // business_type
      expect(result[20]).toBe('전자제품') // business_category
      expect(result[21]).toBe('우리은행') // bank_name
      expect(result[22]).toBe('987654-32-109876') // account_number
      expect(result[23]).toBe('복합 테스트 고객사') // account_holder
      expect(result[24]).toBe('2025-01-15T14:30:00Z') // ocr_processed_at
      expect(result[25]).toBe(0.88) // ocr_confidence
    })
  })

  describe('Integration tests', () => {
    it('INSERT 쿼리와 mapCustomerData가 호환되어야 함', () => {
      const data = {
        name: '호환성 테스트',
        business_number: '123-45-67890',
        type: 'customer',
      }

      const insertQuery = buildInsertQuery()
      const mappedData = mapCustomerData(data)

      // INSERT 쿼리의 플레이스홀더 수와 매핑된 데이터 길이가 일치해야 함
      const placeholderCount = (insertQuery.match(/\$/g) || []).length
      expect(mappedData).toHaveLength(placeholderCount)
    })

    it('UPDATE 쿼리와 mapCustomerData가 호환되어야 함', () => {
      const data = {
        name: '호환성 테스트',
        business_number: '123-45-67890',
        type: 'customer',
      }

      const updateQuery = buildUpdateQuery()
      const mappedData = mapCustomerData(data)

      // UPDATE 쿼리의 플레이스홀더 수는 매핑된 데이터 길이 + 1 (ID)이어야 함
      const placeholderCount = (updateQuery.match(/\$/g) || []).length
      expect(placeholderCount).toBe(mappedData.length + 1) // +1 for ID parameter
    })

    it('모든 컬럼이 일관성 있게 처리되어야 함', () => {
      // CUSTOMER_COLUMNS에서 id와 created_at, updated_at을 제외한 컬럼들이
      // INSERT_UPDATE_COLUMNS에 모두 포함되어야 함
      const selectColumns = CUSTOMER_COLUMNS.filter(col => 
        !col.includes('id') && 
        !col.includes('created_at') && 
        !col.includes('updated_at')
      ).map(col => col.split(' as ')[0]) // 'column::text as column' 형태 처리

      const insertUpdateColumns = INSERT_UPDATE_COLUMNS

      selectColumns.forEach(selectCol => {
        expect(insertUpdateColumns).toContain(selectCol)
      })
    })
  })
})
