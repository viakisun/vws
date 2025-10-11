-- Migration: Create Korean name formatting function
-- 한국 이름 포맷팅을 PostgreSQL 함수로 중앙화

-- ============================================================================
-- 한국 이름 포맷 함수 생성
-- ============================================================================

CREATE OR REPLACE FUNCTION format_korean_name(
  p_last_name TEXT,
  p_first_name TEXT
) RETURNS TEXT AS $$
BEGIN
  -- NULL 체크
  IF p_last_name IS NULL OR p_first_name IS NULL THEN
    RETURN NULL;
  END IF;

  -- 한국 이름인지 확인 (한글만 있는지)
  IF p_last_name ~ '^[가-힣]+$' AND p_first_name ~ '^[가-힣]+$' THEN
    -- 한국 이름: 성+이름 (띄어쓰기 없음)
    RETURN p_last_name || p_first_name;
  ELSE
    -- 영문 이름: 이름 + 성 (띄어쓰기)
    RETURN p_first_name || ' ' || p_last_name;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION format_korean_name IS '한국 이름을 올바른 형식으로 포맷 (성+이름 띄어쓰기 없음, 영문은 이름+성)';

-- ============================================================================
-- 사용 예시를 위한 뷰 생성
-- ============================================================================

-- 기존 v_projects_with_dates 뷰 업데이트 (manager_name 추가)
DROP VIEW IF EXISTS v_projects_with_dates;

CREATE VIEW v_projects_with_dates AS
SELECT
  p.*,
  -- 연차별 예산에서 시작일/종료일 계산
  (SELECT MIN(pb.start_date)
   FROM project_budgets pb
   WHERE pb.project_id = p.id) AS calculated_start_date,
  (SELECT MAX(pb.end_date)
   FROM project_budgets pb
   WHERE pb.project_id = p.id) AS calculated_end_date
FROM projects p;

COMMENT ON VIEW v_projects_with_dates IS '프로젝트 기본 정보 + 동적 계산된 시작일/종료일';

-- ============================================================================
-- 잘못된 패턴 검출을 위한 뷰 (개발용)
-- ============================================================================

-- 한국 이름인데 띄어쓰기가 있는 직원 찾기
CREATE OR REPLACE VIEW v_invalid_korean_names AS
SELECT 
  id,
  first_name,
  last_name,
  first_name || ' ' || last_name AS wrong_format,
  format_korean_name(last_name, first_name) AS correct_format,
  '한국 이름인데 띄어쓰기 사용' AS issue
FROM employees
WHERE 
  first_name ~ '^[가-힣]+$' 
  AND last_name ~ '^[가-힣]+$'
  AND status = 'active';

COMMENT ON VIEW v_invalid_korean_names IS '잘못된 한국 이름 포맷 감지 (개발/검증용)';

