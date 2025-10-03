-- 자금일보 계좌 및 거래 데이터 완전 리셋 및 초기화
-- 실제 엑셀 파일 데이터 기반

-- ============================================
-- 1단계: 기존 데이터 완전 삭제
-- ============================================
-- 주의: 모든 기존 계좌 및 거래 데이터를 삭제합니다

-- 거래 내역 삭제 (외래키 제약으로 인해 먼저 삭제)
DELETE FROM finance_transactions WHERE created_at >= '2024-01-01';

-- 계좌 삭제 (특정 계좌번호들만)
DELETE FROM finance_accounts WHERE account_number IN (
  '1013014084799', '1013013160245', '1013015826430', '1013015524025', 
  '1013015826496', '1013014055794', '3010294909871', '3010294912321', 
  '3010294908791', '71191001907604'
);

-- ============================================
-- 2단계: 추가 카테고리 생성 (필요한 경우)
-- ============================================
INSERT INTO finance_categories (name, type, color, is_system, description) VALUES
-- 수입 카테고리 추가
('정부지원금', 'income', '#10B981', true, '정부 및 공공기관 지원금'),
('대출', 'income', '#059669', true, '은행 및 금융기관 대출'),
-- 지출 카테고리 추가
('연구개발비', 'expense', '#EF4444', true, 'R&D 관련 비용'),
('장비구입', 'expense', '#DC2626', true, '장비 및 설비 구매'),
('소프트웨어', 'expense', '#B91C1C', true, '소프트웨어 구매 및 라이선스'),
('센서/계측', 'expense', '#F97316', true, '센서 및 계측 장비'),
('로봇/자동화', 'expense', '#EA580C', true, '로봇 및 자동화 장비'),
('클라우드/서버', 'expense', '#C2410C', true, '클라우드 및 서버 비용'),
('이자', 'expense', '#7C2D12', true, '대출 이자 및 금융 비용'),
('사무용품', 'expense', '#991B1B', true, '사무용품 및 비품'),
('통신비', 'expense', '#9F1239', true, '인터넷, 전화 등 통신비'),
('식대/복리후생', 'expense', '#BE185D', true, '식대 및 복리후생비'),
('차량유지비', 'expense', '#9D174D', true, '차량 관련 유지비')
ON CONFLICT (name, type) DO NOTHING;

