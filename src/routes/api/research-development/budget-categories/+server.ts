import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// GET /api/research-development/budget-categories - 사업비 항목 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const active = url.searchParams.get('active')
    const type = url.searchParams.get('type')

    let sqlQuery = 'SELECT * FROM budget_categories WHERE 1=1'
    const params: unknown[] = []
    let paramIndex = 1

    if (active !== null) {
      sqlQuery += ` AND active = $${paramIndex}`
      params.push(active === 'true')
      paramIndex++
    }

    if (type) {
      sqlQuery += ` AND type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }

    sqlQuery += ' ORDER BY sort_order ASC, name ASC'

    const result = await query(sqlQuery, params)

    return json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    logger.error('사업비 항목 조회 실패:', error)
    return json(
      {
        success: false,
        message: '사업비 항목을 불러오는데 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
