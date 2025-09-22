// 글로벌 팩터 관리 API
import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/project-management/global-factors - 글로벌 팩터 조회
export const GET: RequestHandler = async () => {
  try {
    // 글로벌 팩터 테이블이 없으면 생성
    await query(`
			CREATE TABLE IF NOT EXISTS global_factors (
				id SERIAL PRIMARY KEY,
				factor_name VARCHAR(100) UNIQUE NOT NULL,
				factor_value DECIMAL(10,4) NOT NULL,
				description TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)

    // 기본값 삽입 (필요한 팩터만)
    // salary_multiplier는 제거됨

    // 글로벌 팩터 조회
    const result = await query(`
			SELECT factor_name, factor_value, description, updated_at
			FROM global_factors
			ORDER BY factor_name
		`)

    // 객체 형태로 변환
    const factors: Record<string, number> = {}
    const descriptions: Record<string, string> = {}

    result.rows.forEach(row => {
      factors[row.factor_name] = parseFloat(row.factor_value)
      descriptions[row.factor_name] = row.description
    })

    return json({
      success: true,
      data: {
        factors,
        descriptions
      }
    })
  } catch (error) {
    console.error('글로벌 팩터 조회 실패:', error)
    return json(
      {
        success: false,
        message: '글로벌 팩터를 불러오는데 실패했습니다.',
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// PUT /api/project-management/global-factors - 글로벌 팩터 업데이트
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const { factorName, factorValue, description } = await request.json()

    if (!factorName || factorValue === undefined) {
      return json(
        {
          success: false,
          message: '팩터 이름과 값은 필수입니다.'
        },
        { status: 400 }
      )
    }

    // 팩터 업데이트
    const result = await query(
      `
			UPDATE global_factors 
			SET factor_value = $1, description = $2, updated_at = CURRENT_TIMESTAMP
			WHERE factor_name = $3
			RETURNING *
		`,
      [factorValue, description || null, factorName]
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          message: '해당 팩터를 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    return json({
      success: true,
      message: '글로벌 팩터가 성공적으로 업데이트되었습니다.',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('글로벌 팩터 업데이트 실패:', error)
    return json(
      {
        success: false,
        message: '글로벌 팩터 업데이트에 실패했습니다.',
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}
