import { DatabaseService } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: List all categories with product counts
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const result = await DatabaseService.query(
      `
      SELECT
        c.*,
        COUNT(p.id) as product_count
      FROM planner_product_categories c
      LEFT JOIN planner_products p ON p.category = c.code AND p.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.display_order, c.name
    `,
    )

    return json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('Failed to list categories:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list categories',
      },
      { status: 500 },
    )
  }
}

// POST: Create new category
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, description } = body

    if (!name || !code) {
      return json({ success: false, error: 'Name and code are required' }, { status: 400 })
    }

    // Get max display_order
    const maxOrderResult = await DatabaseService.query(
      'SELECT COALESCE(MAX(display_order), 0) as max_order FROM planner_product_categories',
    )
    const nextOrder = (maxOrderResult.rows[0]?.max_order || 0) + 1

    const result = await DatabaseService.query(
      `
      INSERT INTO planner_product_categories (name, code, description, display_order)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        name,
        code,
        description,
        display_order,
        created_at::text,
        updated_at::text
    `,
      [name, code, description || null, nextOrder],
    )

    return json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Failed to create category:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create category',
      },
      { status: 500 },
    )
  }
}
