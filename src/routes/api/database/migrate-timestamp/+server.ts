// 프로젝트 날짜 필드를 DATE에서 TIMESTAMP WITH TIME ZONE으로 마이그레이션
import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

export const POST: RequestHandler = async () => {
  try {
    logger.log('🚀 프로젝트 날짜 필드 마이그레이션 시작...')

    // 트랜잭션 시작
    await query('BEGIN')

    try {
      // projects.start_date 마이그레이션
      logger.log('  ⏳ projects.start_date를 TIMESTAMP WITH TIME ZONE으로 변환 중...')
      await query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'projects' 
              AND column_name = 'start_date' 
              AND data_type = 'date'
          ) THEN
            ALTER TABLE projects 
            ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE 
            USING start_date::TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'projects.start_date 변환 완료';
          ELSE
            RAISE NOTICE 'projects.start_date는 이미 TIMESTAMP WITH TIME ZONE 타입입니다';
          END IF;
        END $$;
      `)

      // projects.end_date 마이그레이션
      logger.log('  ⏳ projects.end_date를 TIMESTAMP WITH TIME ZONE으로 변환 중...')
      await query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'projects' 
              AND column_name = 'end_date' 
              AND data_type = 'date'
          ) THEN
            ALTER TABLE projects 
            ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE 
            USING end_date::TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'projects.end_date 변환 완료';
          ELSE
            RAISE NOTICE 'projects.end_date는 이미 TIMESTAMP WITH TIME ZONE 타입입니다';
          END IF;
        END $$;
      `)

      // 트랜잭션 커밋
      await query('COMMIT')

      // 결과 확인
      const result = await query<{ column_name: string; data_type: string }>(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
          AND column_name IN ('start_date', 'end_date')
        ORDER BY column_name;
      `)

      logger.log('✅ 마이그레이션 완료!')
      logger.log('📊 현재 projects 테이블 날짜 필드 타입:', result.rows)

      return json({
        success: true,
        message: '프로젝트 날짜 필드 마이그레이션이 성공적으로 완료되었습니다.',
        columns: result.rows,
      })
    } catch (error) {
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    logger.error('❌ 마이그레이션 실패:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '마이그레이션 중 오류가 발생했습니다.',
      },
      { status: 500 },
    )
  }
}
