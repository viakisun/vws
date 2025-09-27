import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 이사 명부 및 직책 체계 테이블 생성
export const POST: RequestHandler = async () => {
  try {
    // Job Titles 테이블 생성
    await query(`
			CREATE TABLE IF NOT EXISTS job_titles (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				name VARCHAR(100) UNIQUE NOT NULL,
				level INTEGER NOT NULL,
				category VARCHAR(50) NOT NULL,
				description TEXT,
				is_active BOOLEAN DEFAULT true,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)

    // Executives 테이블 생성
    await query(`
			CREATE TABLE IF NOT EXISTS executives (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				executive_id VARCHAR(50) UNIQUE NOT NULL,
				first_name VARCHAR(100) NOT NULL,
				last_name VARCHAR(100) NOT NULL,
				email VARCHAR(255) UNIQUE NOT NULL,
				phone VARCHAR(50),
				job_title_id UUID REFERENCES job_titles(id),
				department VARCHAR(100),
				appointment_date DATE,
				term_end_date DATE,
				status VARCHAR(50) DEFAULT 'active',
				bio TEXT,
				profile_image_url VARCHAR(500),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)

    // 인덱스 생성
    await query(`CREATE INDEX IF NOT EXISTS idx_job_titles_level ON job_titles(level)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_job_titles_category ON job_titles(category)`)
    await query(
      `CREATE INDEX IF NOT EXISTS idx_executives_executive_id ON executives(executive_id)`,
    )
    await query(
      `CREATE INDEX IF NOT EXISTS idx_executives_job_title_id ON executives(job_title_id)`,
    )

    // 기본 직책 데이터 삽입
    await query(`
			INSERT INTO job_titles (name, level, category, description) VALUES
			('CEO', 1, 'executive', 'Chief Executive Officer - 대표이사'),
			('CTO', 1, 'executive', 'Chief Technology Officer - 연구소장, 기술이사'),
			('CFO', 1, 'executive', 'Chief Financial Officer - 상무이사'),
			('Director', 2, 'management', 'Director - 이사'),
			('Managing Director', 2, 'management', 'Managing Director - 상무'),
			('Team Lead', 3, 'specialist', 'Team Lead - 팀장'),
			('Senior Manager', 3, 'specialist', 'Senior Manager - 부장'),
			('Manager', 3, 'specialist', 'Manager - 과장')
			ON CONFLICT (name) DO NOTHING
		`)

    // C-Level 임원진 데이터 삽입
    await query(`
			INSERT INTO executives (executive_id, first_name, last_name, email, phone, job_title_id, department, appointment_date, status, bio) VALUES
			('EXE001', '박기선', '', 'ceo@viahub.com', '010-0001-0001', 
			 (SELECT id FROM job_titles WHERE name = 'CEO'), '경영진', '2020-01-01', 'active', 
			 '회사의 비전과 전략을 수립하고 이끌어가는 대표이사입니다.'),
			('EXE002', '최현민', '', 'cto@viahub.com', '010-0002-0002', 
			 (SELECT id FROM job_titles WHERE name = 'CTO'), '연구개발', '2020-01-01', 'active', 
			 '기술 혁신과 연구개발을 총괄하는 연구소장이자 기술이사입니다.'),
			('EXE003', '오현종', '', 'cfo@viahub.com', '010-0003-0003', 
			 (SELECT id FROM job_titles WHERE name = 'CFO'), '재무', '2020-01-01', 'active', 
			 '재무 관리와 경영 지원을 담당하는 상무이사입니다.')
			ON CONFLICT (executive_id) DO NOTHING
		`)

    const response: ApiResponse<null> = {
      success: true,
      message: '이사 명부 및 직책 체계 테이블이 성공적으로 생성되었습니다.',
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('Error setting up executives tables:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '테이블 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
