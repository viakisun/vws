import { DatabaseService } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/assets/categories - 자산 카테고리 목록 조회
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        type,
        description,
        requires_serial,
        requires_location,
        requires_datetime_booking,
        requires_assignment,
        created_at::text,
        updated_at::text
      FROM asset_categories
      ORDER BY name ASC
    `

    const result = await DatabaseService.query(query)

    return json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('Failed to fetch asset categories:', error)
    return json(
      {
        success: false,
        error: 'Failed to fetch asset categories',
      },
      { status: 500 },
    )
  }
}
