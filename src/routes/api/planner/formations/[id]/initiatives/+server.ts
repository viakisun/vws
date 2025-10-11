import { DatabaseService } from '$lib/database/connection'
import { formationService } from '$lib/planner/services/formation.service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: List initiatives for a formation
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await DatabaseService.query(
      `
      SELECT
        fi.initiative_id,
        fi.allocation_percentage,
        fi.start_date::text as start_date,
        fi.end_date::text as end_date,
        fi.created_at::text as created_at,
        i.title,
        i.intent,
        i.status,
        i.stage,
        i.horizon,
        i.product_id,
        p.name as product_name,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email
        ) as owner
      FROM planner_formation_initiatives fi
      JOIN planner_initiatives i ON fi.initiative_id = i.id
      JOIN employees e ON i.owner_id = e.id
      LEFT JOIN planner_products p ON p.id = i.product_id AND p.deleted_at IS NULL
      WHERE fi.formation_id = $1
      ORDER BY fi.created_at DESC
    `,
      [params.id],
    )

    return json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('Error fetching formation initiatives:', error)
    return json(
      {
        success: false,
        error: 'Failed to fetch formation initiatives',
      },
      { status: 500 },
    )
  }
}

// Link initiative to formation
export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const initiativeId = body.initiative_id

    if (!initiativeId) {
      return json(
        {
          success: false,
          error: 'Missing required field: initiative_id',
        },
        { status: 400 },
      )
    }

    await formationService.linkInitiative(params.id, initiativeId, user.id)

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to link initiative:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to link initiative',
      },
      { status: 500 },
    )
  }
}

// PUT: Update allocation
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { initiative_id, allocation_percentage, start_date, end_date } = body

    if (!initiative_id) {
      return json(
        {
          success: false,
          error: 'Missing required field: initiative_id',
        },
        { status: 400 },
      )
    }

    if (
      allocation_percentage !== undefined &&
      (allocation_percentage < 0 || allocation_percentage > 100)
    ) {
      return json(
        {
          success: false,
          error: 'Allocation percentage must be between 0 and 100',
        },
        { status: 400 },
      )
    }

    const updates: string[] = []
    const values: unknown[] = []
    let paramCount = 0

    if (allocation_percentage !== undefined) {
      paramCount++
      updates.push(`allocation_percentage = $${paramCount}`)
      values.push(allocation_percentage)
    }

    if (start_date !== undefined) {
      paramCount++
      updates.push(`start_date = $${paramCount}`)
      values.push(start_date || null)
    }

    if (end_date !== undefined) {
      paramCount++
      updates.push(`end_date = $${paramCount}`)
      values.push(end_date || null)
    }

    if (updates.length === 0) {
      return json({
        success: true,
      })
    }

    paramCount++
    values.push(params.id)
    paramCount++
    values.push(initiative_id)

    await DatabaseService.query(
      `
      UPDATE planner_formation_initiatives
      SET ${updates.join(', ')}
      WHERE formation_id = $${paramCount - 1}
        AND initiative_id = $${paramCount}
    `,
      values,
    )

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to update allocation:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update allocation',
      },
      { status: 500 },
    )
  }
}

// Unlink initiative from formation
export const DELETE: RequestHandler = async ({ params, url, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const initiativeId = url.searchParams.get('initiative_id')
    if (!initiativeId) {
      return json(
        {
          success: false,
          error: 'Missing required parameter: initiative_id',
        },
        { status: 400 },
      )
    }

    await formationService.unlinkInitiative(params.id, initiativeId, user.id)

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to unlink initiative:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlink initiative',
      },
      { status: 500 },
    )
  }
}
