// Project Management Setup API
// 프로젝트 관리 시스템 데이터베이스 설정

import { json } from '@sveltejs/kit'
import { query } from '$lib/database/connection'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger';

export const POST: RequestHandler = async () => {
  try {
    // 프로젝트 관리 시스템 테이블 생성
    const setupQueries = [
      // 1. 프로젝트 기본 정보 테이블 (기존 테이블이 있다면 컬럼 추가)
      `CREATE TABLE IF NOT EXISTS projects (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				code VARCHAR(50) UNIQUE NOT NULL,
				title VARCHAR(255) NOT NULL,
				description TEXT,
				sponsor VARCHAR(255),
				sponsor_name VARCHAR(255),
				sponsor_type VARCHAR(50) DEFAULT 'government',
				start_date DATE,
				end_date DATE,
				manager_id UUID REFERENCES employees(id),
				status VARCHAR(50) DEFAULT 'planning',
				budget_total DECIMAL(15,2),
				budget_currency VARCHAR(3) DEFAULT 'KRW',
				research_type VARCHAR(50),
				technology_area VARCHAR(100),
				priority VARCHAR(50) DEFAULT 'medium',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)`,

      // 2. 프로젝트 참여자 테이블
      `CREATE TABLE IF NOT EXISTS project_members (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
				employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
				role VARCHAR(100) NOT NULL,
				start_date DATE NOT NULL,
				end_date DATE,
				participation_rate INTEGER NOT NULL CHECK (participation_rate >= 0 AND participation_rate <= 100),
				monthly_salary DECIMAL(12,2),
				status VARCHAR(50) DEFAULT 'active',
				notes TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(project_id, employee_id, start_date)
			)`,

      // 3. 연차별 사업비 관리 테이블
      `CREATE TABLE IF NOT EXISTS project_budgets (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
				fiscal_year INTEGER NOT NULL,
				total_budget DECIMAL(15,2) NOT NULL,
				personnel_cost DECIMAL(15,2) DEFAULT 0,
				material_cost DECIMAL(15,2) DEFAULT 0,
				research_activity_cost DECIMAL(15,2) DEFAULT 0,
				indirect_cost DECIMAL(15,2) DEFAULT 0,
				other_cost DECIMAL(15,2) DEFAULT 0,
				spent_amount DECIMAL(15,2) DEFAULT 0,
				currency VARCHAR(3) DEFAULT 'KRW',
				status VARCHAR(50) DEFAULT 'planned',
				notes TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(project_id, fiscal_year)
			)`,

      // 4. 참여율 관리 테이블
      `CREATE TABLE IF NOT EXISTS participation_rates (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
				project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
				participation_rate INTEGER NOT NULL CHECK (participation_rate >= 0 AND participation_rate <= 100),
				start_date DATE NOT NULL,
				end_date DATE,
				status VARCHAR(50) DEFAULT 'active',
				created_by UUID REFERENCES employees(id),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(employee_id, project_id, start_date)
			)`,

      // 5. 참여율 변경 이력 테이블
      `CREATE TABLE IF NOT EXISTS participation_rate_history (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
				project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
				old_rate INTEGER,
				new_rate INTEGER NOT NULL,
				change_reason VARCHAR(255),
				change_date DATE NOT NULL,
				changed_by UUID REFERENCES employees(id),
				notes TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)`,

      // 6. 사업비 항목 카테고리 테이블
      `CREATE TABLE IF NOT EXISTS budget_categories (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				code VARCHAR(50) UNIQUE NOT NULL,
				name VARCHAR(100) NOT NULL,
				description TEXT,
				parent_category_id UUID REFERENCES budget_categories(id),
				is_active BOOLEAN DEFAULT true,
				sort_order INTEGER DEFAULT 0,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)`,

      // 7. 프로젝트 마일스톤 테이블
      `CREATE TABLE IF NOT EXISTS project_milestones (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
				title VARCHAR(255) NOT NULL,
				description TEXT,
				milestone_date DATE NOT NULL,
				status VARCHAR(50) DEFAULT 'pending',
				completion_date DATE,
				notes TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)`,

      // 8. 프로젝트 위험 관리 테이블
      `CREATE TABLE IF NOT EXISTS project_risks (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
				risk_type VARCHAR(100) NOT NULL,
				title VARCHAR(255) NOT NULL,
				description TEXT,
				probability VARCHAR(50) DEFAULT 'medium',
				impact VARCHAR(50) DEFAULT 'medium',
				status VARCHAR(50) DEFAULT 'open',
				mitigation_plan TEXT,
				owner_id UUID REFERENCES employees(id),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)`
    ]

    // 인덱스 생성 쿼리
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id)',
      'CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date)',
      'CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_project_members_employee ON project_members(employee_id)',
      'CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status)',
      'CREATE INDEX IF NOT EXISTS idx_project_budgets_project ON project_budgets(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_project_budgets_year ON project_budgets(fiscal_year)',
      'CREATE INDEX IF NOT EXISTS idx_participation_rates_employee ON participation_rates(employee_id)',
      'CREATE INDEX IF NOT EXISTS idx_participation_rates_project ON participation_rates(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_participation_rates_status ON participation_rates(status)'
    ]

    // 기본 데이터 삽입 쿼리
    const dataQueries = [
      `INSERT INTO budget_categories (code, name, description, sort_order) VALUES
				('PERSONNEL', '인건비', '연구원 인건비 및 연구활동비', 1),
				('MATERIAL', '재료비', '연구에 필요한 재료 및 소모품비', 2),
				('EQUIPMENT', '연구활동비', '연구장비 구입 및 임대비', 3),
				('TRAVEL', '간접비', '연구활동 관련 출장비 및 회의비', 4),
				('OTHER', '기타 비목', '기타 연구활동 관련 비용', 5)
			ON CONFLICT (code) DO NOTHING`
    ]

    // 트랜잭션으로 모든 쿼리 실행
    await query('BEGIN')

    try {
      // 테이블 생성
      for (const setupQuery of setupQueries) {
        await query(setupQuery)
      }

      // 인덱스 생성
      for (const indexQuery of indexQueries) {
        await query(indexQuery)
      }

      // 기본 데이터 삽입
      for (const dataQuery of dataQueries) {
        await query(dataQuery)
      }

      await query('COMMIT')

      return json({
        success: true,
        message: '프로젝트 관리 시스템 데이터베이스가 성공적으로 설정되었습니다.'
      })
    } catch (error) {
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    logger.error('프로젝트 관리 시스템 설정 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 관리 시스템 설정에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}
