-- 급여명세서 데이터베이스 테이블 생성

-- 급여명세서 테이블
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL, -- YYYY-MM 형식
    pay_date DATE NOT NULL,
    
    -- 직원 정보
    employee_name VARCHAR(255) NOT NULL,
    employee_id_number VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE,
    
    -- 급여 정보
    base_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_payments DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- 지급사항 (JSON 형태로 저장)
    payments JSONB NOT NULL DEFAULT '[]',
    
    -- 공제사항 (JSON 형태로 저장)
    deductions JSONB NOT NULL DEFAULT '[]',
    
    -- 상태
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, final, paid
    is_generated BOOLEAN NOT NULL DEFAULT false,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system',
    
    -- 제약조건
    UNIQUE(employee_id, period)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_period ON payslips(employee_id, period);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_payslip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_payslip_updated_at
    BEFORE UPDATE ON payslips
    FOR EACH ROW
    EXECUTE FUNCTION update_payslip_updated_at();

-- 기본 급여명세서 템플릿 테이블
CREATE TABLE IF NOT EXISTS payslip_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- 기본 지급사항 템플릿
    default_payments JSONB NOT NULL DEFAULT '[
        {"id": "basic_salary", "name": "기본급", "amount": 0, "type": "basic", "isTaxable": true},
        {"id": "position_allowance", "name": "직책수당", "amount": 0, "type": "allowance", "isTaxable": true},
        {"id": "bonus", "name": "상여금", "amount": 0, "type": "bonus", "isTaxable": true},
        {"id": "meal_allowance", "name": "식대", "amount": 300000, "type": "allowance", "isTaxable": false},
        {"id": "vehicle_maintenance", "name": "차량유지", "amount": 200000, "type": "allowance", "isTaxable": false},
        {"id": "annual_leave_allowance", "name": "연차수당", "amount": 0, "type": "allowance", "isTaxable": true},
        {"id": "year_end_settlement", "name": "연말정산", "amount": 0, "type": "settlement", "isTaxable": true}
    ]',
    
    -- 기본 공제사항 템플릿
    default_deductions JSONB NOT NULL DEFAULT '[
        {"id": "health_insurance", "name": "건강보험", "rate": 0.034, "type": "insurance", "amount": 0, "isMandatory": true},
        {"id": "long_term_care", "name": "장기요양보험", "rate": 0.0034, "type": "insurance", "amount": 0, "isMandatory": true},
        {"id": "national_pension", "name": "국민연금", "rate": 0.045, "type": "pension", "amount": 0, "isMandatory": true},
        {"id": "employment_insurance", "name": "고용보험", "rate": 0.008, "type": "insurance", "amount": 0, "isMandatory": true},
        {"id": "income_tax", "name": "갑근세", "rate": 0.13, "type": "tax", "amount": 0, "isMandatory": true},
        {"id": "local_tax", "name": "주민세", "rate": 0.013, "type": "tax", "amount": 0, "isMandatory": true},
        {"id": "other", "name": "기타", "rate": 0, "type": "other", "amount": 0, "isMandatory": false}
    ]',
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약조건
    UNIQUE(employee_id)
);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER trigger_update_payslip_template_updated_at
    BEFORE UPDATE ON payslip_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_payslip_updated_at();

-- 기존 직원들에 대한 기본 템플릿 생성
INSERT INTO payslip_templates (employee_id, default_payments, default_deductions)
SELECT 
    e.id,
    '[
        {"id": "basic_salary", "name": "기본급", "amount": 0, "type": "basic", "isTaxable": true},
        {"id": "position_allowance", "name": "직책수당", "amount": 0, "type": "allowance", "isTaxable": true},
        {"id": "bonus", "name": "상여금", "amount": 0, "type": "bonus", "isTaxable": true},
        {"id": "meal_allowance", "name": "식대", "amount": 300000, "type": "allowance", "isTaxable": false},
        {"id": "vehicle_maintenance", "name": "차량유지", "amount": 200000, "type": "allowance", "isTaxable": false},
        {"id": "annual_leave_allowance", "name": "연차수당", "amount": 0, "type": "allowance", "isTaxable": true},
        {"id": "year_end_settlement", "name": "연말정산", "amount": 0, "type": "settlement", "isTaxable": true}
    ]'::jsonb,
    '[
        {"id": "health_insurance", "name": "건강보험", "rate": 0.034, "type": "insurance", "amount": 0, "isMandatory": true},
        {"id": "long_term_care", "name": "장기요양보험", "rate": 0.0034, "type": "insurance", "amount": 0, "isMandatory": true},
        {"id": "national_pension", "name": "국민연금", "rate": 0.045, "type": "pension", "amount": 0, "isMandatory": true},
        {"id": "employment_insurance", "name": "고용보험", "rate": 0.008, "type": "insurance", "amount": 0, "isMandatory": true},
        {"id": "income_tax", "name": "갑근세", "rate": 0.13, "type": "tax", "amount": 0, "isMandatory": true},
        {"id": "local_tax", "name": "주민세", "rate": 0.013, "type": "tax", "amount": 0, "isMandatory": true},
        {"id": "other", "name": "기타", "rate": 0, "type": "other", "amount": 0, "isMandatory": false}
    ]'::jsonb
