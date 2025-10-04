-- 거래내역표 형식 업데이트 마이그레이션
-- 거래일시, 적요, 의뢰인/수취인, 입금, 출금, 거래잔액

-- 1. 의뢰인/수취인 컬럼 추가
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS counterparty VARCHAR(255)

-- 2. 입금 컬럼 추가
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS deposits DECIMAL(15,2) DEFAULT 0

-- 3. 출금 컬럼 추가  
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS withdrawals DECIMAL(15,2) DEFAULT 0

-- 4. 거래후잔액 컬럼 추가
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0

-- 5. 기존 데이터 마이그레이션
-- amount > 0 이면 입금, amount < 0 이면 출금으로 분리
UPDATE finance_transactions 
SET 
    deposits = CASE WHEN amount > 0 THEN amount ELSE 0 END,
    withdrawals = CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END
WHERE deposits = 0 AND withdrawals = 0

-- 6. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_finance_transactions_deposits ON finance_transactions(deposits)

CREATE INDEX IF NOT EXISTS idx_finance_transactions_withdrawals ON finance_transactions(withdrawals)

CREATE INDEX IF NOT EXISTS idx_finance_transactions_balance ON finance_transactions(balance)

CREATE INDEX IF NOT EXISTS idx_finance_transactions_counterparty ON finance_transactions(counterparty)

-- 7. 코멘트 추가
COMMENT ON COLUMN finance_transactions.counterparty IS '의뢰인/수취인'

COMMENT ON COLUMN finance_transactions.deposits IS '입금액 (양수)'

COMMENT ON COLUMN finance_transactions.withdrawals IS '출금액 (양수)'

COMMENT ON COLUMN finance_transactions.balance IS '거래후잔액'
