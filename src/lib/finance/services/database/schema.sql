-- 자금일보 시스템 데이터베이스 스키마
-- PostgreSQL 기반

-- 은행 테이블
CREATE TABLE IF NOT EXISTS finance_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래 카테고리 테이블
CREATE TABLE IF NOT EXISTS finance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
    parent_id UUID REFERENCES finance_categories(id),
    color VARCHAR(7) DEFAULT '#6B7280',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계좌 테이블
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_id UUID NOT NULL REFERENCES finance_banks(id),
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'business', 'investment', 'loan')),
    balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'closed')),
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    alert_threshold DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bank_id, account_number)
);

-- 거래 테이블
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES finance_accounts(id),
    category_id UUID NOT NULL REFERENCES finance_categories(id),
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    description VARCHAR(500) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    tags TEXT[], -- PostgreSQL 배열
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern JSONB, -- 정기 거래 패턴
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 예산 테이블
CREATE TABLE IF NOT EXISTS finance_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'investment')),
    period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
    year INTEGER NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12),
    quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
    category_id UUID REFERENCES finance_categories(id),
    account_id UUID REFERENCES finance_accounts(id),
    planned_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    description TEXT,
    tags TEXT[],
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 자금일보 테이블
CREATE TABLE IF NOT EXISTS finance_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
    opening_balance DECIMAL(15,2) DEFAULT 0.00,
    closing_balance DECIMAL(15,2) DEFAULT 0.00,
    total_inflow DECIMAL(15,2) DEFAULT 0.00,
    total_outflow DECIMAL(15,2) DEFAULT 0.00,
    net_flow DECIMAL(15,2) DEFAULT 0.00,
    transaction_count INTEGER DEFAULT 0,
    account_summaries JSONB, -- 계좌별 요약
    category_summaries JSONB, -- 카테고리별 요약
    alerts JSONB, -- 알림 사항
    notes TEXT,
    generated_at TIMESTAMP WITH TIME ZONE,
    generated_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 자금 알림 테이블
CREATE TABLE IF NOT EXISTS finance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(30) NOT NULL CHECK (type IN ('low_balance', 'high_expense', 'budget_exceeded', 'unusual_transaction')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    account_id UUID REFERENCES finance_accounts(id),
    transaction_id UUID REFERENCES finance_transactions(id),
    budget_id UUID REFERENCES finance_budgets(id),
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_finance_accounts_bank_id ON finance_accounts(bank_id);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_status ON finance_accounts(status);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_is_primary ON finance_accounts(is_primary);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_account_id ON finance_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category_id ON finance_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON finance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_status ON finance_transactions(status);

CREATE INDEX IF NOT EXISTS idx_finance_budgets_period ON finance_budgets(period, year, month, quarter);
CREATE INDEX IF NOT EXISTS idx_finance_budgets_category_id ON finance_budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_budgets_account_id ON finance_budgets(account_id);

CREATE INDEX IF NOT EXISTS idx_finance_daily_reports_date ON finance_daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_finance_daily_reports_status ON finance_daily_reports(status);

CREATE INDEX IF NOT EXISTS idx_finance_alerts_type ON finance_alerts(type);
CREATE INDEX IF NOT EXISTS idx_finance_alerts_severity ON finance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_finance_alerts_is_read ON finance_alerts(is_read);

-- 트리거 함수: 계좌 잔액 자동 업데이트
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'income' OR NEW.type = 'adjustment' THEN
            UPDATE finance_accounts
            SET balance = balance + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE finance_accounts
            SET balance = balance - NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 기존 거래 취소
        IF OLD.type = 'income' OR OLD.type = 'adjustment' THEN
            UPDATE finance_accounts
            SET balance = balance - OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE finance_accounts
            SET balance = balance + OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.account_id;
        END IF;

        -- 새 거래 적용
        IF NEW.type = 'income' OR NEW.type = 'adjustment' THEN
            UPDATE finance_accounts
            SET balance = balance + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE finance_accounts
            SET balance = balance - NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'income' OR OLD.type = 'adjustment' THEN
            UPDATE finance_accounts
            SET balance = balance - OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE finance_accounts
            SET balance = balance + OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_account_balance ON finance_transactions;
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON finance_transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- 기본 데이터 삽입
INSERT INTO finance_banks (name, code, color) VALUES
('하나은행', 'HANA', '#0066CC'),
('전북은행', 'JEONBUK', '#FF6B35'),
('농협은행', 'NH', '#00A651')
ON CONFLICT (code) DO NOTHING;

-- 대출 테이블
CREATE TABLE IF NOT EXISTS finance_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'execution' or 'repayment'
    amount NUMERIC(15, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL, -- Annual interest rate percentage
    term_months INTEGER NOT NULL, -- Loan term in months
    planned_date DATE NOT NULL,
    actual_date DATE,
    description TEXT NOT NULL,
    account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planned', -- 'planned', 'executed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 이메일 수신자 테이블
CREATE TABLE IF NOT EXISTS finance_email_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'Other', -- CEO, CFO, Accountant, Manager, Other
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notification_settings JSONB NOT NULL DEFAULT '{
        "dailyReport": true,
        "weeklyReport": true,
        "monthlyReport": true,
        "budgetAlerts": true,
        "emergencyAlerts": true
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 카테고리 삽입
INSERT INTO finance_categories (name, type, color, is_system) VALUES
-- 수입 카테고리
('매출', 'income', '#10B981', true),
('투자수익', 'income', '#059669', true),
('기타수입', 'income', '#047857', true),
-- 지출 카테고리
('급여', 'expense', '#EF4444', true),
('임대료', 'expense', '#F59E0B', true),
('공과금', 'expense', '#D97706', true),
('보험료', 'expense', '#B45309', true),
('대출상환', 'expense', '#92400E', true),
('사무용품', 'expense', '#8B5CF6', true),
('통신비', 'expense', '#7C3AED', true),
('교통비', 'expense', '#6D28D9', true),
('식비', 'expense', '#5B21B6', true),
('광고비', 'expense', '#EC4899', true),
('세금', 'expense', '#6B7280', true),
('기타지출', 'expense', '#4B5563', true),
-- 이체 카테고리
('계좌이체', 'transfer', '#3B82F6', true),
-- 조정 카테고리
('잔액조정', 'adjustment', '#6B7280', true)
ON CONFLICT DO NOTHING;
