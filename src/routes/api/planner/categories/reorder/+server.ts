import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { DatabaseService } from '$lib/database/connection'

// POST: Reorder categories
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { categories } = body

    if (!Array.isArray(categories)) {
      return json({ success: false, error: 'Invalid request body' }, { status: 400 })
    }

    // Update each category's display_order in a transaction
    for (const cat of categories) {
      await DatabaseService.query(
        'UPDATE planner_product_categories SET display_order = $1, updated_at = NOW() WHERE id = $2',
        [cat.display_order, cat.id],
      )
    }

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to reorder categories:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder categories',
      },
      { status: 500 },
    )
  }
}
