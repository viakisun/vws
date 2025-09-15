-- 급여 계약 테이블 성능 최적화를 위한 인덱스 추가

-- 1. 기본 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_salary_contracts_employee_id ON salary_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_contracts_status ON salary_contracts(status);
CREATE INDEX IF NOT EXISTS idx_salary_contracts_contract_type ON salary_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_salary_contracts_start_date ON salary_contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_salary_contracts_end_date ON salary_contracts(end_date);

-- 2. 복합 인덱스 (자주 함께 사용되는 조건들)
CREATE INDEX IF NOT EXISTS idx_salary_contracts_status_start_date ON salary_contracts(status, start_date);
CREATE INDEX IF NOT EXISTS idx_salary_contracts_employee_status ON salary_contracts(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_salary_contracts_type_status ON salary_contracts(contract_type, status);

-- 3. 직원 테이블 인덱스 (JOIN 성능 향상)
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position);
CREATE INDEX IF NOT EXISTS idx_employees_department_position ON employees(department, position);

-- 4. 텍스트 검색용 인덱스 (이름, 사번 검색)
CREATE INDEX IF NOT EXISTS idx_employees_name_search ON employees USING gin(to_tsvector('korean', last_name || ' ' || first_name));
CREATE INDEX IF NOT EXISTS idx_employees_employee_id_search ON employees(employee_id);

-- 5. 날짜 범위 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_salary_contracts_date_range ON salary_contracts(start_date, end_date);

-- 6. 정렬용 인덱스
CREATE INDEX IF NOT EXISTS idx_salary_contracts_created_at ON salary_contracts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_salary_contracts_updated_at ON salary_contracts(updated_at DESC);

-- 7. 통계 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_salary_contracts_active_contracts ON salary_contracts(status, start_date, end_date) WHERE status = 'active';

-- 인덱스 생성 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('salary_contracts', 'employees')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
