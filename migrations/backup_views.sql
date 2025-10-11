-- VIEW: user_effective_roles
CREATE OR REPLACE VIEW user_effective_roles AS
 WITH RECURSIVE role_hierarchy AS (
         SELECT ur.employee_id AS user_id,
            r.id AS role_id,
            r.code,
            r.name,
            r.name_ko,
            r.priority,
            'direct'::text AS assignment_type
           FROM employee_roles ur
             JOIN roles r ON r.id = ur.role_id
          WHERE ur.is_active = true AND r.is_active = true AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
        UNION
         SELECT rh.user_id,
            r.id AS role_id,
            r.code,
            r.name,
            r.name_ko,
            r.priority,
            'inherited'::text AS assignment_type
           FROM role_hierarchy rh
             JOIN roles r ON r.id = (( SELECT roles.parent_role_id
                   FROM roles
                  WHERE roles.id = rh.role_id))
          WHERE r.is_active = true
        )
 SELECT DISTINCT user_id,
    role_id,
    code,
    name,
    name_ko,
    priority,
    assignment_type
   FROM role_hierarchy;;


-- VIEW: active_salary_contracts
CREATE OR REPLACE VIEW active_salary_contracts AS
 SELECT sc.id,
    sc.employee_id,
    sc.annual_salary,
    sc.start_date,
    sc.end_date,
    sc.contract_type,
    sc.status,
    sc.created_at,
    sc.updated_at,
    sc.monthly_salary,
    sc.notes,
    sc.created_by,
    concat(e.last_name, e.first_name) AS employee_name,
    e.employee_id AS employee_id_number,
    e.department,
    e."position"
   FROM salary_contracts sc
     JOIN employees e ON sc.employee_id = e.id
  WHERE sc.status::text = 'active'::text AND sc.start_date <= CURRENT_DATE AND (sc.end_date IS NULL OR sc.end_date >= CURRENT_DATE);;


-- VIEW: salary_contract_history
CREATE OR REPLACE VIEW salary_contract_history AS
 SELECT sc.id,
    sc.employee_id,
    sc.annual_salary,
    sc.start_date,
    sc.end_date,
    sc.contract_type,
    sc.status,
    sc.created_at,
    sc.updated_at,
    sc.monthly_salary,
    sc.notes,
    sc.created_by,
    concat(e.last_name, e.first_name) AS employee_name,
    e.employee_id AS employee_id_number,
    e.department,
    e."position",
        CASE
            WHEN sc.end_date IS NULL THEN '무기한'::text
            ELSE to_char(sc.end_date::timestamp with time zone, 'YYYY-MM-DD'::text)
        END AS contract_end_display,
        CASE
            WHEN sc.status::text = 'active'::text AND sc.end_date IS NULL THEN '진행중 (무기한)'::character varying
            WHEN sc.status::text = 'active'::text AND sc.end_date >= CURRENT_DATE THEN '진행중'::character varying
            WHEN sc.status::text = 'expired'::text OR sc.end_date < CURRENT_DATE THEN '만료됨'::character varying
            ELSE sc.status
        END AS status_display
   FROM salary_contracts sc
     JOIN employees e ON sc.employee_id = e.id
  ORDER BY sc.start_date DESC;;