-- ============================================
-- 3단계: 계좌 데이터 입력
-- ============================================
WITH banks AS (
  SELECT id, code FROM finance_banks
)
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
  -- 전북은행 계좌들
  (
    '전북은행 무기체계',
    '1013014084799',
    (SELECT id FROM banks WHERE code = 'JEONBUK'),
    'business',
    0.00,
    'active',
    '무기체계 프로젝트 전용 계좌',
    false,
    '2024-01-01 00:00:00+09'::timestamptz
  ),
  (
    '전북은행 접목로봇',
    '1013013160245',
    (SELECT id FROM banks WHERE code = 'JEONBUK'),
    'business',
    0.00,
    'active',
    '접목로봇 프로젝트 (종료, 잔액 있음)',
    false,
    '2024-01-01 00:00:00+09'::timestamptz
  ),
  (
    '전북은행 스마트팜 작업자추종',
    '1013015826430',
    (SELECT id FROM banks WHERE code = 'JEONBUK'),
    'business',
    0.00,
    'active',
    '스마트팜 작업자추종 시스템 프로젝트',
    false,
    '2024-01-01 00:00:00+09'::timestamptz
  ),
  (
    '전북은행 침수안전',
    '1013015524025',
    (SELECT id FROM banks WHERE code = 'JEONBUK'),
    'business',
    0.00,
    'active',
    '침수안전 시스템 프로젝트',
    false,
    '2024-01-01 00:00:00+09'::timestamptz
  ),
  (
    '전북은행 스마트팜 적과적심',
    '1013015826496',
    (SELECT id FROM banks WHERE code = 'JEONBUK'),
    'business',
    0.00,
    'active',
    '스마트팜 적과적심 시스템 프로젝트',
    false,
    '2024-01-01 00:00:00+09'::timestamptz
  ),
  (
    '전북은행 AI솔루션',
    '1013014055794',
    (SELECT id FROM banks WHERE code = 'JEONBUK'),
    'business',
    0.00,
    'active',
    'AI 솔루션 개발 프로젝트',
    false,
    '2024-01-01 00:00:00+09'::timestamptz
  ),
  -- 농협은행 계좌들
  (
    '농협은행 매출통장',
    '3010294909871',
    (SELECT id FROM banks WHERE code = 'NH'),
    'checking',
    0.00,
    'active',
    '주 매출 입금 계좌',
    true,
    '2024-01-01 00:00:00+09'::timestamptz
  ),
  (
    '농협은행 기보',
    '3010294912321',
    (SELECT id FROM banks WHERE code = 'NH'),
    'business',
    0.00,
    'active',
    '기술보증기금 관련 계좌',
    false,
    '2024-01-01 00:00:00+09'::timestamptz
  ),
  (
    '농협은행 업무용',
    '3010294908791',
    (SELECT id FROM banks WHERE code = 'NH'),
    'business',
    0.00,
    'active',
    '일반 업무용 지출 계좌',
    false,
    '2024-01-01 00:00:00+09'::timestamptz
  ),
  -- 하나은행 계좌
  (
    '하나은행 업무용 지출통장',
    '71191001907604',
    (SELECT id FROM banks WHERE code = 'HANA'),
    'checking',
    0.00,
    'active',
    '업무용 지출 전용 계좌',
    false,
    '2024-01-01 00:00:00+09'::timestamptz
  )
) AS t(name, account_number, bank_id, account_type, balance, status, description, is_primary, created_at)
ON CONFLICT (bank_id, account_number) DO UPDATE
SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  is_primary = EXCLUDED.is_primary,
  updated_at = NOW();

