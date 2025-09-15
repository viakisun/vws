-- 현재 직원 데이터를 기반으로 급여 데이터 생성

-- 1. 기존 급여 데이터 정리
DELETE FROM employee_payrolls WHERE payroll_id IN (SELECT id FROM payrolls WHERE period = '2024-12');
DELETE FROM payrolls WHERE period = '2024-12';

-- 2. 급여 구조 데이터 생성 (직급별 기본급 설정)
INSERT INTO salary_structures (id, employee_id, base_salary, allowances, deductions, total_allowances, total_deductions, net_salary, effective_date, created_by)
SELECT 
    gen_random_uuid(),
    e.id,
    CASE 
        WHEN e.position LIKE '%대표%' THEN 12000000
        WHEN e.position LIKE '%연구소장%' THEN 9000000
        WHEN e.position LIKE '%책임연구원%' THEN 7000000
        WHEN e.position LIKE '%선임연구원%' OR e.position LIKE '%선임디자이너%' THEN 5500000
        WHEN e.position LIKE '%연구원%' THEN 3500000
        WHEN e.position LIKE '%전략기획실%' THEN 6000000
        ELSE 4000000
    END as base_salary,
    '[
        {"id": "housing", "type": "housing", "name": "주거비", "amount": 500000, "isTaxable": false, "isRegular": true},
        {"id": "transport", "type": "transport", "name": "교통비", "amount": 200000, "isTaxable": false, "isRegular": true},
        {"id": "meal", "type": "meal", "name": "식비", "amount": 300000, "isTaxable": false, "isRegular": true},
        {"id": "overtime", "type": "overtime", "name": "초과근무수당", "amount": 0, "isTaxable": true, "isRegular": false},
        {"id": "bonus", "type": "bonus", "name": "성과급", "amount": 0, "isTaxable": true, "isRegular": false}
    ]'::jsonb as allowances,
    '[
        {"id": "income_tax", "type": "income_tax", "name": "소득세", "amount": 0, "isMandatory": true, "rate": 0.13},
        {"id": "local_tax", "type": "local_tax", "name": "지방소득세", "amount": 0, "isMandatory": true, "rate": 0.013},
        {"id": "national_pension", "type": "national_pension", "name": "국민연금", "amount": 0, "isMandatory": true, "rate": 0.045},
        {"id": "health_insurance", "type": "health_insurance", "name": "건강보험", "amount": 0, "isMandatory": true, "rate": 0.034},
        {"id": "employment_insurance", "type": "employment_insurance", "name": "고용보험", "amount": 0, "isMandatory": true, "rate": 0.008},
        {"id": "long_term_care", "type": "long_term_care", "name": "장기요양보험", "amount": 0, "isMandatory": true, "rate": 0.0034}
    ]'::jsonb as deductions,
    1000000 as total_allowances,
    0 as total_deductions,
    CASE 
        WHEN e.position LIKE '%대표%' THEN 13000000
        WHEN e.position LIKE '%연구소장%' THEN 10000000
        WHEN e.position LIKE '%책임연구원%' THEN 8000000
        WHEN e.position LIKE '%선임연구원%' OR e.position LIKE '%선임디자이너%' THEN 6500000
        WHEN e.position LIKE '%연구원%' THEN 4500000
        WHEN e.position LIKE '%전략기획실%' THEN 7000000
        ELSE 5000000
    END as net_salary,
    '2024-01-01'::date as effective_date,
    'system'
FROM employees e
WHERE e.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM salary_structures ss WHERE ss.employee_id = e.id
);

-- 3. 2024년 12월 급여 마스터 생성
INSERT INTO payrolls (id, period, pay_date, status, total_employees, total_gross_salary, total_deductions, total_net_salary, created_by)
VALUES (
    gen_random_uuid(),
    '2024-12',
    '2024-12-25',
    'calculated',
    0,
    0,
    0,
    0,
    'system'
);

