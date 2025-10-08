-- =============================================
-- RBAC (Role-Based Access Control) 테이블 생성
-- =============================================

-- 1. 역할(Roles) 테이블
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_ko VARCHAR(100) NOT NULL,
  description TEXT,
  parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 0, -- 높을수록 상위 권한
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 권한(Permissions) 테이블
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(200) UNIQUE NOT NULL, -- 예: 'finance.accounts.read'
  resource VARCHAR(100) NOT NULL,    -- 예: 'finance.accounts'
  action VARCHAR(50) NOT NULL,       -- 예: 'read', 'write', 'delete', 'approve'
  scope VARCHAR(50) DEFAULT 'all',   -- 'own', 'department', 'all'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 역할-권한 매핑 테이블
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. 사용자-역할 매핑 테이블
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, role_id)
);

-- 5. 권한 캐시 테이블 (성능 최적화)
CREATE TABLE IF NOT EXISTS permission_cache (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL,
  roles JSONB NOT NULL,
  calculated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour')
);

-- 6. 권한 감사 로그
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'grant_role', 'revoke_role', 'update_permission'
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  target_permission_id UUID REFERENCES permissions(id) ON DELETE SET NULL,
  details JSONB,
  performed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- 역할 관련 인덱스
CREATE INDEX idx_roles_code ON roles(code) WHERE is_active = true;
CREATE INDEX idx_roles_parent ON roles(parent_role_id) WHERE parent_role_id IS NOT NULL;

-- 권한 관련 인덱스
CREATE INDEX idx_permissions_resource ON permissions(resource) WHERE is_active = true;
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_code ON permissions(code) WHERE is_active = true;

-- 매핑 테이블 인덱스
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id) WHERE is_active = true;
CREATE INDEX idx_user_roles_role ON user_roles(role_id) WHERE is_active = true;
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- 캐시 테이블 인덱스
CREATE INDEX idx_permission_cache_expires ON permission_cache(expires_at);

-- 감사 로그 인덱스
CREATE INDEX idx_permission_audit_user ON permission_audit_log(user_id);
CREATE INDEX idx_permission_audit_target_user ON permission_audit_log(target_user_id);
CREATE INDEX idx_permission_audit_performed ON permission_audit_log(performed_at DESC);

-- =============================================
-- 트리거 함수: updated_at 자동 업데이트
-- =============================================

CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();

-- =============================================
-- 함수: 권한 캐시 무효화
-- =============================================

CREATE OR REPLACE FUNCTION invalidate_permission_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- 사용자 역할이 변경되면 캐시 삭제
  IF TG_TABLE_NAME = 'user_roles' THEN
    DELETE FROM permission_cache WHERE user_id = NEW.user_id;
  END IF;

  -- 역할 권한이 변경되면 해당 역할을 가진 모든 사용자의 캐시 삭제
  IF TG_TABLE_NAME = 'role_permissions' THEN
    DELETE FROM permission_cache
    WHERE user_id IN (
      SELECT user_id FROM user_roles WHERE role_id = NEW.role_id AND is_active = true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 사용자 역할 변경 시 캐시 무효화
CREATE TRIGGER trigger_invalidate_cache_on_user_role_change
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_permission_cache();

-- 트리거: 역할 권한 변경 시 캐시 무효화
CREATE TRIGGER trigger_invalidate_cache_on_role_permission_change
  AFTER INSERT OR UPDATE OR DELETE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_permission_cache();

-- =============================================
-- 함수: 사용자 권한 계산 (상속 포함)
-- =============================================

CREATE OR REPLACE FUNCTION calculate_user_permissions(p_user_id UUID)
RETURNS TABLE (
  permission_code VARCHAR(200),
  resource VARCHAR(100),
  action VARCHAR(50),
  scope VARCHAR(50)
) AS $$
WITH RECURSIVE role_hierarchy AS (
  -- 사용자가 직접 할당받은 역할
  SELECT r.id, r.parent_role_id, r.priority
  FROM roles r
  JOIN user_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)

  UNION

  -- 상위 역할 상속
  SELECT r.id, r.parent_role_id, r.priority
  FROM roles r
  JOIN role_hierarchy rh ON r.id = rh.parent_role_id
  WHERE r.is_active = true
)
SELECT DISTINCT
  p.code as permission_code,
  p.resource,
  p.action,
  p.scope
FROM role_hierarchy rh
JOIN role_permissions rp ON rp.role_id = rh.id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.is_active = true
ORDER BY p.resource, p.action;
$$ LANGUAGE SQL STABLE;

-- =============================================
-- 뷰: 사용자별 유효 역할 (상속 포함)
-- =============================================

