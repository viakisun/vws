-- 재무관리 시스템 초기 데이터 설정
-- 은행 정보 삽입
INSERT INTO banks (name, code) VALUES
('하나은행', '081'),
('전북은행', '037'),
('농협', '011')
ON CONFLICT (code) DO NOTHING;

-- 거래 카테고리 삽입
INSERT INTO transaction_categories (name, type, description) VALUES
-- 유입 카테고리
('매출', 'inflow', '제품/서비스 판매 수익'),
('투자수익', 'inflow', '투자로 인한 수익'),
('정부지원금', 'inflow', '정부 지원금 및 보조금'),
('기타수입', 'inflow', '기타 수입 항목'),
-- 유출 카테고리
('급여', 'outflow', '직원 급여 지급'),
('운영비', 'outflow', '사무실 임대료, 전기세 등'),
('마케팅비', 'outflow', '광고 및 마케팅 비용'),
('연구개발비', 'outflow', 'R&D 관련 비용'),
('세금', 'outflow', '법인세, 부가세 등'),
('기타지출', 'outflow', '기타 지출 항목')
ON CONFLICT (name) DO NOTHING;

-- 하나은행 계좌 (4개)
INSERT INTO accounts (bank_id, account_name, account_number, account_type, balance) VALUES
((SELECT id FROM banks WHERE code = '081'), '주거래계좌', '123-456-789012', 'checking', 50000000),
((SELECT id FROM banks WHERE code = '081'), '급여계좌', '123-456-789013', 'checking', 30000000),
((SELECT id FROM banks WHERE code = '081'), '투자계좌', '123-456-789014', 'investment', 20000000),
((SELECT id FROM banks WHERE code = '081'), '예비자금계좌', '123-456-789015', 'savings', 10000000);

-- 전북은행 계좌 (6개)
INSERT INTO accounts (bank_id, account_name, account_number, account_type, balance) VALUES
((SELECT id FROM banks WHERE code = '037'), '운영비계좌', '456-789-123456', 'checking', 15000000),
((SELECT id FROM banks WHERE code = '037'), '마케팅계좌', '456-789-123457', 'checking', 8000000),
((SELECT id FROM banks WHERE code = '037'), '연구개발계좌', '456-789-123458', 'checking', 25000000),
((SELECT id FROM banks WHERE code = '037'), '세금계좌', '456-789-123459', 'checking', 5000000),
((SELECT id FROM banks WHERE code = '037'), '단기예금', '456-789-123460', 'savings', 30000000),
((SELECT id FROM banks WHERE code = '037'), '장기예금', '456-789-123461', 'savings', 50000000);

-- 농협 계좌 (3개)
INSERT INTO accounts (bank_id, account_name, account_number, account_type, balance) VALUES
((SELECT id FROM banks WHERE code = '011'), '농협주거래', '789-012-345678', 'checking', 40000000),
((SELECT id FROM banks WHERE code = '011'), '농협저축', '789-012-345679', 'savings', 60000000),
((SELECT id FROM banks WHERE code = '011'), '농협투자', '789-012-345680', 'investment', 35000000);

-- 샘플 거래 내역 (최근 30일)
INSERT INTO transactions (account_id, category_id, amount, description, transaction_date, transaction_time, reference_number) VALUES
-- 하나은행 주거래계좌 거래
((SELECT id FROM accounts WHERE account_number = '123-456-789012'), (SELECT id FROM transaction_categories WHERE name = '매출'), 5000000, 'ABC 테크놀로지 계약금', CURRENT_DATE - INTERVAL '1 day', '09:30:00', 'TXN001'),
((SELECT id FROM accounts WHERE account_number = '123-456-789012'), (SELECT id FROM transaction_categories WHERE name = '매출'), 3000000, 'XYZ 솔루션 프로젝트', CURRENT_DATE - INTERVAL '2 days', '14:20:00', 'TXN002'),
((SELECT id FROM accounts WHERE account_number = '123-456-789012'), (SELECT id FROM transaction_categories WHERE name = '운영비'), -1500000, '사무실 임대료', CURRENT_DATE - INTERVAL '3 days', '10:00:00', 'TXN003'),

-- 하나은행 급여계좌 거래
((SELECT id FROM accounts WHERE account_number = '123-456-789013'), (SELECT id FROM transaction_categories WHERE name = '급여'), -3000000, '1월 급여 지급', CURRENT_DATE - INTERVAL '1 day', '10:00:00', 'TXN004'),
((SELECT id FROM accounts WHERE account_number = '123-456-789013'), (SELECT id FROM transaction_categories WHERE name = '급여'), -2800000, '12월 급여 지급', CURRENT_DATE - INTERVAL '15 days', '10:00:00', 'TXN005'),

