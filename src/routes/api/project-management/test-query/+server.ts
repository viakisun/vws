import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async () => {
  try {
    logger.log('Testing project_members query...')

    const projectId = '71f098a0-7ead-4cc8-aff2-c303d287bc35'

    const sqlQuery = `
      SELECT
        pm.*,
        CASE
          WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$'
          THEN CONCAT(e.last_name, e.first_name)
          ELSE CONCAT(e.first_name, ' ', e.last_name)
        END as employee_name,
        e.first_name,
        e.last_name,
        e.email as employee_email,
        e.department as employee_department,
        e.position as employee_position,
        p.title as project_title,
        p.code as project_code
      FROM project_members pm
      JOIN employees e ON pm.employee_id = e.id
      JOIN projects p ON pm.project_id = p.id
      WHERE pm.project_id = $1
      ORDER BY pm.created_at DESC
    `

    const result = await query(sqlQuery, [projectId])

    logger.log('Query result:', result.rows)

    return json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    logger.error('Query test failed:', error)
    return json(
      {
        success: false,
        message: '쿼리 테스트 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
