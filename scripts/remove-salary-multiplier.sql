-- 급여 배수(salary_multiplier) 제거 마이그레이션 스크립트
-- 실행 전에 데이터베이스 백업을 권장합니다.

-- global_factors 테이블에서 salary_multiplier 제거
DELETE FROM global_factors 
WHERE factor_name = 'salary_multiplier';

-- 제거 확인
SELECT factor_name, factor_value, description 
FROM global_factors 
WHERE factor_name = 'salary_multiplier';

-- 마이그레이션 완료 메시지
SELECT 'Salary multiplier removed successfully from global_factors table' as status;