-- 하나은행 투자계좌 거래
((SELECT id FROM accounts WHERE account_number = '123-456-789014'), (SELECT id FROM transaction_categories WHERE name = '투자수익'), 2000000, '주식 투자 수익', CURRENT_DATE - INTERVAL '1 day', '15:30:00', 'TXN006'),
((SELECT id FROM accounts WHERE account_number = '123-456-789014'), (SELECT id FROM transaction_categories WHERE name = '투자수익'), 1500000, '채권 투자 수익', CURRENT_DATE - INTERVAL '5 days', '16:00:00', 'TXN007'),

-- 전북은행 운영비계좌 거래
((SELECT id FROM accounts WHERE account_number = '456-789-123456'), (SELECT id FROM transaction_categories WHERE name = '운영비'), -800000, '전기세', CURRENT_DATE - INTERVAL '2 days', '09:00:00', 'TXN008'),
((SELECT id FROM accounts WHERE account_number = '456-789-123456'), (SELECT id FROM transaction_categories WHERE name = '운영비'), -500000, '인터넷비', CURRENT_DATE - INTERVAL '3 days', '09:00:00', 'TXN009'),

-- 전북은행 마케팅계좌 거래
((SELECT id FROM accounts WHERE account_number = '456-789-123457'), (SELECT id FROM transaction_categories WHERE name = '마케팅비'), -2000000, '온라인 광고비', CURRENT_DATE - INTERVAL '1 day', '11:00:00', 'TXN010'),
((SELECT id FROM accounts WHERE account_number = '456-789-123457'), (SELECT id FROM transaction_categories WHERE name = '마케팅비'), -1500000, '이벤트 마케팅비', CURRENT_DATE - INTERVAL '7 days', '14:00:00', 'TXN011'),

-- 전북은행 연구개발계좌 거래
((SELECT id FROM accounts WHERE account_number = '456-789-123458'), (SELECT id FROM transaction_categories WHERE name = '연구개발비'), -5000000, '연구장비 구매', CURRENT_DATE - INTERVAL '1 day', '13:30:00', 'TXN012'),
((SELECT id FROM accounts WHERE account_number = '456-789-123458'), (SELECT id FROM transaction_categories WHERE name = '연구개발비'), -3000000, '연구원 인건비', CURRENT_DATE - INTERVAL '5 days', '10:00:00', 'TXN013'),

-- 농협 주거래계좌 거래
((SELECT id FROM accounts WHERE account_number = '789-012-345678'), (SELECT id FROM transaction_categories WHERE name = '매출'), 4000000, 'DEF 기업 프로젝트', CURRENT_DATE - INTERVAL '1 day', '16:00:00', 'TXN014'),
((SELECT id FROM accounts WHERE account_number = '789-012-345678'), (SELECT id FROM transaction_categories WHERE name = '세금'), -2000000, '법인세 납부', CURRENT_DATE - INTERVAL '3 days', '14:00:00', 'TXN015'),

-- 농협 투자계좌 거래
((SELECT id FROM accounts WHERE account_number = '789-012-345680'), (SELECT id FROM transaction_categories WHERE name = '투자수익'), 1800000, '펀드 투자 수익', CURRENT_DATE - INTERVAL '2 days', '15:00:00', 'TXN016'),
((SELECT id FROM accounts WHERE account_number = '789-012-345680'), (SELECT id FROM transaction_categories WHERE name = '투자수익'), 1200000, '부동산 투자 수익', CURRENT_DATE - INTERVAL '10 days', '16:30:00', 'TXN017');

-- 자금일보 생성 (최근 7일)
INSERT INTO funds_reports (report_date, opening_balance, closing_balance, daily_inflow, daily_outflow, net_flow) VALUES
(CURRENT_DATE - INTERVAL '1 day', 280000000, 285000000, 15000000, 10000000, 5000000),
(CURRENT_DATE - INTERVAL '2 days', 275000000, 280000000, 12000000, 7000000, 5000000),
(CURRENT_DATE - INTERVAL '3 days', 270000000, 275000000, 10000000, 5000000, 5000000),
(CURRENT_DATE - INTERVAL '4 days', 265000000, 270000000, 8000000, 3000000, 5000000),
(CURRENT_DATE - INTERVAL '5 days', 260000000, 265000000, 6000000, 1000000, 5000000),
(CURRENT_DATE - INTERVAL '6 days', 255000000, 260000000, 5000000, 0, 5000000),
(CURRENT_DATE - INTERVAL '7 days', 250000000, 255000000, 5000000, 0, 5000000)
ON CONFLICT (report_date) DO NOTHING;
