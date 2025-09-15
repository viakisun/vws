-- 급여 관리 시스템 데이터베이스 스키마 생성

-- 1. 급여 구조 테이블
CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    allowances JSONB DEFAULT '[]',
    deductions JSONB DEFAULT '[]',
    total_allowances DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    effective_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 2. 급여 테이블
CREATE TABLE IF NOT EXISTS payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period VARCHAR(7) NOT NULL, -- YYYY-MM 형식
    pay_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid', 'cancelled')),
    total_employees INTEGER NOT NULL DEFAULT 0,
    total_gross_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_net_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(period)
);

-- 3. 직원별 급여 테이블
CREATE TABLE IF NOT EXISTS employee_payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    employee_id_number VARCHAR(20) NOT NULL,
    department VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    allowances JSONB DEFAULT '[]',
    deductions JSONB DEFAULT '[]',
    total_allowances DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
    gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'approved', 'paid', 'error')),
    pay_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (payroll_id) REFERENCES payrolls(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 4. 급여명세서 테이블
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    payroll_id UUID NOT NULL,
    period VARCHAR(7) NOT NULL, -- YYYY-MM 형식
    pay_date DATE NOT NULL,
    employee_info JSONB NOT NULL,
    salary_info JSONB NOT NULL,
    allowances JSONB DEFAULT '[]',
    deductions JSONB DEFAULT '[]',
    totals JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'viewed', 'downloaded')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by VARCHAR(50) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (payroll_id) REFERENCES payrolls(id) ON DELETE CASCADE
);

-- 5. 급여 이력 테이블
CREATE TABLE IF NOT EXISTS salary_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    period VARCHAR(7) NOT NULL, -- YYYY-MM 형식
    base_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_allowances DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
    gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('initial', 'promotion', 'demotion', 'adjustment', 'bonus', 'overtime', 'deduction', 'other')),
    change_reason TEXT NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 6. 급여 설정 테이블
CREATE TABLE IF NOT EXISTS salary_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id VARCHAR(50) NOT NULL,
    pay_day INTEGER NOT NULL DEFAULT 25, -- 급여 지급일 (매월 N일)
    overtime_rate DECIMAL(5,2) NOT NULL DEFAULT 1.5, -- 초과근무 수당 비율
    holiday_rate DECIMAL(5,2) NOT NULL DEFAULT 2.0, -- 휴일 수당 비율
    night_shift_rate DECIMAL(5,2) NOT NULL DEFAULT 1.3, -- 야간 수당 비율
    weekend_rate DECIMAL(5,2) NOT NULL DEFAULT 1.2, -- 주말 수당 비율
    tax_settings JSONB NOT NULL DEFAULT '{}',
    deduction_settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_salary_structures_employee_id ON salary_structures(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_status ON salary_structures(status);
CREATE INDEX IF NOT EXISTS idx_salary_structures_effective_date ON salary_structures(effective_date);

CREATE INDEX IF NOT EXISTS idx_payrolls_period ON payrolls(period);
CREATE INDEX IF NOT EXISTS idx_payrolls_status ON payrolls(status);
CREATE INDEX IF NOT EXISTS idx_payrolls_pay_date ON payrolls(pay_date);

CREATE INDEX IF NOT EXISTS idx_employee_payrolls_payroll_id ON employee_payrolls(payroll_id);
CREATE INDEX IF NOT EXISTS idx_employee_payrolls_employee_id ON employee_payrolls(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payrolls_status ON employee_payrolls(status);
CREATE INDEX IF NOT EXISTS idx_employee_payrolls_pay_date ON employee_payrolls(pay_date);

CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_payroll_id ON payslips(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period);

CREATE INDEX IF NOT EXISTS idx_salary_history_employee_id ON salary_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_period ON salary_history(period);

-- 기본 급여 설정 데이터 삽입
INSERT INTO salary_settings (id, company_id, pay_day, overtime_rate, holiday_rate, night_shift_rate, weekend_rate, tax_settings, deduction_settings)
VALUES (
    'default_salary_settings',
    'default_company',
    25, -- 매월 25일 급여 지급
    1.5, -- 초과근무 150%
    2.0, -- 휴일 200%
    1.3, -- 야간 130%
    1.2, -- 주말 120%
    '{
        "incomeTaxRate": 0.13,
        "localTaxRate": 0.013,
        "nationalPensionRate": 0.045,
        "healthInsuranceRate": 0.034,
        "employmentInsuranceRate": 0.008,
        "longTermCareRate": 0.0034
    }',
    '{
        "mealDeductionLimit": 100000,
        "transportDeductionLimit": 200000,
        "otherDeductionLimit": 50000
    }'
) ON CONFLICT (id) DO NOTHING;