FROM employees e
WHERE NOT EXISTS (
    SELECT 1 FROM payslip_templates pt WHERE pt.employee_id = e.id
);

-- 샘플 급여명세서 데이터 생성 (2024년 9월)
INSERT INTO payslips (
    employee_id, 
    period, 
    pay_date, 
    employee_name, 
    employee_id_number, 
    department, 
    position, 
    hire_date,
    base_salary,
    total_payments,
    total_deductions,
    net_salary,
    payments,
    deductions,
    status,
    is_generated
)
SELECT 
    e.id,
    '2024-09',
    '2024-09-30',
    COALESCE(e.first_name || ' ' || e.last_name, e.name),
    e.employee_id,
    COALESCE(e.department, '부서없음'),
    COALESCE(e.position, '연구원'),
    e.hire_date,
    COALESCE(sc.annual_salary / 12, 3000000), -- 월급여 (연봉/12)
    COALESCE(sc.annual_salary / 12, 3000000) + 500000, -- 기본급 + 수당
    0, -- 공제액은 0으로 초기화
    COALESCE(sc.annual_salary / 12, 3000000) + 500000, -- 지급총액
    '[
        {"id": "basic_salary", "name": "기본급", "amount": ' || COALESCE(sc.annual_salary / 12, 3000000) || ', "type": "basic", "isTaxable": true},
        {"id": "position_allowance", "name": "직책수당", "amount": ' || ROUND(COALESCE(sc.annual_salary / 12, 3000000) * 0.1) || ', "type": "allowance", "isTaxable": true},
        {"id": "bonus", "name": "상여금", "amount": 0, "type": "bonus", "isTaxable": true},
        {"id": "meal_allowance", "name": "식대", "amount": 300000, "type": "allowance", "isTaxable": false},
        {"id": "vehicle_maintenance", "name": "차량유지", "amount": 200000, "type": "allowance", "isTaxable": false},
        {"id": "annual_leave_allowance", "name": "연차수당", "amount": 0, "type": "allowance", "isTaxable": true},
        {"id": "year_end_settlement", "name": "연말정산", "amount": 0, "type": "settlement", "isTaxable": true}
    ]'::jsonb,
    '[
        {"id": "health_insurance", "name": "건강보험", "rate": 0.034, "type": "insurance", "amount": 0, "isMandatory": true},
        {"id": "long_term_care", "name": "장기요양보험", "rate": 0.0034, "type": "insurance", "amount": 0, "isMandatory": true},
        {"id": "national_pension", "name": "국민연금", "rate": 0.045, "type": "pension", "amount": 0, "isMandatory": true},
        {"id": "employment_insurance", "name": "고용보험", "rate": 0.008, "type": "insurance", "amount": 0, "isMandatory": true},
        {"id": "income_tax", "name": "갑근세", "rate": 0.13, "type": "tax", "amount": 0, "isMandatory": true},
        {"id": "local_tax", "name": "주민세", "rate": 0.013, "type": "tax", "amount": 0, "isMandatory": true},
        {"id": "other", "name": "기타", "rate": 0, "type": "other", "amount": 0, "isMandatory": false}
    ]'::jsonb,
    'draft',
    false
FROM employees e
LEFT JOIN salary_contracts sc ON e.id = sc.employee_id AND sc.status = 'active'
WHERE NOT EXISTS (
    SELECT 1 FROM payslips p WHERE p.employee_id = e.id AND p.period = '2024-09'
)
LIMIT 5; -- 샘플로 5명만 생성

COMMENT ON TABLE payslips IS '급여명세서 정보를 저장하는 테이블';
COMMENT ON TABLE payslip_templates IS '직원별 급여명세서 기본 템플릿을 저장하는 테이블';
COMMENT ON COLUMN payslips.period IS '급여 기간 (YYYY-MM 형식)';
COMMENT ON COLUMN payslips.payments IS '지급사항 정보 (JSON 배열)';
COMMENT ON COLUMN payslips.deductions IS '공제사항 정보 (JSON 배열)';
COMMENT ON COLUMN payslips.status IS '급여명세서 상태 (draft, final, paid)';
