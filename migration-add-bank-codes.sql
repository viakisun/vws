-- 은행 코드 enum 타입 추가
CREATE TYPE bank_code AS ENUM ('1001', '1002', '1003');

-- finance_banks 테이블에 bank_code 컬럼 추가
ALTER TABLE finance_banks ADD COLUMN IF NOT EXISTS bank_code bank_code;

-- 기존 데이터에 은행 코드 업데이트
UPDATE finance_banks SET bank_code = '1001' WHERE name = '하나은행';
UPDATE finance_banks SET bank_code = '1002' WHERE name = '농협';

-- 새로운 은행 데이터 추가
INSERT INTO finance_banks (name, code, bank_code, created_at, updated_at) 
VALUES ('전북은행', 'JB', '1003', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- finance_accounts 테이블에 bank_code 컬럼 추가 (참조용)
ALTER TABLE finance_accounts ADD COLUMN IF NOT EXISTS bank_code bank_code;

-- 기존 계좌 데이터에 bank_code 업데이트
UPDATE finance_accounts 
SET bank_code = b.bank_code
FROM finance_banks b
WHERE finance_accounts.bank_id = b.id;

-- 코멘트 추가
COMMENT ON TYPE bank_code IS '은행 코드: 1001(하나), 1002(농협), 1003(전북)';
COMMENT ON COLUMN finance_banks.bank_code IS '은행 코드 (enum)';
COMMENT ON COLUMN finance_accounts.bank_code IS '은행 코드 (참조용)';