-- 샘플 급여 구조 데이터 생성 (기존 직원들에 대해)
INSERT INTO salary_structures (id, employee_id, base_salary, allowances, deductions, total_allowances, total_deductions, net_salary, effective_date, created_by)
SELECT 
    'salary_' || e.id,
    e.id,
    CASE 
        WHEN e.position LIKE '%이사%' OR e.position LIKE '%대표%' THEN 8000000
        WHEN e.position LIKE '%팀장%' OR e.position LIKE '%부장%' THEN 6000000
        WHEN e.position LIKE '%차장%' OR e.position LIKE '%과장%' THEN 4500000
        WHEN e.position LIKE '%대리%' THEN 3500000
        WHEN e.position LIKE '%주임%' THEN 2800000
        ELSE 2500000
    END as base_salary,
    '[
        {"id": "housing", "type": "housing", "name": "주거비", "amount": 500000, "isTaxable": false, "isRegular": true},
        {"id": "transport", "type": "transport", "name": "교통비", "amount": 200000, "isTaxable": false, "isRegular": true},
        {"id": "meal", "type": "meal", "name": "식비", "amount": 300000, "isTaxable": false, "isRegular": true}
    ]'::jsonb as allowances,
    '[
        {"id": "income_tax", "type": "income_tax", "name": "소득세", "amount": 0, "isMandatory": true},
        {"id": "local_tax", "type": "local_tax", "name": "지방소득세", "amount": 0, "isMandatory": true},
        {"id": "national_pension", "type": "national_pension", "name": "국민연금", "amount": 0, "isMandatory": true},
        {"id": "health_insurance", "type": "health_insurance", "name": "건강보험", "amount": 0, "isMandatory": true},
        {"id": "employment_insurance", "type": "employment_insurance", "name": "고용보험", "amount": 0, "isMandatory": true}
    ]'::jsonb as deductions,
    1000000 as total_allowances,
    0 as total_deductions,
    CASE 
        WHEN e.position LIKE '%이사%' OR e.position LIKE '%대표%' THEN 9000000
        WHEN e.position LIKE '%팀장%' OR e.position LIKE '%부장%' THEN 7000000
        WHEN e.position LIKE '%차장%' OR e.position LIKE '%과장%' THEN 5500000
        WHEN e.position LIKE '%대리%' THEN 4500000
        WHEN e.position LIKE '%주임%' THEN 3800000
        ELSE 3500000
    END as net_salary,
    '2024-01-01'::date as effective_date,
    'system'
FROM employees e
WHERE NOT EXISTS (
    SELECT 1 FROM salary_structures ss WHERE ss.employee_id = e.id
);

-- 샘플 급여 데이터 생성 (현재 월 기준)
INSERT INTO payrolls (id, period, pay_date, status, total_employees, total_gross_salary, total_deductions, total_net_salary, created_by)
VALUES (
    'payroll_2024_12',
    '2024-12',
    '2024-12-25',
    'draft',
    (SELECT COUNT(*) FROM employees WHERE status = 'active'),
    0,
    0,
    0,
    'system'
) ON CONFLICT (period) DO NOTHING;

-- 샘플 직원별 급여 데이터 생성
INSERT INTO employee_payrolls (
    id, payroll_id, employee_id, employee_name, employee_id_number, 
    department, position, base_salary, allowances, deductions,
    total_allowances, total_deductions, gross_salary, net_salary,
    status, pay_date
)
SELECT 
    'emp_payroll_' || e.id || '_2024_12',
    'payroll_2024_12',
    e.id,
    COALESCE(e.first_name || ' ' || e.last_name, e.name),
    e.employee_id,
    e.department,
    e.position,
    ss.base_salary,
    ss.allowances,
    ss.deductions,
    ss.total_allowances,
    ss.total_deductions,
    ss.base_salary + ss.total_allowances,
    ss.net_salary,
    'calculated',
    '2024-12-25'
FROM employees e
JOIN salary_structures ss ON ss.employee_id = e.id
WHERE e.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM employee_payrolls ep 
    WHERE ep.employee_id = e.id AND ep.payroll_id = 'payroll_2024_12'
);

-- 급여 통계 업데이트
UPDATE payrolls 
SET 
    total_employees = (SELECT COUNT(*) FROM employee_payrolls WHERE payroll_id = 'payroll_2024_12'),
    total_gross_salary = (SELECT COALESCE(SUM(gross_salary), 0) FROM employee_payrolls WHERE payroll_id = 'payroll_2024_12'),
    total_deductions = (SELECT COALESCE(SUM(total_deductions), 0) FROM employee_payrolls WHERE payroll_id = 'payroll_2024_12'),
    total_net_salary = (SELECT COALESCE(SUM(net_salary), 0) FROM employee_payrolls WHERE payroll_id = 'payroll_2024_12')
WHERE id = 'payroll_2024_12';

COMMIT;
