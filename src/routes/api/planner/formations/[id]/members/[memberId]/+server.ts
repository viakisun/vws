import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { DatabaseService } from '$lib/database/connection'

// Update member
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const result = await DatabaseService.query(
      `
			UPDATE planner_formation_members
			SET
				role = $1,
				bandwidth = $2,
				updated_at = NOW()
			WHERE id = $3 AND formation_id = $4
			RETURNING *
		`,
      [body.role, body.bandwidth, params.memberId, params.id],
    )

    if (result.rows.length === 0) {
      return json({ success: false, error: 'Member not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Failed to update formation member:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update formation member',
      },
      { status: 500 },
    )
  }
}
