-- 급여 시스템 데이터베이스 정리 스크립트
-- 복잡한 구조를 단순화하여 데이터 일관성 확보

-- 1. 기존 불필요한 테이블들 백업 후 삭제
-- (실제 운영환경에서는 데이터 백업 후 진행)

-- 2. 새로운 깔끔한 payslips 테이블 생성
CREATE TABLE IF NOT EXISTS payslips_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL, -- YYYY-MM 형식
    pay_date DATE NOT NULL,
    
    -- 급여 정보
    base_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_payments DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- 상세 내역 (JSON 형태로 저장)
    payments JSONB NOT NULL DEFAULT '[]',
    deductions JSONB NOT NULL DEFAULT '[]',
    
    -- 상태 관리
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'paid', 'cancelled')),
    is_generated BOOLEAN NOT NULL DEFAULT false,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system',
    
    -- 제약조건: 한 직원당 월별 하나의 급여명세서
    UNIQUE(employee_id, period)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payslips_new_employee_id ON payslips_new(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_new_period ON payslips_new(period);
CREATE INDEX IF NOT EXISTS idx_payslips_new_status ON payslips_new(status);
CREATE INDEX IF NOT EXISTS idx_payslips_new_employee_period ON payslips_new(employee_id, period);

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_payslips_new_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payslips_new_updated_at
    BEFORE UPDATE ON payslips_new
    FOR EACH ROW
    EXECUTE FUNCTION update_payslips_new_updated_at();

-- 5. 기존 데이터 마이그레이션 (있는 경우)
-- employee_payrolls에서 payslips_new로 데이터 이전
INSERT INTO payslips_new (
    employee_id, period, pay_date,
    base_salary, total_payments, total_deductions, net_salary,
    payments, deductions, status, is_generated,
    created_at, updated_at, created_by, updated_by
)
SELECT 
    ep.employee_id,
    p.period,
    ep.pay_date,
    ep.base_salary,
    ep.gross_salary as total_payments,
    ep.total_deductions,
    ep.net_salary,
    ep.allowances as payments,
    ep.deductions,
    ep.status,
    true as is_generated,
    ep.created_at,
    ep.updated_at,
    'migration' as created_by,
    'migration' as updated_by
FROM employee_payrolls ep
JOIN payrolls p ON ep.payroll_id = p.id
WHERE NOT EXISTS (
    SELECT 1 FROM payslips_new pn 
    WHERE pn.employee_id = ep.employee_id 
    AND pn.period = p.period
);

-- 6. 기존 테이블들 정리 (백업 후 삭제)
-- 주의: 실제 운영환경에서는 데이터 백업 후 진행
-- DROP TABLE IF EXISTS employee_payrolls CASCADE;
-- DROP TABLE IF EXISTS payrolls CASCADE;
-- DROP TABLE IF EXISTS salary_structures CASCADE;
-- DROP TABLE IF EXISTS salary_history CASCADE;

-- 7. 기존 payslips 테이블을 payslips_old로 백업
-- ALTER TABLE payslips RENAME TO payslips_old;

-- 8. 새로운 테이블을 payslips로 이름 변경
-- ALTER TABLE payslips_new RENAME TO payslips;

-- 9. 샘플 데이터 생성 (테스트용)
INSERT INTO payslips_new (
    employee_id, period, pay_date,
    base_salary, total_payments, total_deductions, net_salary,
    payments, deductions, status, is_generated
)
SELECT 
    e.id,
    '2024-12',
    '2024-12-25',
    CASE 
        WHEN e.position LIKE '%대표%' THEN 10000000
        WHEN e.position LIKE '%연구소장%' THEN 7500000
        WHEN e.position LIKE '%책임연구원%' THEN 5833333
        WHEN e.position LIKE '%선임연구원%' OR e.position LIKE '%선임디자이너%' THEN 4583333
        WHEN e.position LIKE '%연구원%' THEN 2916667
        WHEN e.position LIKE '%전략기획실%' THEN 5000000
        ELSE 3333333
    END as base_salary,
    CASE 
        WHEN e.position LIKE '%대표%' THEN 11000000
        WHEN e.position LIKE '%연구소장%' THEN 8250000
        WHEN e.position LIKE '%책임연구원%' THEN 6416667
        WHEN e.position LIKE '%선임연구원%' OR e.position LIKE '%선임디자이너%' THEN 5041667
        WHEN e.position LIKE '%연구원%' THEN 3208333
        WHEN e.position LIKE '%전략기획실%' THEN 5500000
        ELSE 3666667
    END as total_payments,
    CASE 
        WHEN e.position LIKE '%대표%' THEN 2567000
        WHEN e.position LIKE '%연구소장%' THEN 1926000
        WHEN e.position LIKE '%책임연구원%' THEN 1498000
        WHEN e.position LIKE '%선임연구원%' OR e.position LIKE '%선임디자이너%' THEN 1177000
        WHEN e.position LIKE '%연구원%' THEN 749000
        WHEN e.position LIKE '%전략기획실%' THEN 1284000
        ELSE 856000
    END as total_deductions,
    CASE 
        WHEN e.position LIKE '%대표%' THEN 8433000
        WHEN e.position LIKE '%연구소장%' THEN 6324000
        WHEN e.position LIKE '%책임연구원%' THEN 4918667
        WHEN e.position LIKE '%선임연구원%' OR e.position LIKE '%선임디자이너%' THEN 3864667
        WHEN e.position LIKE '%연구원%' THEN 2459333
        WHEN e.position LIKE '%전략기획실%' THEN 4216000
        ELSE 2810667
    END as net_salary,
    '[
        {"id": "basic_salary", "name": "기본급", "amount": ' || 
        CASE 
            WHEN e.position LIKE '%대표%' THEN 10000000
            WHEN e.position LIKE '%연구소장%' THEN 7500000
            WHEN e.position LIKE '%책임연구원%' THEN 5833333
            WHEN e.position LIKE '%선임연구원%' OR e.position LIKE '%선임디자이너%' THEN 4583333
            WHEN e.position LIKE '%연구원%' THEN 2916667
            WHEN e.position LIKE '%전략기획실%' THEN 5000000
            ELSE 3333333
        END || ', "type": "basic", "isTaxable": true},
        {"id": "meal_allowance", "name": "식대", "amount": 300000, "type": "allowance", "isTaxable": false},
        {"id": "transport_allowance", "name": "교통비", "amount": 200000, "type": "allowance", "isTaxable": false},
        {"id": "housing_allowance", "name": "주거비", "amount": 500000, "type": "allowance", "isTaxable": false}
    ]' as payments,
    '[
        {"id": "income_tax", "name": "소득세", "amount": ' || 
        CASE 
            WHEN e.position LIKE '%대표%' THEN 1430000
            WHEN e.position LIKE '%연구소장%' THEN 1072500
            WHEN e.position LIKE '%책임연구원%' THEN 834167
            WHEN e.position LIKE '%선임연구원%' OR e.position LIKE '%선임디자이너%' THEN 655417
            WHEN e.position LIKE '%연구원%' THEN 417083
            WHEN e.position LIKE '%전략기획실%' THEN 715000
            ELSE 476667
        END || ', "type": "tax", "isMandatory": true},
        {"id": "health_insurance", "name": "건강보험", "amount": ' || 
        CASE 
            WHEN e.position LIKE '%대표%' THEN 374000
            WHEN e.position LIKE '%연구소장%' THEN 280500
            WHEN e.position LIKE '%책임연구원%' THEN 218167
            WHEN e.position LIKE '%선임연구원%' OR e.position LIKE '%선임디자이너%' THEN 171417
            WHEN e.position LIKE '%연구원%' THEN 109083
            WHEN e.position LIKE '%전략기획실%' THEN 187000
            ELSE 124667
        END || ', "type": "insurance", "isMandatory": true},
        {"id": "national_pension", "name": "국민연금", "amount": ' || 
        CASE 
            WHEN e.position LIKE '%대표%' THEN 495000
            WHEN e.position LIKE '%연구소장%' THEN 371250
            WHEN e.position LIKE '%책임연구원%' THEN 288750
            WHEN e.position LIKE '%선임연구원%' OR e.position LIKE '%선임디자이너%' THEN 226875
            WHEN e.position LIKE '%연구원%' THEN 144375
            WHEN e.position LIKE '%전략기획실%' THEN 247500
            ELSE 165000
        END || ', "type": "pension", "isMandatory": true}
    ]' as deductions,
    'final' as status,
    true as is_generated
FROM employees e
WHERE e.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM payslips_new pn 
    WHERE pn.employee_id = e.id 
    AND pn.period = '2024-12'
);

COMMIT;