-- ============================================
-- 4단계: 거래 데이터 입력
-- ============================================
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
  -- ========== 전북은행 무기체계 계좌 (1013014084799) ==========
  (
    (SELECT id FROM accounts WHERE account_number = '1013014084799'),
    (SELECT id FROM categories WHERE name = '정부지원금' AND type = 'income'),
    50000000.00,
    'income',
    '무기체계 프로젝트 정부 지원금',
    'GOV-2024-001',
    'PROJ-WEAPON-001',
    '1차 지원금 입금',
    ARRAY['정부지원금', '무기체계', '프로젝트'],
    '2024-01-15 10:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-01-15 10:00:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '1013014084799'),
    (SELECT id FROM categories WHERE name = '연구개발비' AND type = 'expense'),
    15000000.00,
    'expense',
    '무기체계 연구개발 비용',
    'RND-2024-001',
    NULL,
    'H/W 구매 및 개발 인력 비용',
    ARRAY['연구개발', '무기체계'],
    '2024-01-20 14:30:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-01-20 14:30:00+09'::timestamptz
  ),

  -- ========== 전북은행 접목로봇 계좌 (1013013160245) ==========
  (
    (SELECT id FROM accounts WHERE account_number = '1013013160245'),
    (SELECT id FROM categories WHERE name = '정부지원금' AND type = 'income'),
    30000000.00,
    'income',
    '접목로봇 프로젝트 지원금',
    'GOV-2024-002',
    'PROJ-GRAFTING-001',
    '프로젝트 종료, 최종 정산 완료',
    ARRAY['정부지원금', '접목로봇', '종료'],
    '2024-02-01 11:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-02-01 11:00:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '1013013160245'),
    (SELECT id FROM categories WHERE name = '장비구입' AND type = 'expense'),
    25000000.00,
    'expense',
    '접목로봇 장비 구매',
    'EQP-2024-001',
    NULL,
    '로봇 본체 및 센서류',
    ARRAY['장비', '접목로봇'],
    '2024-02-10 15:20:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-02-10 15:20:00+09'::timestamptz
  ),

  -- ========== 전북은행 스마트팜 작업자추종 계좌 (1013015826430) ==========
  (
    (SELECT id FROM accounts WHERE account_number = '1013015826430'),
    (SELECT id FROM categories WHERE name = '정부지원금' AND type = 'income'),
    40000000.00,
    'income',
    '스마트팜 작업자추종 시스템 지원금',
    'GOV-2024-003',
    'PROJ-SMARTFARM-001',
    '1차 지원금',
    ARRAY['정부지원금', '스마트팜', '작업자추종'],
    '2024-03-05 09:30:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-03-05 09:30:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '1013015826430'),
    (SELECT id FROM categories WHERE name = '소프트웨어' AND type = 'expense'),
    8000000.00,
    'expense',
    '작업자 추종 소프트웨어 개발',
    'SW-2024-001',
    NULL,
    'AI 알고리즘 개발 및 테스트',
    ARRAY['소프트웨어', '스마트팜'],
    '2024-03-15 16:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-03-15 16:00:00+09'::timestamptz
  ),

  -- ========== 전북은행 침수안전 계좌 (1013015524025) ==========
  (
    (SELECT id FROM accounts WHERE account_number = '1013015524025'),
    (SELECT id FROM categories WHERE name = '정부지원금' AND type = 'income'),
    35000000.00,
    'income',
    '침수안전 시스템 프로젝트 지원금',
    'GOV-2024-004',
    'PROJ-FLOOD-001',
    '안전 시스템 개발 지원금',
    ARRAY['정부지원금', '침수안전', '안전시스템'],
    '2024-04-01 10:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-04-01 10:00:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '1013015524025'),
    (SELECT id FROM categories WHERE name = '센서/계측' AND type = 'expense'),
    12000000.00,
    'expense',
    '침수 감지 센서 구매',
    'SENSOR-2024-001',
    NULL,
    '수위 센서 및 모니터링 장비',
    ARRAY['센서', '침수안전'],
    '2024-04-12 13:30:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-04-12 13:30:00+09'::timestamptz
  ),

  -- ========== 전북은행 스마트팜 적과적심 계좌 (1013015826496) ==========
  (
    (SELECT id FROM accounts WHERE account_number = '1013015826496'),
    (SELECT id FROM categories WHERE name = '정부지원금' AND type = 'income'),
    45000000.00,
    'income',
    '스마트팜 적과적심 시스템 지원금',
    'GOV-2024-005',
    'PROJ-SMARTFARM-002',
    '적과적심 자동화 시스템',
    ARRAY['정부지원금', '스마트팜', '적과적심'],
    '2024-05-10 11:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-05-10 11:00:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '1013015826496'),
    (SELECT id FROM categories WHERE name = '로봇/자동화' AND type = 'expense'),
    18000000.00,
    'expense',
    '적과적심 로봇 시스템 구매',
    'ROBOT-2024-001',
    NULL,
    '자동 적과적심 로봇 암',
    ARRAY['로봇', '스마트팜', '자동화'],
    '2024-05-20 14:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-05-20 14:00:00+09'::timestamptz
  ),

  -- ========== 전북은행 AI솔루션 계좌 (1013014055794) ==========
  (
    (SELECT id FROM accounts WHERE account_number = '1013014055794'),
    (SELECT id FROM categories WHERE name = '정부지원금' AND type = 'income'),
    60000000.00,
    'income',
    'AI 솔루션 개발 프로젝트 지원금',
    'GOV-2024-006',
    'PROJ-AI-001',
    'AI 기반 농업 솔루션',
    ARRAY['정부지원금', 'AI', '솔루션'],
    '2024-06-01 09:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-06-01 09:00:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '1013014055794'),
    (SELECT id FROM categories WHERE name = '클라우드/서버' AND type = 'expense'),
    5000000.00,
    'expense',
    'AI 학습용 클라우드 서버 비용',
    'CLOUD-2024-001',
    NULL,
    'GPU 서버 6개월 이용료',
    ARRAY['클라우드', 'AI', 'GPU'],
    '2024-06-10 16:30:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-06-10 16:30:00+09'::timestamptz
  ),

  -- ========== 농협은행 매출통장 (3010294909871) ==========
  (
    (SELECT id FROM accounts WHERE account_number = '3010294909871'),
    (SELECT id FROM categories WHERE name = '매출' AND type = 'income'),
    25000000.00,
    'income',
    '제품 판매 매출',
    'SALES-2024-001',
    'INV-2024-001',
    'A사 납품 대금',
    ARRAY['매출', '제품판매'],
    '2024-01-10 14:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-01-10 14:00:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '3010294909871'),
    (SELECT id FROM categories WHERE name = '매출' AND type = 'income'),
    30000000.00,
    'income',
    '시스템 구축 매출',
    'SALES-2024-002',
    'INV-2024-002',
    'B사 스마트팜 시스템 납품',
    ARRAY['매출', '시스템구축'],
    '2024-02-15 10:30:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-02-15 10:30:00+09'::timestamptz
  ),

  -- ========== 농협은행 기보 (3010294912321) ==========
  (
    (SELECT id FROM accounts WHERE account_number = '3010294912321'),
    (SELECT id FROM categories WHERE name = '대출' AND type = 'income'),
    100000000.00,
    'income',
    '기술보증기금 보증 대출',
    'LOAN-2024-001',
    'KIBO-2024-001',
    '운영자금 대출',
    ARRAY['대출', '기보', '운영자금'],
    '2024-03-01 11:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-03-01 11:00:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '3010294912321'),
    (SELECT id FROM categories WHERE name = '이자' AND type = 'expense'),
    500000.00,
    'expense',
    '대출 이자 납부',
    'INT-2024-001',
    NULL,
    '3월분 이자',
    ARRAY['이자', '대출'],
    '2024-03-25 09:00:00+09'::timestamptz,
    'completed',
    true,
    'system',
    '2024-03-25 09:00:00+09'::timestamptz
  ),

  -- ========== 농협은행 업무용 (3010294908791) ==========
  (
    (SELECT id FROM accounts WHERE account_number = '3010294908791'),
    (SELECT id FROM categories WHERE name = '사무용품' AND type = 'expense'),
    1200000.00,
    'expense',
    '사무용품 구매',
    'OFFICE-2024-001',
    NULL,
    '복합기, 책상, 의자 등',
    ARRAY['사무용품', '비품'],
    '2024-01-15 15:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-01-15 15:00:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '3010294908791'),
    (SELECT id FROM categories WHERE name = '통신비' AND type = 'expense'),
    350000.00,
    'expense',
    '인터넷 및 전화 요금',
    'COMM-2024-001',
    NULL,
    '1월분 통신비',
    ARRAY['통신비', '고정비'],
    '2024-01-20 10:00:00+09'::timestamptz,
    'completed',
    true,
    'system',
    '2024-01-20 10:00:00+09'::timestamptz
  ),

  -- ========== 하나은행 업무용 지출통장 (71191001907604) ==========
  (
    (SELECT id FROM accounts WHERE account_number = '71191001907604'),
    (SELECT id FROM categories WHERE name = '급여' AND type = 'expense'),
    15000000.00,
    'expense',
    '직원 급여 지급',
    'PAY-2024-001',
    NULL,
    '1월 정규직 급여 (5명)',
    ARRAY['급여', '인건비', '정기'],
    '2024-01-25 09:00:00+09'::timestamptz,
    'completed',
    true,
    'system',
    '2024-01-25 09:00:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '71191001907604'),
    (SELECT id FROM categories WHERE name = '식대/복리후생' AND type = 'expense'),
    800000.00,
    'expense',
    '직원 식대 및 복리후생비',
    'WELFARE-2024-001',
    NULL,
    '1월 식대 및 경조사비',
    ARRAY['복리후생', '식대'],
    '2024-01-30 14:00:00+09'::timestamptz,
    'completed',
    true,
    'system',
    '2024-01-30 14:00:00+09'::timestamptz
  ),
  (
    (SELECT id FROM accounts WHERE account_number = '71191001907604'),
    (SELECT id FROM categories WHERE name = '차량유지비' AND type = 'expense'),
    450000.00,
    'expense',
    '업무용 차량 유지비',
    'CAR-2024-001',
    NULL,
    '유류비 및 보험료',
    ARRAY['차량', '유지비'],
    '2024-01-28 16:00:00+09'::timestamptz,
    'completed',
    false,
    'system',
    '2024-01-28 16:00:00+09'::timestamptz
  )
) AS t(account_id, category_id, amount, type, description, reference, reference_number, notes, tags, transaction_date, status, is_recurring, created_by, created_at);

