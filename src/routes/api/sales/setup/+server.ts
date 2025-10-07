import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 영업관리 시스템 스키마 SQL (상용화 목표 - 단순화)
const SALES_SCHEMA_SQL = `
-- 영업관리 시스템 데이터베이스 스키마 (상용화 목표 - 단순화)
-- PostgreSQL 기반

-- 거래처 테이블 (핵심 정보만)
CREATE TABLE IF NOT EXISTS sales_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'supplier', 'both')),
    business_number VARCHAR(20),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    address TEXT,
    industry VARCHAR(100),
    payment_terms INTEGER DEFAULT 30, -- 결제 조건 (일)
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 영업 기회 테이블 (단순화)
CREATE TABLE IF NOT EXISTS sales_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    customer_id UUID NOT NULL REFERENCES sales_customers(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('sales', 'purchase')),
    stage VARCHAR(20) NOT NULL CHECK (stage IN ('prospecting', 'proposal', 'negotiation', 'closed-won', 'closed-lost')),
    value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    owner_id VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계약 테이블 (핵심 정보만)
CREATE TABLE IF NOT EXISTS sales_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    customer_id UUID NOT NULL REFERENCES sales_customers(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('sales', 'purchase')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_terms INTEGER DEFAULT 30,
    description TEXT,
    owner_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래 내역 테이블 (매출/매입 - 핵심)
CREATE TABLE IF NOT EXISTS sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    contract_id UUID REFERENCES sales_contracts(id),
    customer_id UUID NOT NULL REFERENCES sales_customers(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('sales', 'purchase')),
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    transaction_date DATE NOT NULL,
    due_date DATE,
    payment_date DATE,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
    description TEXT,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 견적서 테이블 (2단계 - 선택 기능)
CREATE TABLE IF NOT EXISTS sales_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    customer_id UUID NOT NULL REFERENCES sales_customers(id),
    opportunity_id UUID REFERENCES sales_opportunities(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
    valid_until DATE,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    owner_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래명세서 테이블 (2단계 - 선택 기능)
CREATE TABLE IF NOT EXISTS sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    customer_id UUID NOT NULL REFERENCES sales_customers(id),
    contract_id UUID REFERENCES sales_contracts(id),
    quotation_id UUID REFERENCES sales_quotations(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('sales', 'purchase')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    issue_date DATE NOT NULL,
    due_date DATE,
    payment_date DATE,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    owner_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (핵심만)
CREATE INDEX IF NOT EXISTS idx_sales_customers_name ON sales_customers(name);
CREATE INDEX IF NOT EXISTS idx_sales_customers_type ON sales_customers(type);

CREATE INDEX IF NOT EXISTS idx_sales_opportunities_customer_id ON sales_opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_stage ON sales_opportunities(stage);

CREATE INDEX IF NOT EXISTS idx_sales_contracts_customer_id ON sales_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_status ON sales_contracts(status);

CREATE INDEX IF NOT EXISTS idx_sales_transactions_customer_id ON sales_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_type ON sales_transactions(type);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_transaction_date ON sales_transactions(transaction_date);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_sales_customers_updated_at BEFORE UPDATE ON sales_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_opportunities_updated_at BEFORE UPDATE ON sales_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_contracts_updated_at BEFORE UPDATE ON sales_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_transactions_updated_at BEFORE UPDATE ON sales_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_quotations_updated_at BEFORE UPDATE ON sales_quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_invoices_updated_at BEFORE UPDATE ON sales_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

// 샘플 데이터 생성 함수
async function createSampleData() {
  try {
    // 샘플 거래처 생성
    const sampleCustomers = [
      {
        name: 'ABC 테크놀로지',
        type: 'customer',
        contact_person: '김영희',
        contact_phone: '02-1234-5678',
        contact_email: 'kim@abctech.com',
        industry: 'IT/소프트웨어',
        payment_terms: 30,
        status: 'active',
      },
      {
        name: 'XYZ 제조',
        type: 'supplier',
        contact_person: '박민수',
        contact_phone: '02-9876-5432',
        contact_email: 'park@xyz.com',
        industry: '제조업',
        payment_terms: 15,
        status: 'active',
      },
      {
        name: 'DEF 스타트업',
        type: 'both',
        contact_person: '이지은',
        contact_phone: '02-5555-1234',
        contact_email: 'lee@defstartup.com',
        industry: '핀테크',
        payment_terms: 30,
        status: 'active',
      },
    ]

    const customerIds: string[] = []
    for (const customer of sampleCustomers) {
      const result = await query(
        `
        INSERT INTO sales_customers (name, type, contact_person, contact_phone, contact_email, industry, payment_terms, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
        `,
        [
          customer.name,
          customer.type,
          customer.contact_person,
          customer.contact_phone,
          customer.contact_email,
          customer.industry,
          customer.payment_terms,
          customer.status,
        ],
      )
      customerIds.push(result.rows[0].id)
    }

    // 샘플 영업 기회 생성
    const sampleOpportunities = [
      {
        title: 'ABC 테크놀로지 스마트팩토리 솔루션',
        customer_id: customerIds[0],
        type: 'sales',
        stage: 'proposal',
        value: 50000000,
        probability: 70,
        expected_close_date: '2024-02-15',
        owner_id: 'user-1',
        status: 'active',
      },
      {
        title: 'XYZ 제조 자동화 시스템',
        customer_id: customerIds[1],
        type: 'purchase',
        stage: 'negotiation',
        value: 30000000,
        probability: 50,
        expected_close_date: '2024-02-28',
        owner_id: 'user-1',
        status: 'active',
      },
    ]

    for (const opportunity of sampleOpportunities) {
      await query(
        `
        INSERT INTO sales_opportunities (title, customer_id, type, stage, value, probability, expected_close_date, owner_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          opportunity.title,
          opportunity.customer_id,
          opportunity.type,
          opportunity.stage,
          opportunity.value,
          opportunity.probability,
          opportunity.expected_close_date,
          opportunity.owner_id,
          opportunity.status,
        ],
      )
    }

    // 샘플 계약 생성
    const sampleContracts = [
      {
        contract_number: 'CON-2024-001',
        title: 'DEF 스타트업 핀테크 솔루션',
        customer_id: customerIds[2],
        type: 'sales',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        total_amount: 15000000,
        paid_amount: 5000000,
        payment_terms: 30,
        owner_id: 'user-1',
      },
    ]

    const contractIds: string[] = []
    for (const contract of sampleContracts) {
      const result = await query(
        `
        INSERT INTO sales_contracts (contract_number, title, customer_id, type, status, start_date, end_date, total_amount, paid_amount, payment_terms, owner_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
        `,
        [
          contract.contract_number,
          contract.title,
          contract.customer_id,
          contract.type,
          contract.status,
          contract.start_date,
          contract.end_date,
          contract.total_amount,
          contract.paid_amount,
          contract.payment_terms,
          contract.owner_id,
        ],
      )
      contractIds.push(result.rows[0].id)
    }

    // 샘플 거래 내역 생성
    const sampleTransactions = [
      {
        transaction_number: 'TXN-2024-001',
        contract_id: contractIds[0],
        customer_id: customerIds[2],
        type: 'sales',
        amount: 5000000,
        transaction_date: '2024-01-20',
        due_date: '2024-02-20',
        payment_date: '2024-01-25',
        payment_status: 'paid',
        description: '1차 계약금',
        created_by: 'user-1',
      },
      {
        transaction_number: 'TXN-2024-002',
        contract_id: contractIds[0],
        customer_id: customerIds[2],
        type: 'sales',
        amount: 10000000,
        transaction_date: '2024-02-01',
        due_date: '2024-03-01',
        payment_status: 'pending',
        description: '2차 계약금',
        created_by: 'user-1',
      },
    ]

    for (const transaction of sampleTransactions) {
      await query(
        `
        INSERT INTO sales_transactions (transaction_number, contract_id, customer_id, type, amount, transaction_date, due_date, payment_date, payment_status, description, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          transaction.transaction_number,
          transaction.contract_id,
          transaction.customer_id,
          transaction.type,
          transaction.amount,
          transaction.transaction_date,
          transaction.due_date,
          transaction.payment_date,
          transaction.payment_status,
          transaction.description,
          transaction.created_by,
        ],
      )
    }

    logger.info('영업관리 시스템 샘플 데이터 생성 완료')
  } catch (error) {
    logger.error('샘플 데이터 생성 실패:', error)
    throw error
  }
}

// 영업관리 시스템 초기화
export const POST: RequestHandler = async () => {
  try {
    // 스키마 실행
    await query(SALES_SCHEMA_SQL)

    // 샘플 데이터 생성
    await createSampleData()

    return json({
      success: true,
      message: '영업관리 시스템이 성공적으로 초기화되었습니다.',
    })
  } catch (error) {
    logger.error('영업관리 시스템 초기화 실패:', error)
    return json(
      {
        success: false,
        error: `영업관리 시스템 초기화에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}
