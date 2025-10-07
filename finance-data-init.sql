-- 자금일보 계좌 및 거래 데이터 초기화
-- 사용법: 이 파일의 샘플 데이터를 실제 데이터로 교체하여 사용하세요.

-- ============================================
-- 1단계: 기존 데이터 초기화 (선택사항)
-- ============================================
-- 거래 내역 먼저 삭제 (외래키 제약 때문에)
-- DELETE FROM finance_transactions;
-- DELETE FROM finance_accounts;

-- ============================================
-- 2단계: 계좌 데이터 입력
-- ============================================
-- 포맷 설명:
-- - id: UUID (gen_random_uuid() 또는 직접 지정)
-- - name: 계좌명
-- - account_number: 계좌번호
-- - bank_id: 은행 ID (finance_banks 테이블의 id)
-- - account_type: 'checking', 'savings', 'business', 'investment', 'loan' 중 하나
-- - balance: 초기 잔액 (0으로 설정 권장 - 거래 내역으로 잔액이 자동 계산됨)
-- - status: 'active', 'inactive', 'suspended', 'closed' 중 하나
-- - description: 설명 (선택사항)
-- - is_primary: 주 거래 계좌 여부
-- - created_at: 생성일시

-- 먼저 은행 코드로 은행 ID를 조회합니다
WITH banks AS (
  SELECT id, code FROM finance_banks
)
-- 계좌 데이터 삽입
INSERT INTO finance_accounts (
  name,
  account_number,
  bank_id,
  account_type,
  balance,
  status,
  description,
  is_primary,
  created_at
)
SELECT * FROM (VALUES
  -- 샘플 데이터 없음 - 사용자가 직접 계좌를 추가해야 함
  -- 아래는 예시 형식입니다:
  -- (계좌명, 계좌번호, (은행코드로 ID 조회), 계좌타입, 잔액, 상태, 설명, 주계좌여부, 생성일시)
  -- (
  --   '하나은행 주거래계좌',
  --   '123-456-789012',
  --   (SELECT id FROM banks WHERE code = 'HANA'),
  --   'checking',
  --   0.00,
  --   'active',
  --   '월급 수령 및 주 거래용 계좌',
  --   true,
  --   '2024-01-01 00:00:00+09'::timestamptz
  -- )
  NULL::text, NULL::text, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::text, NULL::boolean, NULL::timestamptz
) AS t(name, account_number, bank_id, account_type, balance, status, description, is_primary, created_at)
WHERE name IS NOT NULL
ON CONFLICT (bank_id, account_number) DO UPDATE
SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  is_primary = EXCLUDED.is_primary,
  updated_at = NOW();


-- ============================================
-- 3단계: 거래 데이터 입력
-- ============================================
-- 포맷 설명:
-- - id: UUID (자동 생성 또는 직접 지정)
-- - account_id: 계좌 ID (finance_accounts 테이블의 id)
-- - category_id: 카테고리 ID (finance_categories 테이블의 id)
-- - amount: 금액 (양수 값)
-- - type: 'income', 'expense', 'transfer', 'adjustment' 중 하나
-- - description: 거래 설명
-- - reference: 참조 번호 (선택사항)
-- - reference_number: 참조 번호 2 (선택사항)
-- - notes: 메모 (선택사항)
-- - tags: 태그 배열 (선택사항)
-- - transaction_date: 거래 일시 (TIMESTAMP WITH TIME ZONE)
-- - status: 'pending', 'completed', 'cancelled', 'failed' 중 하나
-- - is_recurring: 반복 거래 여부
-- - created_by: 생성자 (선택사항)

WITH 
  accounts AS (SELECT id, account_number FROM finance_accounts),
  categories AS (SELECT id, name, type FROM finance_categories)
INSERT INTO finance_transactions (
  account_id,
  category_id,
  amount,
  type,
  description,
  reference,
  reference_number,
  notes,
  tags,
  transaction_date,
  status,
  is_recurring,
  created_by,
  created_at
)
SELECT * FROM (VALUES
  -- 샘플 거래 데이터 없음 - 필요시 직접 추가
  NULL::uuid, NULL::uuid, NULL::numeric, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text[], NULL::timestamptz, NULL::text, NULL::boolean, NULL::text, NULL::timestamptz
) AS t(account_id, category_id, amount, type, description, reference, reference_number, notes, tags, transaction_date, status, is_recurring, created_by, created_at)
WHERE account_id IS NOT NULL;


-- ============================================
-- 4단계: 계좌 잔액 자동 계산 (선택사항)
-- ============================================
-- 모든 거래 내역을 기반으로 계좌 잔액을 자동으로 계산합니다.
-- 주의: 이 쿼리는 기존 잔액을 덮어씁니다.

UPDATE finance_accounts a
SET 
  balance = COALESCE((
    SELECT 
      SUM(
        CASE 
          WHEN t.type = 'income' THEN t.amount
          WHEN t.type = 'expense' THEN -t.amount
          ELSE 0
        END
      )
    FROM finance_transactions t
    WHERE t.account_id = a.id
      AND t.status = 'completed'
  ), 0),
  updated_at = NOW();


-- ============================================
-- 5단계: 데이터 확인
-- ============================================
-- 계좌별 잔액 확인
SELECT 
  a.name AS 계좌명,
  a.account_number AS 계좌번호,
  b.name AS 은행명,
  a.account_type AS 계좌타입,
  a.balance AS 잔액,
  a.status AS 상태
FROM finance_accounts a
JOIN finance_banks b ON a.bank_id = b.id
ORDER BY a.created_at;

-- 거래 내역 확인
SELECT 
  t.transaction_date AS 거래일시,
  a.name AS 계좌명,
  c.name AS 카테고리,
  t.type AS 거래유형,
  t.amount AS 금액,
  t.description AS 설명,
  t.status AS 상태
FROM finance_transactions t
JOIN finance_accounts a ON t.account_id = a.id
JOIN finance_categories c ON t.category_id = c.id
ORDER BY t.transaction_date DESC;

-- 계좌별 거래 요약
SELECT 
  a.name AS 계좌명,
  COUNT(t.id) AS 거래건수,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS 총수입,
  SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS 총지출,
  a.balance AS 현재잔액
FROM finance_accounts a
LEFT JOIN finance_transactions t ON a.account_id = t.account_id
GROUP BY a.id, a.name, a.balance
ORDER BY a.created_at;

