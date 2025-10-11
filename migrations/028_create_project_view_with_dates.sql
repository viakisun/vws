-- Migration: Create view for projects with calculated dates
-- 연차별 예산 데이터(project_budgets)를 기반으로 프로젝트 시작일/종료일을 자동 계산하는 뷰 생성

-- 1. 기존 뷰가 있다면 삭제
DROP VIEW IF EXISTS v_projects_with_dates;

-- 2. 프로젝트 정보와 함께 시작일/종료일을 자동 계산하는 뷰 생성
CREATE VIEW v_projects_with_dates AS
SELECT 
  p.*,
  (SELECT MIN(pb.start_date) 
   FROM project_budgets pb 
   WHERE pb.project_id = p.id) AS calculated_start_date,
  (SELECT MAX(pb.end_date) 
   FROM project_budgets pb 
   WHERE pb.project_id = p.id) AS calculated_end_date
FROM projects p;

-- 3. 뷰 설명 추가
COMMENT ON VIEW v_projects_with_dates IS '프로젝트 정보와 연차별 예산을 기반으로 계산된 시작일/종료일을 포함하는 뷰';