CREATE OR REPLACE VIEW user_effective_roles AS
WITH RECURSIVE role_hierarchy AS (
  -- 직접 할당된 역할
  SELECT
    ur.user_id,
    r.id as role_id,
    r.code,
    r.name,
    r.name_ko,
    r.priority,
    'direct' as assignment_type
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.is_active = true
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)

  UNION

  -- 상속된 역할
  SELECT
    rh.user_id,
    r.id as role_id,
    r.code,
    r.name,
    r.name_ko,
    r.priority,
    'inherited' as assignment_type
  FROM role_hierarchy rh
  JOIN roles r ON r.id = (SELECT parent_role_id FROM roles WHERE id = rh.role_id)
  WHERE r.is_active = true
)
SELECT DISTINCT * FROM role_hierarchy;

-- =============================================
-- 초기 데이터: 기본 역할 삽입
-- =============================================

INSERT INTO roles (code, name, name_ko, description, priority) VALUES
  ('ADMIN', 'Administrator', '관리자', '시스템 전체 관리자', 100),
  ('MANAGEMENT', 'Management', '경영관리자', '경영 정보 접근 및 관리', 80),
  ('FINANCE_MANAGER', 'Finance Manager', '재무관리자', '재무 정보 접근 및 관리', 70),
  ('HR_MANAGER', 'HR Manager', '인사관리자', '급여 및 인사정보 접근 및 관리', 70),
  ('ADMINISTRATOR', 'Administrator', '행정원', '일반 행정 업무 담당', 50),
  ('RESEARCH_DIRECTOR', 'Research Director', '연구소장', '연구개발 총괄', 75),
  ('SALES', 'Sales', '영업', '고객 및 영업 데이터 관리', 60),
  ('RESEARCHER', 'Researcher', '연구원', '연구개발 업무 수행', 40),
  ('EMPLOYEE', 'Employee', '일반직원', '기본 사용자 권한', 10)
ON CONFLICT (code) DO NOTHING;

-- 역할 계층 구조 설정
UPDATE roles SET parent_role_id = (SELECT id FROM roles WHERE code = 'EMPLOYEE')
WHERE code IN ('ADMINISTRATOR', 'RESEARCHER', 'SALES');

UPDATE roles SET parent_role_id = (SELECT id FROM roles WHERE code = 'ADMINISTRATOR')
WHERE code IN ('HR_MANAGER', 'FINANCE_MANAGER');

UPDATE roles SET parent_role_id = (SELECT id FROM roles WHERE code = 'RESEARCHER')
WHERE code = 'RESEARCH_DIRECTOR';

-- =============================================
-- 초기 데이터: 기본 권한 삽입
-- =============================================

-- 공통 권한
INSERT INTO permissions (code, resource, action, scope, description) VALUES
  ('common.dashboard.read', 'common.dashboard', 'read', 'own', '개인 대시보드 조회'),
  ('common.profile.read', 'common.profile', 'read', 'own', '개인 프로필 조회'),
  ('common.profile.write', 'common.profile', 'write', 'own', '개인 프로필 수정')
ON CONFLICT (code) DO NOTHING;

-- 재무 권한
INSERT INTO permissions (code, resource, action, scope, description) VALUES
  ('finance.accounts.read', 'finance.accounts', 'read', 'all', '계정 조회'),
  ('finance.accounts.write', 'finance.accounts', 'write', 'all', '계정 생성/수정'),
  ('finance.accounts.delete', 'finance.accounts', 'delete', 'all', '계정 삭제'),
  ('finance.transactions.read', 'finance.transactions', 'read', 'all', '거래내역 조회'),
  ('finance.transactions.write', 'finance.transactions', 'write', 'all', '거래내역 생성/수정'),
  ('finance.transactions.delete', 'finance.transactions', 'delete', 'all', '거래내역 삭제'),
  ('finance.budgets.read', 'finance.budgets', 'read', 'all', '예산 조회'),
  ('finance.budgets.write', 'finance.budgets', 'write', 'all', '예산 생성/수정'),
  ('finance.budgets.approve', 'finance.budgets', 'approve', 'all', '예산 승인')
ON CONFLICT (code) DO NOTHING;

-- 인사 권한
INSERT INTO permissions (code, resource, action, scope, description) VALUES
  ('hr.employees.read', 'hr.employees', 'read', 'all', '직원 정보 조회'),
  ('hr.employees.write', 'hr.employees', 'write', 'all', '직원 정보 수정'),
  ('hr.payslips.read.own', 'hr.payslips', 'read', 'own', '본인 급여명세서 조회'),
  ('hr.payslips.read.all', 'hr.payslips', 'read', 'all', '전체 급여명세서 조회'),
  ('hr.payslips.write', 'hr.payslips', 'write', 'all', '급여명세서 생성/수정'),
  ('hr.attendance.read.own', 'hr.attendance', 'read', 'own', '본인 근태 조회'),
  ('hr.attendance.read.all', 'hr.attendance', 'read', 'all', '전체 근태 조회'),
  ('hr.attendance.write', 'hr.attendance', 'write', 'all', '근태 관리'),
  ('hr.leaves.read.own', 'hr.leaves', 'read', 'own', '본인 연차 조회'),
  ('hr.leaves.read.all', 'hr.leaves', 'read', 'all', '전체 연차 조회'),
  ('hr.leaves.write', 'hr.leaves', 'write', 'all', '연차 관리'),
  ('hr.leaves.approve', 'hr.leaves', 'approve', 'all', '연차 승인')
