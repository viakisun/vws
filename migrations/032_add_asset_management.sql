-- =====================================================
-- Migration 032: Asset and IP Management System
-- =====================================================
-- 목적: 자산 및 지식재산권 관리 시스템 테이블 생성
-- 날짜: 2025-01-20
-- 설명: 물리적 자산, 지식재산권, 인증/등록증, 자산 실사, 알림 관리

-- =====================================================
-- 1. 자산 카테고리 테이블
-- =====================================================

CREATE TABLE public.asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'physical', 'ip', 'certification'
  description TEXT,
  requires_serial BOOLEAN DEFAULT false,
  requires_location BOOLEAN DEFAULT false,
  requires_datetime_booking BOOLEAN DEFAULT false, -- 차량 예약용
  requires_assignment BOOLEAN DEFAULT false, -- 장비 지급용
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. 자산 마스터 테이블
-- =====================================================

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES asset_categories(id),
  asset_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  serial_number VARCHAR(100),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  purchase_date DATE,
  purchase_price NUMERIC(15,2),
  warranty_end_date DATE,
  location VARCHAR(200),
  status VARCHAR(50) DEFAULT 'available', -- available, in_use, maintenance, disposed, lost
  condition VARCHAR(50), -- excellent, good, fair, poor
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. 자산 할당 테이블
-- =====================================================

CREATE TABLE public.asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  employee_id UUID REFERENCES employees(id),
  assigned_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, returned, overdue
  purpose TEXT,
  notes TEXT,
  assigned_by UUID REFERENCES employees(id),
  returned_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. 자산 신청 테이블
-- =====================================================

CREATE TABLE public.asset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES employees(id),
  asset_id UUID REFERENCES assets(id),
  category_id UUID REFERENCES asset_categories(id),
  request_type VARCHAR(50) NOT NULL, -- 'vehicle_reservation', 'equipment_assignment', 'equipment_return', 'new_purchase', 'disposal'
  purpose TEXT,
  start_datetime TIMESTAMPTZ, -- 차량 예약용 (시작 일시)
  end_datetime TIMESTAMPTZ,   -- 차량 예약용 (종료 일시)
  return_reason TEXT,          -- 장비 반납 사유
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, completed, cancelled
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. 지식재산권 테이블
-- =====================================================

CREATE TABLE public.intellectual_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_type VARCHAR(50) NOT NULL, -- 'patent', 'trademark', 'utility_model', 'design', 'domain', 'copyright'
  title VARCHAR(300) NOT NULL,
  registration_number VARCHAR(100),
  application_number VARCHAR(100),
  application_date DATE,
  registration_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  status VARCHAR(50) DEFAULT 'planning', -- planning, applied, registered, expired, abandoned
  country VARCHAR(50) DEFAULT 'KR',
  owner VARCHAR(200),
  inventor_names TEXT[],
  description TEXT,
  classification_code VARCHAR(100),
  annual_fee NUMERIC(12,2),
  document_s3_key VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. 지식재산권 갱신 이력 테이블
-- =====================================================

CREATE TABLE public.ip_renewal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_id UUID REFERENCES intellectual_properties(id),
  renewal_date DATE NOT NULL,
  fee_paid NUMERIC(12,2),
  next_renewal_date DATE,
  paid_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. 회사 인증/등록증 테이블
-- =====================================================

CREATE TABLE public.company_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  certification_type VARCHAR(100) NOT NULL, -- 'research_business', 'venture', 'innobiz', 'factory_registration', 'iso', etc.
  certification_name VARCHAR(200) NOT NULL,
  certification_number VARCHAR(100),
  issuing_authority VARCHAR(200),
  issue_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, expired, suspended, cancelled
  renewal_required BOOLEAN DEFAULT false,
  document_s3_key VARCHAR(500),
  ocr_confidence NUMERIC(3,2), -- OCR 신뢰도 (0.00-1.00)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. 인증 갱신 이력 테이블
-- =====================================================

CREATE TABLE public.certification_renewal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id UUID REFERENCES company_certifications(id),
  renewal_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  renewed_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. 분기별 자산 실사 테이블
-- =====================================================

CREATE TABLE public.asset_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_name VARCHAR(200) NOT NULL,
  audit_quarter INTEGER NOT NULL, -- 1, 2, 3, 4
  audit_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed
  auditor_id UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. 자산 실사 항목 테이블
-- =====================================================

CREATE TABLE public.asset_audit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES asset_audits(id),
  asset_id UUID REFERENCES assets(id),
  checked BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ,
  checked_by UUID REFERENCES employees(id),
  condition VARCHAR(50),
  location_verified BOOLEAN,
  discrepancy_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. 알림 테이블
-- =====================================================

CREATE TABLE public.asset_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type VARCHAR(50) NOT NULL, -- 'expiry_warning', 'renewal_due', 'audit_reminder', 'overdue_return'
  reference_type VARCHAR(50) NOT NULL, -- 'asset', 'ip', 'certification', 'assignment'
  reference_id UUID NOT NULL,
  recipient_id UUID REFERENCES employees(id),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, read
  scheduled_date DATE,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성 (성능 최적화)
