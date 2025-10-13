/**
 * CRM 관련 테스트 데이터 Fixtures
 */

export const CRM_FIXTURES = {
  /**
   * 고객 테스트 데이터
   */
  customers: {
    valid: {
      id: 'customer-123',
      name: '테스트 고객사',
      business_number: '123-45-67890',
      representative_name: '홍길동',
      email: 'customer@example.com',
      phone: '010-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      business_type: 'IT서비스',
      business_category: '소프트웨어개발',
      corporation_status: '법인',
      business_entity_type: '법인사업자',
      contact_person: '김담당',
      contact_email: 'contact@example.com',
      contact_phone: '010-9876-5432',
      type: 'customer',
      status: 'active',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    invalid: {
      id: 'customer-invalid',
      name: '', // 필수 필드 누락
      business_number: 'invalid-number',
      email: 'invalid-email',
      type: 'customer',
      status: 'active',
    },
    withDocuments: {
      id: 'customer-with-docs',
      name: '문서 보유 고객사',
      business_number: '987-65-43210',
      representative_name: '이대표',
      email: 'docs@example.com',
      phone: '010-5555-1234',
      address: '부산시 해운대구',
      business_type: '제조업',
      business_category: '자동차부품',
      corporation_status: '법인',
      business_entity_type: '법인사업자',
      contact_person: '박담당',
      contact_email: 'contact@docs.com',
      contact_phone: '010-5555-5678',
      business_registration_s3_key: 'crm/customer-with-docs/business_registration.pdf',
      bank_account_s3_key: 'crm/customer-with-docs/bank_account.pdf',
      type: 'customer',
      status: 'active',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    duplicate: {
      id: 'customer-duplicate',
      name: '중복 고객사',
      business_number: '123-45-67890', // 동일한 사업자번호
      representative_name: '중복대표',
      email: 'duplicate@example.com',
      phone: '010-1111-2222',
      address: '대구시 중구',
      business_type: '유통업',
      business_category: '도소매',
      corporation_status: '법인',
      business_entity_type: '법인사업자',
      contact_person: '중복담당',
      contact_email: 'contact@duplicate.com',
      contact_phone: '010-1111-3333',
      type: 'customer',
      status: 'active',
      created_at: '2025-01-02T00:00:00.000Z',
      updated_at: '2025-01-02T00:00:00.000Z',
    },
  },

  /**
   * 계약 테스트 데이터
   */
  contracts: {
    revenue: {
      id: 'contract-revenue-123',
      customer_id: 'customer-123',
      contract_number: 'CON-2025-001',
      title: '시스템 개발 계약',
      type: 'sales',
      contract_party: '테스트 고객사',
      total_amount: 50000000,
      paid_amount: 25000000,
      contract_type: 'revenue',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      payment_method: '계좌이체',
      payment_terms: 30,
      assigned_to: '김영업',
      status: 'active',
      description: '웹 시스템 개발 및 유지보수',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    expense: {
      id: 'contract-expense-123',
      customer_id: 'customer-123',
      contract_number: 'CON-2025-002',
      title: '클라우드 서비스 계약',
      type: 'purchase',
      contract_party: 'AWS',
      total_amount: 10000000,
      paid_amount: 0,
      contract_type: 'expense',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      payment_method: '신용카드',
      payment_terms: 0,
      assigned_to: '이구매',
      status: 'active',
      description: 'AWS 클라우드 인프라 서비스',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    completed: {
      id: 'contract-completed-123',
      customer_id: 'customer-123',
      contract_number: 'CON-2024-001',
      title: '완료된 프로젝트',
      type: 'sales',
      contract_party: '완료 고객사',
      total_amount: 30000000,
      paid_amount: 30000000,
      contract_type: 'revenue',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      payment_method: '계좌이체',
      payment_terms: 15,
      assigned_to: '김완료',
      status: 'completed',
      description: '완료된 시스템 개발 프로젝트',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-12-31T23:59:59.000Z',
    },
  },

  /**
   * 영업 기회 테스트 데이터
   */
  opportunities: {
    open: {
      id: 'opportunity-open-123',
      customer_id: 'customer-123',
      title: '새로운 프로젝트 기회',
      value: 75000000,
      stage: 'proposal',
      probability: 70,
      expected_close_date: '2025-06-30',
      actual_close_date: null,
      status: 'open',
      assigned_to: '김영업',
      notes: '고객이 관심을 보이고 있음',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    won: {
      id: 'opportunity-won-123',
      customer_id: 'customer-123',
      title: '성사된 프로젝트',
      value: 40000000,
      stage: 'closed_won',
      probability: 100,
      expected_close_date: '2024-12-15',
      actual_close_date: '2024-12-15',
      status: 'closed',
      assigned_to: '이성공',
      notes: '계약 체결 완료',
      created_at: '2024-10-01T00:00:00.000Z',
      updated_at: '2024-12-15T00:00:00.000Z',
    },
    lost: {
      id: 'opportunity-lost-123',
      customer_id: 'customer-123',
      title: '실패한 프로젝트',
      value: 20000000,
      stage: 'closed_lost',
      probability: 0,
      expected_close_date: '2024-11-30',
      actual_close_date: '2024-11-30',
      status: 'closed',
      assigned_to: '박실패',
      notes: '경쟁사가 더 낮은 가격 제시',
      created_at: '2024-09-01T00:00:00.000Z',
      updated_at: '2024-11-30T00:00:00.000Z',
    },
  },

  /**
   * 상호작용 테스트 데이터
   */
  interactions: {
    meeting: {
      id: 'interaction-meeting-123',
      customer_id: 'customer-123',
      type: 'meeting',
      title: '프로젝트 미팅',
      description: '신규 프로젝트 요구사항 논의',
      interaction_date: '2025-01-15T14:00:00.000Z',
      next_action_date: '2025-01-22T14:00:00.000Z',
      created_by: '김영업',
      created_at: '2025-01-15T00:00:00.000Z',
      updated_at: '2025-01-15T00:00:00.000Z',
    },
    call: {
      id: 'interaction-call-123',
      customer_id: 'customer-123',
      type: 'call',
      title: '고객 상담 전화',
      description: '계약 조건 상담',
      interaction_date: '2025-01-14T10:30:00.000Z',
      next_action_date: '2025-01-21T10:30:00.000Z',
      created_by: '김영업',
      created_at: '2025-01-14T00:00:00.000Z',
      updated_at: '2025-01-14T00:00:00.000Z',
    },
    email: {
      id: 'interaction-email-123',
      customer_id: 'customer-123',
      type: 'email',
      title: '제안서 이메일',
      description: '신규 프로젝트 제안서 발송',
      interaction_date: '2025-01-13T09:00:00.000Z',
      next_action_date: '2025-01-20T09:00:00.000Z',
      created_by: '김영업',
      created_at: '2025-01-13T00:00:00.000Z',
      updated_at: '2025-01-13T00:00:00.000Z',
    },
  },

  /**
   * 거래 테스트 데이터
   */
  transactions: {
    income: {
      id: 'transaction-income-123',
      customer_id: 'customer-123',
      contract_id: 'contract-revenue-123',
      type: 'income',
      amount: 25000000,
      description: '1차 계약금 수령',
      transaction_date: '2025-01-15',
      reference_number: 'TXN-2025-001',
      status: 'completed',
      created_at: '2025-01-15T00:00:00.000Z',
      updated_at: '2025-01-15T00:00:00.000Z',
    },
    expense: {
      id: 'transaction-expense-123',
      customer_id: 'customer-123',
      contract_id: 'contract-expense-123',
      type: 'expense',
      amount: 500000,
      description: '클라우드 서비스 이용료',
      transaction_date: '2025-01-14',
      reference_number: 'TXN-2025-002',
      status: 'completed',
      created_at: '2025-01-14T00:00:00.000Z',
      updated_at: '2025-01-14T00:00:00.000Z',
    },
    pending: {
      id: 'transaction-pending-123',
      customer_id: 'customer-123',
      contract_id: 'contract-revenue-123',
      type: 'income',
      amount: 15000000,
      description: '2차 계약금 예정',
      transaction_date: '2025-02-15',
      reference_number: 'TXN-2025-003',
      status: 'pending',
      created_at: '2025-01-15T00:00:00.000Z',
      updated_at: '2025-01-15T00:00:00.000Z',
    },
  },

  /**
   * CRM 통계 테스트 데이터
   */
  stats: {
    monthly: {
      total_customers: 150,
      active_customers: 120,
      inactive_customers: 30,
      prospect_customers: 45,
      new_customers_this_month: 12,
      new_customers_last_month: 8,
      new_customers_growth: 50,
      open_opportunities: 25,
      total_opportunity_amount: 500000000,
      expected_revenue_this_month: 75000000,
      active_contracts: 85,
      total_revenue_contracts: 450000000,
      total_expense_contracts: 120000000,
      net_contract_value: 330000000,
      contracts_to_renew: 15,
    },
    quarterly: {
      total_customers: 180,
      active_customers: 140,
      inactive_customers: 40,
      prospect_customers: 55,
      new_customers_this_month: 8,
      new_customers_last_month: 15,
      new_customers_growth: -47,
      open_opportunities: 35,
      total_opportunity_amount: 750000000,
      expected_revenue_this_month: 95000000,
      active_contracts: 95,
      total_revenue_contracts: 520000000,
      total_expense_contracts: 150000000,
      net_contract_value: 370000000,
      contracts_to_renew: 22,
    },
  },

  /**
   * OCR 테스트 데이터
   */
  ocr: {
    businessRegistration: {
      businessName: '테스트 주식회사',
      businessNumber: '123-45-67890',
      representativeName: '홍길동',
      businessType: 'IT서비스',
      businessCategory: '소프트웨어개발',
      address: '서울시 강남구 테헤란로 123',
      startDate: '2020-01-01',
      status: 'active',
    },
    bankAccount: {
      bankName: '국민은행',
      accountNumber: '123456-78-901234',
      accountHolder: '테스트 주식회사',
      branchName: '강남지점',
    },
  },

  /**
   * 문서 업로드 테스트 데이터
   */
  documents: {
    businessRegistration: {
      filename: 'business_registration.pdf',
      contentType: 'application/pdf',
      size: 1024000, // 1MB
      s3Key: 'crm/customer-123/business_registration.pdf',
    },
    bankAccount: {
      filename: 'bank_account.pdf',
      contentType: 'application/pdf',
      size: 512000, // 512KB
      s3Key: 'crm/customer-123/bank_account.pdf',
    },
    invalid: {
      filename: 'invalid.txt',
      contentType: 'text/plain',
      size: 1024,
      s3Key: null,
    },
  },

  /**
   * 검색 및 필터링 테스트 데이터
   */
  search: {
    queries: {
      customerName: '테스트',
      businessNumber: '123-45-67890',
      representativeName: '홍길동',
      email: 'customer@example.com',
      phone: '010-1234-5678',
      businessType: 'IT서비스',
      status: 'active',
    },
    filters: {
      status: ['active', 'inactive'],
      businessType: ['IT서비스', '제조업'],
      dateRange: {
        start: '2025-01-01',
        end: '2025-12-31',
      },
    },
    sortOptions: {
      name: 'asc',
      created_at: 'desc',
      updated_at: 'desc',
      business_number: 'asc',
    },
  },

  /**
   * 에러 시나리오 테스트 데이터
   */
  errors: {
    validation: {
      missingRequired: {
        name: '',
        business_number: '',
        email: '',
      },
      invalidFormat: {
        business_number: 'invalid-number',
        email: 'invalid-email',
        phone: 'invalid-phone',
      },
      duplicateBusinessNumber: {
        business_number: '123-45-67890',
      },
    },
    notFound: {
      customerId: 'non-existent-customer',
      contractId: 'non-existent-contract',
      opportunityId: 'non-existent-opportunity',
    },
    unauthorized: {
      userId: 'unauthorized-user',
      permissions: [],
    },
    serverError: {
      databaseConnection: 'Database connection failed',
      s3Upload: 'S3 upload failed',
      ocrProcessing: 'OCR processing failed',
    },
  },
} as const

/**
 * 테스트용 배열 데이터 생성 헬퍼
 */
export const createTestArrays = {
  customers: (count: number) => 
    Array.from({ length: count }, (_, i) => ({
      ...CRM_FIXTURES.customers.valid,
      id: `customer-${i + 1}`,
      name: `테스트 고객사 ${i + 1}`,
      business_number: `123-45-6789${i}`,
    })),

  contracts: (count: number) => 
    Array.from({ length: count }, (_, i) => ({
      ...CRM_FIXTURES.contracts.revenue,
      id: `contract-${i + 1}`,
      contract_number: `CON-2025-${String(i + 1).padStart(3, '0')}`,
      title: `계약 ${i + 1}`,
      total_amount: 10000000 * (i + 1),
    })),

  opportunities: (count: number) => 
    Array.from({ length: count }, (_, i) => ({
      ...CRM_FIXTURES.opportunities.open,
      id: `opportunity-${i + 1}`,
      title: `영업 기회 ${i + 1}`,
      value: 5000000 * (i + 1),
    })),
}

/**
 * 개별 Mock 객체들
 */
export const mockCustomer = {
  id: 'customer-1',
  companyCode: 'VWS',
  name: '테스트 고객사',
  businessNumber: '123-45-67890',
  representativeName: '김대표',
  contactPerson: '이담당',
  contactEmail: 'contact@test.com',
  contactPhone: '010-1234-5678',
  address: '서울시 강남구',
  type: 'customer',
  status: 'active',
  businessRegistrationS3Key: 's3://test-bucket/customer-1/business-reg.pdf',
  bankAccountS3Key: 's3://test-bucket/customer-1/bank-account.pdf',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

export const mockCustomers = [
  mockCustomer,
  {
    ...mockCustomer,
    id: 'customer-2',
    name: '두 번째 고객사',
  },
]

export const mockCrmStats = {
  totalCustomers: 25,
  totalActiveContracts: 18,
  expectedRevenueThisMonth: 15000000,
  openOpportunities: 7,
}
