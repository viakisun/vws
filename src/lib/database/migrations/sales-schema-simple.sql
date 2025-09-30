-- 영업관리 시스템 데이터베이스 스키마 (상용화 목표 - 단순화)
-- PostgreSQL 기반

-- 거래처 테이블 (핵심 정보만)
CREATE TABLE IF NOT EXISTS sales_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) DEFAULT 'customer' CHECK (type IN ('customer', 'supplier', 'both')),
    business_number VARCHAR(20) NOT NULL, -- 사업자번호 (필수)
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
