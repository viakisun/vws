-- Rollback: Drop Korean name formatting function

DROP VIEW IF EXISTS v_invalid_korean_names;
DROP FUNCTION IF EXISTS format_korean_name(TEXT, TEXT);

-- Recreate v_projects_with_dates without manager_name
DROP VIEW IF EXISTS v_projects_with_dates;

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

