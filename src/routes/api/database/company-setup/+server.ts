import { json } from '@sveltejs/kit'
import { query } from '$lib/database/connection.js'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

export const POST: RequestHandler = async () => {
  try {
    // 기존 companies 테이블 삭제 후 새로 생성
    await query('DROP TABLE IF EXISTS companies CASCADE')

    // 새 companies 테이블 생성
    await query(`
			CREATE TABLE companies (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				name VARCHAR(255) NOT NULL,
				establishment_date DATE,
				ceo_name VARCHAR(100),
				business_type VARCHAR(255),
				address TEXT,
				phone VARCHAR(50),
				fax VARCHAR(50),
				email VARCHAR(255),
				website VARCHAR(255),
				registration_number VARCHAR(50),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)

    // 인덱스 생성
    await query(`
			CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
		`)

    // 기존 회사 정보가 있는지 확인
    const existingResult = await query('SELECT id FROM companies WHERE name = $1', ['(주)비아'])

    if (existingResult.rows.length > 0) {
      // 기존 회사 정보 업데이트
      await query(
        `
				UPDATE companies SET
					establishment_date = $1,
					ceo_name = $2,
					business_type = $3,
					address = $4,
					phone = $5,
					fax = $6,
					updated_at = $7
				WHERE name = $8
			`,
        [
          '2019-03-10',
          '박기선',
          '소프트웨어 개발 및 공급업',
          '전라북도 전주시 덕진구 유상로67, 전주혁신창업허브 513호',
          '063-211-0814',
          '063-211-0813',
          new Date(),
          '(주)비아',
        ],
      )
    } else {
      // 새 회사 정보 삽입
      await query(
        `
				INSERT INTO companies (
					name, establishment_date, ceo_name, business_type, 
					address, phone, fax, created_at, updated_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			`,
        [
          '(주)비아',
          '2019-03-10',
          '박기선',
          '소프트웨어 개발 및 공급업',
          '전라북도 전주시 덕진구 유상로67, 전주혁신창업허브 513호',
          '063-211-0814',
          '063-211-0813',
          new Date(),
          new Date(),
        ],
      )
    }

    return json({
      success: true,
      message: '회사 정보 테이블이 생성되고 기본 데이터가 등록되었습니다.',
    })
  } catch (error: any) {
    logger.error('Error setting up company table:', error)
    return json(
      {
        success: false,
        error: error.message || '회사 정보 테이블 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