ON CONFLICT (code) DO NOTHING;

-- 프로젝트 권한
INSERT INTO permissions (code, resource, action, scope, description) VALUES
  ('project.projects.read', 'project.projects', 'read', 'all', '프로젝트 조회'),
  ('project.projects.write', 'project.projects', 'write', 'all', '프로젝트 생성/수정'),
  ('project.projects.delete', 'project.projects', 'delete', 'all', '프로젝트 삭제'),
  ('project.deliverables.read', 'project.deliverables', 'read', 'all', '산출물 조회'),
  ('project.deliverables.write', 'project.deliverables', 'write', 'all', '산출물 생성/수정')
ON CONFLICT (code) DO NOTHING;

-- 영업 권한
INSERT INTO permissions (code, resource, action, scope, description) VALUES
  ('sales.customers.read', 'sales.customers', 'read', 'all', '고객 정보 조회'),
  ('sales.customers.write', 'sales.customers', 'write', 'all', '고객 정보 관리'),
  ('sales.contracts.read', 'sales.contracts', 'read', 'all', '계약 정보 조회'),
  ('sales.contracts.write', 'sales.contracts', 'write', 'all', '계약 정보 관리')
ON CONFLICT (code) DO NOTHING;

-- 시스템 권한
INSERT INTO permissions (code, resource, action, scope, description) VALUES
  ('system.users.read', 'system.users', 'read', 'all', '사용자 조회'),
  ('system.users.write', 'system.users', 'write', 'all', '사용자 관리'),
  ('system.roles.read', 'system.roles', 'read', 'all', '역할 조회'),
  ('system.roles.write', 'system.roles', 'write', 'all', '역할 관리'),
  ('system.permissions.read', 'system.permissions', 'read', 'all', '권한 조회'),
  ('system.permissions.write', 'system.permissions', 'write', 'all', '권한 관리'),
  ('system.audit.read', 'system.audit', 'read', 'all', '감사 로그 조회')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 역할별 권한 매핑
-- =============================================

-- ADMIN: 모든 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'ADMIN'),
  id
FROM permissions
ON CONFLICT DO NOTHING;

-- EMPLOYEE: 기본 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'EMPLOYEE'),
  id
FROM permissions
WHERE code IN (
  'common.dashboard.read',
  'common.profile.read',
  'common.profile.write',
  'hr.payslips.read.own',
  'hr.attendance.read.own',
  'hr.leaves.read.own'
)
ON CONFLICT DO NOTHING;

-- FINANCE_MANAGER: 재무 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'FINANCE_MANAGER'),
  id
FROM permissions
WHERE resource LIKE 'finance.%'
ON CONFLICT DO NOTHING;

-- HR_MANAGER: 인사 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'HR_MANAGER'),
  id
FROM permissions
WHERE resource LIKE 'hr.%'
ON CONFLICT DO NOTHING;

-- RESEARCH_DIRECTOR: 연구 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'RESEARCH_DIRECTOR'),
  id
FROM permissions
WHERE resource LIKE 'project.%'
ON CONFLICT DO NOTHING;

-- SALES: 영업 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'SALES'),
  id
FROM permissions
WHERE resource LIKE 'sales.%'
ON CONFLICT DO NOTHING;

-- MANAGEMENT: 읽기 권한 위주
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'MANAGEMENT'),
  id
FROM permissions
WHERE action = 'read'
ON CONFLICT DO NOTHING;

-- =============================================
-- 기존 users 테이블의 role 데이터 마이그레이션
-- =============================================

-- 임시 마이그레이션 (실제 배포시 조정 필요)
INSERT INTO user_roles (user_id, role_id)
SELECT
  u.id,
  CASE
    WHEN UPPER(u.role) = 'ADMIN' THEN (SELECT id FROM roles WHERE code = 'ADMIN')
    WHEN UPPER(u.role) = 'MANAGER' THEN (SELECT id FROM roles WHERE code = 'MANAGEMENT')
    WHEN UPPER(u.role) = 'HR' THEN (SELECT id FROM roles WHERE code = 'HR_MANAGER')
    WHEN UPPER(u.role) = 'FINANCE' THEN (SELECT id FROM roles WHERE code = 'FINANCE_MANAGER')
    ELSE (SELECT id FROM roles WHERE code = 'EMPLOYEE')
  END
FROM users u
WHERE u.role IS NOT NULL
ON CONFLICT DO NOTHING;

-- =============================================
-- 완료 메시지
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'RBAC 테이블 생성 완료';
  RAISE NOTICE '- roles 테이블 생성 및 기본 역할 삽입';
  RAISE NOTICE '- permissions 테이블 생성 및 기본 권한 삽입';
  RAISE NOTICE '- role_permissions 매핑 완료';
  RAISE NOTICE '- 기존 users.role 데이터 마이그레이션 완료';
END $$;