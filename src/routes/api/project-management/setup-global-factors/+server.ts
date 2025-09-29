import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 글로벌 팩터 SQL을 직접 정의 (파일 의존성 제거)
const GLOBAL_FACTORS_SQL = `
-- 글로벌 팩터 테이블 생성
CREATE TABLE IF NOT EXISTS global_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factor_name VARCHAR(100) NOT NULL UNIQUE,
    factor_value DECIMAL(10,4) NOT NULL,
    description TEXT,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 글로벌 팩터 데이터 삽입
INSERT INTO global_factors (factor_name, factor_value, description) VALUES
('연구개발비_간접비율', 0.15, '연구개발비 간접비 비율 (15%)'),
('연구개발비_직접비율', 0.85, '연구개발비 직접비 비율 (85%)'),
('인건비_상한비율', 0.5, '인건비 상한 비율 (50%)'),
('연구개발비_상한비율', 0.7, '연구개발비 상한 비율 (70%)'),
('간접비_상한비율', 0.3, '간접비 상한 비율 (30%)'),
('기타비_상한비율', 0.2, '기타비 상한 비율 (20%)'),
('참여율_기본값', 100, '기본 참여율 (100%)'),
('월급여_기본값', 0, '기본 월급여 (0원)')
ON CONFLICT (factor_name) DO NOTHING;
`

export const POST: RequestHandler = async () => {
  try {
    // 트랜잭션으로 실행
    await query('BEGIN')

    try {
      // SQL 스크립트 실행
      await query(GLOBAL_FACTORS_SQL)
      await query('COMMIT')

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: '글로벌 팩터 테이블이 성공적으로 생성되었습니다.',
      }

      return json(response)
    } catch (error: unknown) {
      await query('ROLLBACK')
      throw error
    }
  } catch (error: unknown) {
    logger.error('글로벌 팩터 테이블 생성 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '글로벌 팩터 테이블 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
