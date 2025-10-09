import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import type { TodoWithAssignee, UpdateTodoInput } from '$lib/planner/types'

// PATCH /api/planner/todos/[id]
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const input: UpdateTodoInput = await request.json()

    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(input.title.trim())
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(input.description || null)
    }

    if (input.assignee_id !== undefined) {
      updates.push(`assignee_id = $${paramIndex++}`)
      values.push(input.assignee_id || null)
    }

    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(input.status)

      if (input.status === 'done') {
        updates.push(`completed_at = NOW()`)
      } else {
        updates.push(`completed_at = NULL`)
      }
    }

    if (input.due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`)
      values.push(input.due_date || null)
    }

    if (updates.length === 0) {
      return json({ error: 'No updates provided' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(params.id)

    const result = await query<TodoWithAssignee>(
      `
      WITH updated_todo AS (
        UPDATE planner_todos
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      )
      SELECT
        t.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email
        ) as assignee
      FROM updated_todo t
      LEFT JOIN employees e ON t.assignee_id = e.id
    `,
      values,
    )

    if (result.rows.length === 0) {
      return json({ error: 'Todo not found' }, { status: 404 })
    }

    return json(result.rows[0])
  } catch (error) {
    console.error('Error updating todo:', error)
    return json({ error: 'Failed to update todo' }, { status: 500 })
  }
}

// DELETE /api/planner/todos/[id]
export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await query(
      `
      UPDATE planner_todos
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `,
      [params.id],
    )

    if (result.rows.length === 0) {
      return json({ error: 'Todo not found' }, { status: 404 })
    }

    return json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
