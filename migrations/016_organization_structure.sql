-- 016: 조직 구조 리팩토링
-- employees.manager_id 제거하고 별도 관계 테이블로 분리

-- 기존 departments 테이블이 있다면 제거 (충돌 방지)
DROP TABLE IF EXISTS departments CASCADE;

-- 1. 조직 단위 테이블 생성
CREATE TABLE IF NOT EXISTS org_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  parent_id UUID REFERENCES org_units(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 1, -- 1: 본부, 2: 팀, 3: 파트 등
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 조직 소속 관계 테이블 (히스토리 지원)
CREATE TABLE IF NOT EXISTS org_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  org_unit_id UUID NOT NULL REFERENCES org_units(id) ON DELETE CASCADE,
  role VARCHAR(100), -- '팀장', '팀원', '파트장' 등
  is_primary BOOLEAN DEFAULT true, -- 주 소속 여부
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL이면 현재 소속
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_membership_date_order CHECK (end_date IS NULL OR end_date >= start_date)
);

-- 3. 보고 관계 테이블 (조직도와 분리)
CREATE TABLE IF NOT EXISTS reporting_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  report_type VARCHAR(50) DEFAULT 'direct', -- 'direct', 'dotted', 'functional'
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL이면 현재 보고 관계
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_not_self_report CHECK (employee_id != manager_id),
  CONSTRAINT chk_relationship_date_order CHECK (end_date IS NULL OR end_date >= start_date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_org_units_parent ON org_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_units_code ON org_units(code);
CREATE INDEX IF NOT EXISTS idx_org_units_active ON org_units(is_active);

CREATE INDEX IF NOT EXISTS idx_org_memberships_employee ON org_memberships(employee_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_unit ON org_memberships(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_current ON org_memberships(employee_id) WHERE end_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_org_memberships_primary ON org_memberships(employee_id, is_primary) WHERE end_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_reporting_relationships_employee ON reporting_relationships(employee_id);
CREATE INDEX IF NOT EXISTS idx_reporting_relationships_manager ON reporting_relationships(manager_id);
CREATE INDEX IF NOT EXISTS idx_reporting_relationships_current ON reporting_relationships(employee_id) WHERE end_date IS NULL;

-- 4. 기존 데이터 마이그레이션
-- 4.1. employees.department 값으로 조직 단위 생성
INSERT INTO org_units (code, name, level, description)
SELECT DISTINCT
  LOWER(REGEXP_REPLACE(department, '[^a-zA-Z0-9가-힣]', '_', 'g')) as code,
  department as name,
  1 as level,
  '기존 데이터에서 마이그레이션됨' as description
FROM employees
WHERE department IS NOT NULL 
  AND department != ''
  AND NOT EXISTS (
    SELECT 1 FROM org_units ou 
    WHERE LOWER(REGEXP_REPLACE(department, '[^a-zA-Z0-9가-힣]', '_', 'g')) = ou.code
  );

-- 4.2. 조직 소속 관계 생성
INSERT INTO org_memberships (employee_id, org_unit_id, is_primary, start_date)
SELECT 
  e.id as employee_id,
  ou.id as org_unit_id,
  true as is_primary,
  COALESCE(e.hire_date::DATE, CURRENT_DATE) as start_date
FROM employees e
JOIN org_units ou ON LOWER(REGEXP_REPLACE(e.department, '[^a-zA-Z0-9가-힣]', '_', 'g')) = ou.code
WHERE e.department IS NOT NULL 
  AND e.department != ''
  AND NOT EXISTS (
    SELECT 1 FROM org_memberships om 
    WHERE om.employee_id = e.id AND om.end_date IS NULL
  );

-- 4.3. 보고 관계 생성 (기존 manager_id 사용)
-- 주의: manager_id 컬럼이 이미 제거되었다면 이 단계는 스킵됩니다
-- INSERT INTO reporting_relationships (employee_id, manager_id, report_type, start_date)
-- SELECT 
--   e.id as employee_id,
--   e.manager_id,
--   'direct' as report_type,
--   COALESCE(e.hire_date::DATE, CURRENT_DATE) as start_date
-- FROM employees e
-- WHERE e.manager_id IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM reporting_relationships rr 
--     WHERE rr.employee_id = e.id AND rr.end_date IS NULL
--   );

-- 5. employees 테이블에서 manager_id 제거 (컬럼 드롭)
-- 주의: 이미 제거된 경우 에러가 발생하지 않습니다
ALTER TABLE employees DROP COLUMN IF EXISTS manager_id;

-- 6. 현재 조직 소속 조회용 뷰 생성 (편의 기능)
CREATE OR REPLACE VIEW v_employee_current_org AS
SELECT 
  om.employee_id,
  om.org_unit_id,
  ou.code as org_code,
  ou.name as org_name,
  ou.level as org_level,
  om.role,
  om.is_primary
FROM org_memberships om
JOIN org_units ou ON om.org_unit_id = ou.id
WHERE om.end_date IS NULL
  AND ou.is_active = true;

-- 7. 현재 보고 관계 조회용 뷰 생성
CREATE OR REPLACE VIEW v_employee_current_manager AS
SELECT 
  rr.employee_id,
  rr.manager_id,
  e.first_name || ' ' || e.last_name as manager_name,
  e.employee_id as manager_employee_id,
  rr.report_type
FROM reporting_relationships rr
JOIN employees e ON rr.manager_id = e.id
WHERE rr.end_date IS NULL;

-- 8. 조직도 트리 조회용 함수
CREATE OR REPLACE FUNCTION get_org_tree(root_org_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name VARCHAR,
  parent_id UUID,
  level INTEGER,
  path TEXT,
  depth INTEGER
) AS $$
WITH RECURSIVE org_tree AS (
  -- Base case: 루트 조직들 (parent_id가 NULL이거나 지정된 root)
  SELECT 
    ou.id,
    ou.code,
    ou.name,
    ou.parent_id,
    ou.level,
    ou.name::TEXT as path,
    0 as depth
  FROM org_units ou
  WHERE (root_org_id IS NULL AND ou.parent_id IS NULL) 
     OR (root_org_id IS NOT NULL AND ou.id = root_org_id)
     AND ou.is_active = true
  
  UNION ALL
  
  -- Recursive case: 하위 조직들
  SELECT 
    ou.id,
    ou.code,
    ou.name,
    ou.parent_id,
    ou.level,
    ot.path || ' > ' || ou.name as path,
    ot.depth + 1 as depth
  FROM org_units ou
  JOIN org_tree ot ON ou.parent_id = ot.id
  WHERE ou.is_active = true
)
SELECT * FROM org_tree ORDER BY path;
$$ LANGUAGE SQL STABLE;

COMMENT ON TABLE org_units IS '조직 단위 (본부, 팀, 파트 등)';
COMMENT ON TABLE org_memberships IS '조직 소속 관계 (히스토리 지원, 다중 소속 가능)';
COMMENT ON TABLE reporting_relationships IS '보고 관계 (조직도와 독립적)';
COMMENT ON VIEW v_employee_current_org IS '직원의 현재 조직 소속 정보';
COMMENT ON VIEW v_employee_current_manager IS '직원의 현재 보고 관계';
COMMENT ON FUNCTION get_org_tree IS '조직 트리 구조 조회';
