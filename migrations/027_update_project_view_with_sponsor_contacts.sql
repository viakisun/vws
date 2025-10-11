-- 027_update_project_view_with_sponsor_contacts.sql
-- v_projects_with_dates 뷰에 주관기관 담당자 정보 추가

-- 1. 기존 뷰 삭제
DROP VIEW IF EXISTS v_projects_with_dates;

-- 2. 주관기관 담당자 정보를 포함한 뷰 재생성
CREATE VIEW v_projects_with_dates AS
SELECT 
  p.id,
  p.code,
  p.title,
  p.project_task_name,
  p.description,
  p.sponsor,
  p.sponsor_name,
  p.sponsor_type,
  p.sponsor_contact_name,
  p.sponsor_contact_phone,
  p.sponsor_contact_email,
  p.manager_employee_id,
  p.status,
  p.budget_total,
  p.budget_currency,
  p.research_type,
  p.technology_area,
  p.priority,
  p.dedicated_agency,
  p.dedicated_agency_contact_name,
  p.dedicated_agency_contact_phone,
  p.dedicated_agency_contact_email,
  p.created_at,
  p.updated_at,
  -- 연차별 예산에서 시작일/종료일 계산
  (SELECT MIN(pb.start_date) 
   FROM project_budgets pb 
   WHERE pb.project_id = p.id) AS calculated_start_date,
  (SELECT MAX(pb.end_date) 
   FROM project_budgets pb 
   WHERE pb.project_id = p.id) AS calculated_end_date
FROM projects p;

-- 3. 뷰 설명 업데이트
COMMENT ON VIEW v_projects_with_dates IS '프로젝트 정보(주관기관 담당자 포함)와 연차별 예산을 기반으로 계산된 시작일/종료일을 포함하는 뷰';

