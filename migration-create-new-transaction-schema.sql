-- 새로운 거래내역표 스키마 생성
-- 거래일시, 적요, 의뢰인/수취인, 입금, 출금, 거래잔액

-- 기존 테이블 삭제 (CASCADE로 외래키 제약 해제)
DROP TABLE IF EXISTS finance_transactions CASCADE

-- 새로운 거래 테이블 생성
CREATE TABLE finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES finance_accounts(id),
    category_id UUID NOT NULL REFERENCES finance_categories(id),
    
    -- 거래내역표 형식 컬럼들
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL, -- 거래일시
    description VARCHAR(500) NOT NULL, -- 적요
    counterparty VARCHAR(255), -- 의뢰인/수취인
    deposits DECIMAL(15,2) DEFAULT 0, -- 입금 (양수)
    withdrawals DECIMAL(15,2) DEFAULT 0, -- 출금 (양수)
    balance DECIMAL(15,2) DEFAULT 0, -- 거래후잔액
    
    -- 기존 컬럼들 (호환성 유지)
    amount DECIMAL(15,2) NOT NULL, -- 실제 거래 금액 (입금은 양수, 출금은 음수)
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    reference_number VARCHAR(100),
    notes TEXT,
    tags TEXT[], -- PostgreSQL 배열
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'yearly'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- 인덱스 생성
CREATE INDEX idx_finance_transactions_account_id ON finance_transactions(account_id)
CREATE INDEX idx_finance_transactions_category_id ON finance_transactions(category_id)
CREATE INDEX idx_finance_transactions_transaction_date ON finance_transactions(transaction_date)
CREATE INDEX idx_finance_transactions_type ON finance_transactions(type)
CREATE INDEX idx_finance_transactions_status ON finance_transactions(status)
CREATE INDEX idx_finance_transactions_deposits ON finance_transactions(deposits)
CREATE INDEX idx_finance_transactions_withdrawals ON finance_transactions(withdrawals)
CREATE INDEX idx_finance_transactions_balance ON finance_transactions(balance)
CREATE INDEX idx_finance_transactions_counterparty ON finance_transactions(counterparty)

-- 코멘트 추가
COMMENT ON TABLE finance_transactions IS '거래내역표'
COMMENT ON COLUMN finance_transactions.transaction_date IS '거래일시'
COMMENT ON COLUMN finance_transactions.description IS '적요'
COMMENT ON COLUMN finance_transactions.counterparty IS '의뢰인/수취인'
COMMENT ON COLUMN finance_transactions.deposits IS '입금액 (양수)'
COMMENT ON COLUMN finance_transactions.withdrawals IS '출금액 (양수)'
COMMENT ON COLUMN finance_transactions.balance IS '거래후잔액'
COMMENT ON COLUMN finance_transactions.amount IS '실제 거래 금액 (입금은 양수, 출금은 음수)'