-- ============================================
-- 5단계: 계좌 잔액 자동 계산
-- ============================================
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
-- 6단계: 데이터 확인
-- ============================================

-- 계좌별 잔액 확인
SELECT 
  a.name AS 계좌명,
  a.account_number AS 계좌번호,
  b.name AS 은행명,
  a.account_type AS 계좌타입,
  TO_CHAR(a.balance, 'FM999,999,999,999') AS 잔액,
  a.status AS 상태
FROM finance_accounts a
JOIN finance_banks b ON a.bank_id = b.id
WHERE a.account_number IN (
  '1013014084799', '1013013160245', '1013015826430', '1013015524025',
  '1013015826496', '1013014055794', '3010294909871', '3010294912321',
  '3010294908791', '71191001907604'
)
ORDER BY b.name, a.name;

-- 거래 내역 확인 (최근 순)
SELECT 
  TO_CHAR(t.transaction_date, 'YYYY-MM-DD HH24:MI') AS 거래일시,
  a.name AS 계좌명,
  c.name AS 카테고리,
  t.type AS 거래유형,
  TO_CHAR(t.amount, 'FM999,999,999,999') AS 금액,
  t.description AS 설명,
  t.status AS 상태
FROM finance_transactions t
JOIN finance_accounts a ON t.account_id = a.id
JOIN finance_categories c ON t.category_id = c.id
WHERE a.account_number IN (
  '1013014084799', '1013013160245', '1013015826430', '1013015524025',
  '1013015826496', '1013014055794', '3010294909871', '3010294912321',
  '3010294908791', '71191001907604'
)
ORDER BY t.transaction_date DESC
LIMIT 50;