-- 4. 직원별 급여 데이터 생성
INSERT INTO employee_payrolls (
    id, payroll_id, employee_id, employee_name, employee_id_number, 
    department, position, base_salary, allowances, deductions,
    total_allowances, total_deductions, gross_salary, net_salary,
    status, pay_date
)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM payrolls WHERE period = '2024-12'),
    e.id,
    COALESCE(e.first_name || e.last_name, e.first_name || ' ' || e.last_name),
    e.employee_id,
    e.department,
    e.position,
    ss.base_salary,
    ss.allowances,
    ss.deductions,
    ss.total_allowances,
    -- 공제액 계산 (소득세, 4대보험)
    ROUND((ss.base_salary + ss.total_allowances) * 0.2334), -- 13% + 1.3% + 4.5% + 3.4% + 0.8% + 0.34%
    ss.base_salary + ss.total_allowances,
    ss.base_salary + ss.total_allowances - ROUND((ss.base_salary + ss.total_allowances) * 0.2334),
    'calculated',
    '2024-12-25'
FROM employees e
JOIN salary_structures ss ON ss.employee_id = e.id
WHERE e.status = 'active';

-- 5. 급여 통계 업데이트
UPDATE payrolls 
SET 
    total_employees = (SELECT COUNT(*) FROM employee_payrolls WHERE payroll_id = (SELECT id FROM payrolls WHERE period = '2024-12')),
    total_gross_salary = (SELECT COALESCE(SUM(gross_salary), 0) FROM employee_payrolls WHERE payroll_id = (SELECT id FROM payrolls WHERE period = '2024-12')),
    total_deductions = (SELECT COALESCE(SUM(total_deductions), 0) FROM employee_payrolls WHERE payroll_id = (SELECT id FROM payrolls WHERE period = '2024-12')),
    total_net_salary = (SELECT COALESCE(SUM(net_salary), 0) FROM employee_payrolls WHERE payroll_id = (SELECT id FROM payrolls WHERE period = '2024-12'))
WHERE period = '2024-12';

-- 6. 급여 이력 데이터 생성 (최근 6개월)
INSERT INTO salary_history (
    id, employee_id, period, base_salary, total_allowances, total_deductions, 
    gross_salary, net_salary, change_type, change_reason, effective_date, created_by
)
SELECT 
    gen_random_uuid(),
    e.id,
    period,
    ss.base_salary,
    ss.total_allowances,
    ROUND((ss.base_salary + ss.total_allowances) * 0.2334),
    ss.base_salary + ss.total_allowances,
    ss.base_salary + ss.total_allowances - ROUND((ss.base_salary + ss.total_allowances) * 0.2334),
    CASE 
        WHEN period = '2024-07' THEN 'initial'
        ELSE 'adjustment'
    END,
    CASE 
        WHEN period = '2024-07' THEN '초기 급여 설정'
        ELSE '정기 급여 지급'
    END,
    (period || '-25')::date,
    'system'
FROM employees e
JOIN salary_structures ss ON ss.employee_id = e.id
CROSS JOIN (
    SELECT '2024-07' as period
    UNION ALL SELECT '2024-08'
    UNION ALL SELECT '2024-09'
    UNION ALL SELECT '2024-10'
    UNION ALL SELECT '2024-11'
    UNION ALL SELECT '2024-12'
) periods
WHERE e.status = 'active';

-- 7. 결과 확인
SELECT 
    '급여 구조' as type,
    COUNT(*) as count
FROM salary_structures
UNION ALL
SELECT 
    '급여 마스터' as type,
    COUNT(*) as count
FROM payrolls
UNION ALL
SELECT 
    '직원별 급여' as type,
    COUNT(*) as count
FROM employee_payrolls
UNION ALL
SELECT 
    '급여 이력' as type,
    COUNT(*) as count
FROM salary_history;

-- 8. 급여 통계 요약
SELECT 
    '총 직원 수' as 항목,
    total_employees::text as 값
FROM payrolls WHERE period = '2024-12'
UNION ALL
SELECT 
    '총 급여액',
    TO_CHAR(total_gross_salary, 'FM999,999,999') || '원'
FROM payrolls WHERE period = '2024-12'
UNION ALL
SELECT 
    '총 공제액',
    TO_CHAR(total_deductions, 'FM999,999,999') || '원'
FROM payrolls WHERE period = '2024-12'
UNION ALL
SELECT 
    '총 실지급액',
    TO_CHAR(total_net_salary, 'FM999,999,999') || '원'
FROM payrolls WHERE period = '2024-12';

COMMIT;
