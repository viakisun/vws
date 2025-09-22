import { json } from '@sveltejs/kit'
import { Pool } from 'pg'
import type { RequestHandler } from './$types'

const pool = new Pool({
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: { rejectUnauthorized: false }
})

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const evidenceId = params.id
    const { newName } = await request.json()

    if (!evidenceId || !newName) {
      return json({ error: '증빙 항목 ID와 새 이름이 필요합니다.' }, { status: 400 })
    }

    // 증빙 항목 이름 업데이트
    const result = await pool.query(
      `
			UPDATE evidence_items 
			SET name = $1, updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
			RETURNING id, name, assignee_name, due_date
		`,
      [newName, evidenceId]
    )

    if (result.rows.length === 0) {
      return json({ error: '증빙 항목을 찾을 수 없습니다.' }, { status: 404 })
    }

    return json({
      success: true,
      message: '증빙 항목 이름이 업데이트되었습니다.',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Evidence name update error:', error)
    return json(
      {
        error: '증빙 항목 이름 업데이트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
