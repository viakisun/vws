-- CRM Phase 1: 상호작용, 영업 기회, 계약, 거래 내역 테이블 생성
-- 2025년 실제 계약 데이터 삽입 포함

-- ============================================
-- 1. 상호작용 관리 테이블
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_interactions') THEN
    CREATE TABLE crm_interactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('meeting', 'call', 'email', 'note')),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      next_action_date TIMESTAMPTZ,
      created_by UUID REFERENCES employees(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_crm_interactions_customer_id ON crm_interactions(customer_id);
    CREATE INDEX idx_crm_interactions_type ON crm_interactions(type);
    CREATE INDEX idx_crm_interactions_date ON crm_interactions(interaction_date DESC);
    CREATE INDEX idx_crm_interactions_created_by ON crm_interactions(created_by);
    
    RAISE NOTICE 'Created table: crm_interactions';
  ELSE
    RAISE NOTICE 'Table already exists: crm_interactions';
  END IF;
END $$;

COMMENT ON TABLE crm_interactions IS '고객 상호작용 기록 (미팅, 통화, 이메일, 메모)';

-- ============================================
-- 2. 영업 기회 관리 테이블
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_opportunities') THEN
    CREATE TABLE crm_opportunities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      stage VARCHAR(30) NOT NULL DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
      probability INTEGER NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
      expected_close_date DATE,
      actual_close_date DATE,
      status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
      assigned_to UUID REFERENCES employees(id),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_crm_opportunities_customer_id ON crm_opportunities(customer_id);
    CREATE INDEX idx_crm_opportunities_stage ON crm_opportunities(stage);
    CREATE INDEX idx_crm_opportunities_status ON crm_opportunities(status);
    CREATE INDEX idx_crm_opportunities_assigned_to ON crm_opportunities(assigned_to);
    CREATE INDEX idx_crm_opportunities_expected_close_date ON crm_opportunities(expected_close_date);
    
    RAISE NOTICE 'Created table: crm_opportunities';
  ELSE
    RAISE NOTICE 'Table already exists: crm_opportunities';
  END IF;
END $$;

COMMENT ON TABLE crm_opportunities IS '영업 기회 관리';

-- ============================================
-- 3. 계약 관리 테이블 확장 (기존 테이블에 컬럼 추가)
-- ============================================
-- 기존 테이블 crm_contracts가 이미 존재하므로 필요한 컬럼만 추가
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS contract_party VARCHAR(200);
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT 'revenue' CHECK (contract_type IN ('revenue', 'expense'));
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS contract_file_s3_key VARCHAR(500);
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_crm_contracts_contract_type ON crm_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_crm_contracts_opportunity_id ON crm_contracts(opportunity_id);

COMMENT ON TABLE crm_contracts IS '계약 관리 (수령/지급)';

-- ============================================
-- 4. 거래 내역 테이블 (기존 테이블 활용)
-- ============================================
-- crm_transactions 테이블이 이미 존재하므로 COMMENT만 추가
COMMENT ON TABLE crm_transactions IS 'CRM 거래 내역';

-- ============================================
-- 5. 2025년 실제 계약 데이터 삽입
-- ============================================

-- 고객 데이터 먼저 확인/삽입
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM crm_customers WHERE name = '캠틱종합기술원') THEN
    INSERT INTO crm_customers (name, type, business_number, status, business_type)
    VALUES ('캠틱종합기술원', 'customer', '000-00-00001', 'active', '기술원');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM crm_customers WHERE name = '(주)하다') THEN
    INSERT INTO crm_customers (name, type, business_number, status, business_type)
    VALUES ('(주)하다', 'customer', '000-00-00002', 'active', 'SI 개발');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM crm_customers WHERE name = 'DY이노베이트') THEN
    INSERT INTO crm_customers (name, type, business_number, status, business_type)
    VALUES ('DY이노베이트', 'customer', '000-00-00003', 'active', '시스템 개발');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM crm_customers WHERE name = '전북테크노파크') THEN
    INSERT INTO crm_customers (name, type, business_number, status, business_type)
    VALUES ('전북테크노파크', 'customer', '000-00-00004', 'active', '공공기관');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM crm_customers WHERE name = '대한드론축구협회') THEN
    INSERT INTO crm_customers (name, type, business_number, status, business_type)
    VALUES ('대한드론축구협회', 'customer', '000-00-00005', 'active', '협회');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM crm_customers WHERE name = '전주시청') THEN
    INSERT INTO crm_customers (name, type, business_number, status, business_type)
    VALUES ('전주시청', 'customer', '000-00-00006', 'active', '공공기관');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM crm_customers WHERE name = '㈜엠비씨플러스') THEN
    INSERT INTO crm_customers (name, type, business_number, status, business_type)
    VALUES ('㈜엠비씨플러스', 'customer', '000-00-00007', 'active', '방송');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM crm_customers WHERE name = '아이오일렉트론') THEN
    INSERT INTO crm_customers (name, type, business_number, status, business_type)
    VALUES ('아이오일렉트론', 'customer', '000-00-00008', 'active', '전자');
  END IF;
END $$;

