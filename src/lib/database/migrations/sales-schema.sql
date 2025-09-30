-- 영업관리 시스템 데이터베이스 스키마
-- PostgreSQL 기반

-- 거래처 테이블
CREATE TABLE IF NOT EXISTS sales_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'supplier', 'both')),
    business_number VARCHAR(20) UNIQUE,
    ceo_name VARCHAR(100),
    industry VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    contact_person VARCHAR(100),
    contact_position VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    payment_terms INTEGER DEFAULT 30, -- 결제 조건 (일)
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 영업 기회 테이블
CREATE TABLE IF NOT EXISTS sales_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    customer_id UUID NOT NULL REFERENCES sales_customers(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('sales', 'purchase')),
    stage VARCHAR(20) NOT NULL CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost')),
    value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    owner_id VARCHAR(100), -- 담당자 ID
    source VARCHAR(100), -- 영업 기회 출처
    description TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계약 테이블
CREATE TABLE IF NOT EXISTS sales_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    customer_id UUID NOT NULL REFERENCES sales_customers(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('sales', 'purchase')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'expired')),
    start_date DATE NOT NULL,
    end_date DATE,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    remaining_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_terms INTEGER DEFAULT 30,
    payment_method VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'KRW',
    tax_rate DECIMAL(5,2) DEFAULT 10.00,
    description TEXT,
    terms_and_conditions TEXT,
    owner_id VARCHAR(100),
    signed_by VARCHAR(100),
    signed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계약 항목 테이블
CREATE TABLE IF NOT EXISTS sales_contract_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES sales_contracts(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1.00,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 10.00,
    delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래 내역 테이블 (매출/매입)
CREATE TABLE IF NOT EXISTS sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    contract_id UUID REFERENCES sales_contracts(id),
    customer_id UUID NOT NULL REFERENCES sales_customers(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('sales', 'purchase')),
    category VARCHAR(50), -- 매출/매입 카테고리
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'KRW',
    transaction_date DATE NOT NULL,
    due_date DATE,
    payment_date DATE,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
    description TEXT,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 견적서 테이블 (2단계용)
CREATE TABLE IF NOT EXISTS sales_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    customer_id UUID NOT NULL REFERENCES sales_customers(id),
    opportunity_id UUID REFERENCES sales_opportunities(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    valid_until DATE,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 10.00,
    currency VARCHAR(10) DEFAULT 'KRW',
    description TEXT,
    terms_and_conditions TEXT,
    owner_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 견적서 항목 테이블
CREATE TABLE IF NOT EXISTS sales_quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES sales_quotations(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1.00,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래명세서 테이블 (2단계용)
CREATE TABLE IF NOT EXISTS sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    customer_id UUID NOT NULL REFERENCES sales_customers(id),
    contract_id UUID REFERENCES sales_contracts(id),
    quotation_id UUID REFERENCES sales_quotations(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('sales', 'purchase')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    issue_date DATE NOT NULL,
    due_date DATE,
    payment_date DATE,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'KRW',
    description TEXT,
    notes TEXT,
    owner_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래명세서 항목 테이블
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1.00,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sales_customers_name ON sales_customers(name);
CREATE INDEX IF NOT EXISTS idx_sales_customers_type ON sales_customers(type);
CREATE INDEX IF NOT EXISTS idx_sales_customers_status ON sales_customers(status);

CREATE INDEX IF NOT EXISTS idx_sales_opportunities_customer_id ON sales_opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_stage ON sales_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_status ON sales_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_expected_close_date ON sales_opportunities(expected_close_date);

CREATE INDEX IF NOT EXISTS idx_sales_contracts_customer_id ON sales_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_status ON sales_contracts(status);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_start_date ON sales_contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_end_date ON sales_contracts(end_date);

CREATE INDEX IF NOT EXISTS idx_sales_contract_items_contract_id ON sales_contract_items(contract_id);

CREATE INDEX IF NOT EXISTS idx_sales_transactions_customer_id ON sales_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_contract_id ON sales_transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_type ON sales_transactions(type);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_transaction_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_payment_status ON sales_transactions(payment_status);

CREATE INDEX IF NOT EXISTS idx_sales_quotations_customer_id ON sales_quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_status ON sales_quotations(status);

CREATE INDEX IF NOT EXISTS idx_sales_quotation_items_quotation_id ON sales_quotation_items(quotation_id);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_issue_date ON sales_invoices(issue_date);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice_id ON sales_invoice_items(invoice_id);

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
CREATE TRIGGER update_sales_contract_items_updated_at BEFORE UPDATE ON sales_contract_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_transactions_updated_at BEFORE UPDATE ON sales_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_quotations_updated_at BEFORE UPDATE ON sales_quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_quotation_items_updated_at BEFORE UPDATE ON sales_quotation_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_invoices_updated_at BEFORE UPDATE ON sales_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_invoice_items_updated_at BEFORE UPDATE ON sales_invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