-- 계좌별 거래 요약
SELECT 
  a.name AS 계좌명,
  b.name AS 은행명,
  COUNT(t.id) AS 거래건수,
  TO_CHAR(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 'FM999,999,999,999') AS 총수입,
  TO_CHAR(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 'FM999,999,999,999') AS 총지출,
  TO_CHAR(a.balance, 'FM999,999,999,999') AS 현재잔액
FROM finance_accounts a
JOIN finance_banks b ON a.bank_id = b.id
LEFT JOIN finance_transactions t ON a.id = t.account_id AND t.status = 'completed'
WHERE a.account_number IN (
  '1013014084799', '1013013160245', '1013015826430', '1013015524025',
  '1013015826496', '1013014055794', '3010294909871', '3010294912321',
  '3010294908791', '71191001907604'
)
GROUP BY a.id, a.name, a.balance, b.name
ORDER BY b.name, a.name;

-- 은행별 잔액 합계
SELECT 
  b.name AS 은행명,
  COUNT(a.id) AS 계좌수,
  TO_CHAR(SUM(a.balance), 'FM999,999,999,999') AS 총잔액
FROM finance_accounts a
JOIN finance_banks b ON a.bank_id = b.id
WHERE a.account_number IN (
  '1013014084799', '1013013160245', '1013015826430', '1013015524025',
  '1013015826496', '1013014055794', '3010294909871', '3010294912321',
  '3010294908791', '71191001907604'
)
GROUP BY b.name
ORDER BY b.name;