-- 계약 데이터 삽입
DO $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- 1. 전산시스템 유지보수 용역
  SELECT id INTO v_customer_id FROM crm_customers WHERE name = '캠틱종합기술원' LIMIT 1;
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-001') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, end_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-001', '전산시스템 유지보수 용역', 'sales', '캠틱종합기술원', 26730000, 'revenue', '2025-05-07', '2025-10-31', '매월 총 금액 1/N', '고동훤', 'active', '');
  END IF;

  -- 2. 펌웨어 개발 지원(SI) 계약
  SELECT id INTO v_customer_id FROM crm_customers WHERE name = '(주)하다' LIMIT 1;
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-002') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, end_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-002', '펌웨어 개발 지원(SI) 계약', 'sales', '(주)하다', 31185000, 'revenue', '2025-04-01', '2025-09-30', '선급금 50%, 잔금 50%', '최시용', 'completed', '');
  END IF;

  -- 3. 스마트 안전 관리 시스템 개발 용역
  SELECT id INTO v_customer_id FROM crm_customers WHERE name = 'DY이노베이트' LIMIT 1;
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-003') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, end_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-003', '스마트 안전 관리 시스템 개발 용역', 'sales', 'DY이노베이트', 132000000, 'revenue', '2025-03-26', '2026-02-28', '선급금 50%, 잔금 50%', '슬루기팀', 'active', '');
  END IF;

  -- 4. 골프카트 관제 시스템 개발 용역
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-004') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, end_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-004', '골프카트 관제 시스템 개발 용역', 'sales', 'DY이노베이트', 220000000, 'revenue', '2025-04-09', '2026-02-28', '선급금, 중도금(1차~4차), 잔금', '슬루기팀', 'active', '');
  END IF;

  -- 5. 골프카트 관제 시스템의 맵 제작 및 맵 에디터 설계
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-005') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, end_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-005', '골프카트 관제 시스템의 맵 제작 및 맵 에디터 설계', 'sales', 'DY이노베이트', 20000000, 'revenue', '2025-09-15', '2025-09-30', '용역 완수 후 지급', '', 'completed', '');
  END IF;

  -- 6. 전북바이오 플랫폼 WEB 시스템 구축
  SELECT id INTO v_customer_id FROM crm_customers WHERE name = '전북테크노파크' LIMIT 1;
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-006') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, end_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-006', '전북바이오 플랫폼 WEB 시스템 구축', 'sales', '전북테크노파크', 36800000, 'revenue', '2025-09-09', '2025-12-07', '용역 완수 후 지급', '슬루기팀', 'active', '');
  END IF;

  -- 7. KDSA 사이트 디자인 수정 및 기능 추가 개발 용역
  SELECT id INTO v_customer_id FROM crm_customers WHERE name = '대한드론축구협회' LIMIT 1;
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-007') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-007', 'KDSA 사이트 디자인 수정 및 기능 추가 개발 용역', 'sales', '대한드론축구협회', 7000000, 'revenue', '2025-01-01', '', '', 'active', '계약 기간 미정');
  END IF;

  -- 8. 드론축구 경기운영시스템 구입 설치
  SELECT id INTO v_customer_id FROM crm_customers WHERE name = '전주시청' LIMIT 1;
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-008') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, end_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-008', '드론축구 경기운영시스템 구입 설치', 'sales', '전주시청', 8415000, 'revenue', '2025-06-24', '2025-08-14', '용역 완수 후 지급', '', 'completed', '지급 완료');
  END IF;

  -- 9. 드론축구 경기운영 시스템
  SELECT id INTO v_customer_id FROM crm_customers WHERE name = '㈜엠비씨플러스' LIMIT 1;
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-009') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, end_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-009', '드론축구 경기운영 시스템', 'sales', '㈜엠비씨플러스', 76472000, 'revenue', '2025-07-08', '2025-11-28', '선급금 50%, 잔금 50%', '', 'active', '');
  END IF;

  -- 10. 경기운영 시스템 렌트 (지급 예정)
  SELECT id INTO v_customer_id FROM crm_customers WHERE name = '캠틱종합기술원' LIMIT 1;
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-E001') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-E001', '경기운영 시스템 렌트', 'purchase', '캠틱종합기술원', 50000000, 'expense', '2025-09-01', '금액 미정', '', 'active', '종료일 미정');
  END IF;

  -- 11. 계약 지급
  SELECT id INTO v_customer_id FROM crm_customers WHERE name = '아이오일렉트론' LIMIT 1;
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm_contracts WHERE contract_number = 'CON-2025-E002') THEN
    INSERT INTO crm_contracts (customer_id, contract_number, title, type, contract_party, total_amount, contract_type, start_date, payment_method, assigned_to, status, description)
    VALUES (v_customer_id, 'CON-2025-E002', '계약 지급', 'purchase', '아이오일렉트론', 32795000, 'expense', '2025-11-01', '', '', 'active', '지급해야함');
  END IF;

  RAISE NOTICE '✅ Contract data insertion completed: 11 contracts';
END $$;

-- ============================================
-- 6. Updated_at 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- crm_interactions 트리거
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_crm_interactions_updated_at') THEN
    CREATE TRIGGER trigger_crm_interactions_updated_at
      BEFORE UPDATE ON crm_interactions
      FOR EACH ROW
      EXECUTE FUNCTION update_crm_updated_at();
  END IF;
END $$;

-- crm_opportunities 트리거
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_crm_opportunities_updated_at') THEN
    CREATE TRIGGER trigger_crm_opportunities_updated_at
      BEFORE UPDATE ON crm_opportunities
      FOR EACH ROW
      EXECUTE FUNCTION update_crm_updated_at();
  END IF;
END $$;
