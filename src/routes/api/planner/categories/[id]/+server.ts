import { DatabaseService } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// PUT: Update category
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const result = await DatabaseService.query(
      `
      UPDATE planner_product_categories
      SET name = $1, description = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING 
        id,
        name,
        code,
        description,
        display_order,
        created_at::text,
        updated_at::text
    `,
      [name, description || null, params.id],
    )

    if (result.rows.length === 0) {
      return json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Failed to update category:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update category',
      },
      { status: 500 },
    )
  }
}

// DELETE: Delete category
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if category has products
    const checkResult = await DatabaseService.query(
      'SELECT COUNT(*) as count FROM planner_products WHERE category = (SELECT code FROM planner_product_categories WHERE id = $1) AND deleted_at IS NULL',
      [params.id],
    )

    if (parseInt(checkResult.rows[0]?.count || '0') > 0) {
      return json(
        { success: false, error: 'Cannot delete category with products' },
        { status: 400 },
      )
    }

    const result = await DatabaseService.query(
      `DELETE FROM planner_product_categories WHERE id = $1 
      RETURNING 
        id,
        name,
        code,
        description,
        display_order,
        created_at::text,
        updated_at::text`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete category',
      },
      { status: 500 },
    )
  }
}