-- =====================================================

-- 자산 관련 인덱스
CREATE INDEX idx_assets_category_id ON public.assets(category_id);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_asset_code ON public.assets(asset_code);
CREATE INDEX idx_asset_assignments_asset_id ON public.asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_employee_id ON public.asset_assignments(employee_id);
CREATE INDEX idx_asset_assignments_status ON public.asset_assignments(status);
CREATE INDEX idx_asset_requests_requester_id ON public.asset_requests(requester_id);
CREATE INDEX idx_asset_requests_status ON public.asset_requests(status);
CREATE INDEX idx_asset_requests_start_datetime ON public.asset_requests(start_datetime);

-- 지식재산권 관련 인덱스
CREATE INDEX idx_intellectual_properties_ip_type ON public.intellectual_properties(ip_type);
CREATE INDEX idx_intellectual_properties_status ON public.intellectual_properties(status);
CREATE INDEX idx_intellectual_properties_expiry_date ON public.intellectual_properties(expiry_date);
CREATE INDEX idx_ip_renewal_history_ip_id ON public.ip_renewal_history(ip_id);

-- 인증 관련 인덱스
CREATE INDEX idx_company_certifications_company_id ON public.company_certifications(company_id);
CREATE INDEX idx_company_certifications_certification_type ON public.company_certifications(certification_type);
CREATE INDEX idx_company_certifications_expiry_date ON public.company_certifications(expiry_date);
CREATE INDEX idx_certification_renewal_history_certification_id ON public.certification_renewal_history(certification_id);

-- 실사 관련 인덱스
CREATE INDEX idx_asset_audits_year_quarter ON public.asset_audits(audit_year, audit_quarter);
CREATE INDEX idx_asset_audit_items_audit_id ON public.asset_audit_items(audit_id);
CREATE INDEX idx_asset_audit_items_asset_id ON public.asset_audit_items(asset_id);

-- 알림 관련 인덱스
CREATE INDEX idx_asset_notifications_recipient_id ON public.asset_notifications(recipient_id);
CREATE INDEX idx_asset_notifications_status ON public.asset_notifications(status);
CREATE INDEX idx_asset_notifications_scheduled_date ON public.asset_notifications(scheduled_date);

-- =====================================================
-- 기본 데이터 삽입
-- =====================================================

-- 자산 카테고리 기본 데이터
INSERT INTO public.asset_categories (name, type, description, requires_serial, requires_location, requires_datetime_booking, requires_assignment) VALUES
('PC/노트북', 'physical', '컴퓨터 및 노트북', true, false, false, true),
('모니터', 'physical', '모니터 및 디스플레이', true, false, false, true),
('프린터', 'physical', '프린터 및 복합기', true, true, false, true),
('회의실 장비', 'physical', '프로젝터, 화상회의 장비', true, true, false, false),
('차량', 'physical', '회사 차량', true, true, true, false),
('사무용품', 'physical', '의자, 책상, 기타 사무용품', false, true, false, true),
('특허', 'ip', '발명특허', false, false, false, false),
('상표', 'ip', '상표권', false, false, false, false),
('실용신안', 'ip', '실용신안', false, false, false, false),
('디자인', 'ip', '디자인등록', false, false, false, false),
('도메인', 'ip', '도메인명', false, false, false, false),
('저작권', 'ip', '저작권', false, false, false, false),
('전문연구사업자', 'certification', '전문연구사업자 등록증', false, false, false, false),
('벤처기업인증', 'certification', '벤처기업 확인서', false, false, false, false),
('이노비즈인증', 'certification', '이노비즈 인증서', false, false, false, false),
('공장등록증', 'certification', '공장등록증', false, false, false, false),
('ISO인증', 'certification', 'ISO 인증서', false, false, false, false);

-- =====================================================
-- 댓글 추가
-- =====================================================

COMMENT ON TABLE public.asset_categories IS '자산 카테고리 관리 (물리적 자산, 지식재산권, 인증)';
COMMENT ON TABLE public.assets IS '자산 마스터 정보 (장비, 차량 등)';
COMMENT ON TABLE public.asset_assignments IS '자산 할당 내역 (누가 어떤 자산을 사용 중)';
COMMENT ON TABLE public.asset_requests IS '자산 신청 내역 (차량 예약, 장비 신청/반납)';
COMMENT ON TABLE public.intellectual_properties IS '지식재산권 정보 (특허, 상표, 도메인 등)';
COMMENT ON TABLE public.ip_renewal_history IS '지식재산권 갱신 이력';
COMMENT ON TABLE public.company_certifications IS '회사 인증/등록증 정보';
COMMENT ON TABLE public.certification_renewal_history IS '인증 갱신 이력';
COMMENT ON TABLE public.asset_audits IS '분기별 자산 실사 계획';
COMMENT ON TABLE public.asset_audit_items IS '자산 실사 체크리스트 항목';
COMMENT ON TABLE public.asset_notifications IS '자산 관련 알림 (만료, 갱신, 실사 등)';
