import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import type { TodoWithAssignee, CreateTodoInput } from '$lib/planner/types'

// GET /api/planner/initiatives/[id]/todos
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const todos = await query<TodoWithAssignee>(
      `
      SELECT
        t.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email
        ) as assignee
      FROM planner_todos t
      LEFT JOIN employees e ON t.assignee_id = e.id
      WHERE t.initiative_id = $1
        AND t.deleted_at IS NULL
      ORDER BY
        CASE t.status
          WHEN 'in_progress' THEN 1
          WHEN 'todo' THEN 2
          WHEN 'done' THEN 3
        END,
        t.created_at DESC
    `,
      [params.id],
    )

    return json(todos.rows)
  } catch (error) {
    console.error('Error fetching todos:', error)
    return json({ error: 'Failed to fetch todos' }, { status: 500 })
  }
}

// POST /api/planner/initiatives/[id]/todos
export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const input: CreateTodoInput = await request.json()

    if (!input.title?.trim()) {
      return json({ error: 'Title is required' }, { status: 400 })
    }

    const result = await query<TodoWithAssignee>(
      `
      WITH inserted_todo AS (
        INSERT INTO planner_todos (
          initiative_id,
          title,
          description,
          assignee_id,
          status,
          due_date,
          external_links
        ) VALUES ($1, $2, $3, $4, 'todo', $5, $6)
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
      FROM inserted_todo t
      LEFT JOIN employees e ON t.assignee_id = e.id
    `,
      [
        params.id,
        input.title.trim(),
        input.description || null,
        input.assignee_id || null,
        input.due_date || null,
        JSON.stringify(input.external_links || []),
      ],
    )

    return json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating todo:', error)
    return json({ error: 'Failed to create todo' }, { status: 500 })
  }
}
