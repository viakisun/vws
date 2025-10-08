import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { requireAuth } from '$lib/auth/middleware'

/**
 * GET /api/dashboard/leave/types
 * 연차 타입 목록 조회
 */
export const GET: RequestHandler = async (event) => {
  try {
    await requireAuth(event)
    // 활성화된 연차 타입 조회
    const result = await query(
      `SELECT id, name, description, max_days, is_paid, requires_approval
       FROM leave_types
       WHERE status = 'active'
         AND name IN ('연차', '반차', '반반차', '경조사', '예비군/민방위')
       ORDER BY
         CASE
           WHEN name = '연차' THEN 1
           WHEN name = '반차' THEN 2
           WHEN name = '반반차' THEN 3
           WHEN name = '경조사' THEN 4
           WHEN name = '예비군/민방위' THEN 5
         END`,
    )

    return json({
      leaveTypes: result.rows,
    })
  } catch (error) {
    console.error('연차 타입 조회 실패:', error)
    return json({ error: '연차 타입 조회에 실패했습니다.' }, { status: 500 })
  }
}
