-- 025_convert_budget_amounts_to_bigint.sql
-- 모든 사업비 관련 금액 컬럼을 DECIMAL에서 BIGINT로 변경
-- 원(KRW) 단위를 사용하며, 소수점이 필요없으므로 정수형으로 변경

-- 1. project_budgets 테이블의 금액 컬럼 변경
-- 실제 존재하는 컬럼만 변경
-- 먼저 어떤 컬럼들이 있는지 확인
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  -- personnel_cost 컬럼들
  ALTER TABLE project_budgets
    ALTER COLUMN personnel_cost TYPE BIGINT USING FLOOR(personnel_cost),
    ALTER COLUMN personnel_cost_cash TYPE BIGINT USING FLOOR(personnel_cost_cash),
    ALTER COLUMN personnel_cost_in_kind TYPE BIGINT USING FLOOR(personnel_cost_in_kind);

  -- research_material_cost 컬럼들
  ALTER TABLE project_budgets
    ALTER COLUMN research_material_cost TYPE BIGINT USING FLOOR(research_material_cost),
    ALTER COLUMN research_material_cost_cash TYPE BIGINT USING FLOOR(research_material_cost_cash),
    ALTER COLUMN research_material_cost_in_kind TYPE BIGINT USING FLOOR(research_material_cost_in_kind);

  -- research_activity_cost 컬럼들
  ALTER TABLE project_budgets
    ALTER COLUMN research_activity_cost TYPE BIGINT USING FLOOR(research_activity_cost),
    ALTER COLUMN research_activity_cost_cash TYPE BIGINT USING FLOOR(research_activity_cost_cash),
    ALTER COLUMN research_activity_cost_in_kind TYPE BIGINT USING FLOOR(research_activity_cost_in_kind);

  -- indirect_cost 컬럼들
  ALTER TABLE project_budgets
    ALTER COLUMN indirect_cost TYPE BIGINT USING FLOOR(indirect_cost),
    ALTER COLUMN indirect_cost_cash TYPE BIGINT USING FLOOR(indirect_cost_cash),
    ALTER COLUMN indirect_cost_in_kind TYPE BIGINT USING FLOOR(indirect_cost_in_kind);

  -- 연간 예산 컬럼들
  ALTER TABLE project_budgets
    ALTER COLUMN government_funding_amount TYPE BIGINT USING FLOOR(government_funding_amount),
    ALTER COLUMN company_cash_amount TYPE BIGINT USING FLOOR(company_cash_amount),
    ALTER COLUMN company_in_kind_amount TYPE BIGINT USING FLOOR(company_in_kind_amount);

  -- research_stipend 컬럼들 (있다면)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_budgets' AND column_name = 'research_stipend'
  ) INTO col_exists;
  
  IF col_exists THEN
    ALTER TABLE project_budgets
      ALTER COLUMN research_stipend TYPE BIGINT USING FLOOR(research_stipend);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_budgets' AND column_name = 'research_stipend_cash'
  ) INTO col_exists;
  
  IF col_exists THEN
    ALTER TABLE project_budgets
      ALTER COLUMN research_stipend_cash TYPE BIGINT USING FLOOR(research_stipend_cash),
      ALTER COLUMN research_stipend_in_kind TYPE BIGINT USING FLOOR(research_stipend_in_kind);
  END IF;
  
  RAISE NOTICE '✅ project_budgets 테이블 변환 완료';
END $$;

-- 3. project_annual_budgets 테이블의 금액 컬럼 변경 (있다면)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_annual_budgets') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_annual_budgets' AND column_name = 'government_funding_amount') THEN
      ALTER TABLE project_annual_budgets
        ALTER COLUMN government_funding_amount TYPE BIGINT USING FLOOR(government_funding_amount),
        ALTER COLUMN company_cash_amount TYPE BIGINT USING FLOOR(company_cash_amount),
        ALTER COLUMN company_in_kind_amount TYPE BIGINT USING FLOOR(company_in_kind_amount),
        ALTER COLUMN total_amount TYPE BIGINT USING FLOOR(total_amount);
    END IF;
  END IF;
END $$;

-- 4. research_costs 테이블의 금액 컬럼 변경 (있다면)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'research_costs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_costs' AND column_name = 'personnel_cost_cash') THEN
      ALTER TABLE research_costs
        ALTER COLUMN personnel_cost_cash TYPE BIGINT USING FLOOR(personnel_cost_cash),
        ALTER COLUMN personnel_cost_in_kind TYPE BIGINT USING FLOOR(personnel_cost_in_kind),
        ALTER COLUMN research_material_cost_cash TYPE BIGINT USING FLOOR(research_material_cost_cash),
        ALTER COLUMN research_material_cost_in_kind TYPE BIGINT USING FLOOR(research_material_cost_in_kind),
        ALTER COLUMN research_activity_cost_cash TYPE BIGINT USING FLOOR(research_activity_cost_cash),
        ALTER COLUMN research_activity_cost_in_kind TYPE BIGINT USING FLOOR(research_activity_cost_in_kind),
        ALTER COLUMN research_allowance_cash TYPE BIGINT USING FLOOR(research_allowance_cash),
        ALTER COLUMN research_allowance_in_kind TYPE BIGINT USING FLOOR(research_allowance_in_kind),
        ALTER COLUMN indirect_cost_cash TYPE BIGINT USING FLOOR(indirect_cost_cash),
        ALTER COLUMN indirect_cost_in_kind TYPE BIGINT USING FLOOR(indirect_cost_in_kind),
        ALTER COLUMN total_cash TYPE BIGINT USING FLOOR(total_cash),
        ALTER COLUMN total_in_kind TYPE BIGINT USING FLOOR(total_in_kind),
        ALTER COLUMN total_cost TYPE BIGINT USING FLOOR(total_cost);
    END IF;
  END IF;
END $$;

-- 5. evidence_items 테이블의 금액 컬럼 변경 (있다면)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evidence_items') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'evidence_items' AND column_name = 'amount') THEN
      ALTER TABLE evidence_items
        ALTER COLUMN amount TYPE BIGINT USING FLOOR(amount);
    END IF;
  END IF;
END $$;

-- 변경 내역 확인 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 모든 사업비 금액 컬럼이 BIGINT로 변경되었습니다.';
  RAISE NOTICE '원(KRW) 단위로 정수형 저장됩니다.';
END $$;

