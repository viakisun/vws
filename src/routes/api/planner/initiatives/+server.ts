import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { initiativeService } from '$lib/planner/services/initiative.service'
import type { CreateInitiativeInput, InitiativeFilters } from '$lib/planner/types'

// List initiatives with filters
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse filters from query params
    const filters: InitiativeFilters = {}

    const state = url.searchParams.get('state')
    if (state) {
      filters.state = state.split(',') as any
    }

    const owner_id = url.searchParams.get('owner_id')
    if (owner_id) filters.owner_id = owner_id

    const formation_id = url.searchParams.get('formation_id')
    if (formation_id) filters.formation_id = formation_id

    const product_id = url.searchParams.get('product_id')
    if (product_id) filters.product_id = product_id

    const horizon_before = url.searchParams.get('horizon_before')
    if (horizon_before) filters.horizon_before = horizon_before

    const horizon_after = url.searchParams.get('horizon_after')
    if (horizon_after) filters.horizon_after = horizon_after

    const search = url.searchParams.get('search')
    if (search) filters.search = search

    const limit = url.searchParams.get('limit')
    if (limit) filters.limit = parseInt(limit)

    const offset = url.searchParams.get('offset')
    if (offset) filters.offset = parseInt(offset)

    const initiatives = await initiativeService.list(filters)

    return json({
      success: true,
      data: initiatives,
    })
  } catch (error) {
    console.error('Failed to list initiatives:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list initiatives',
      },
      { status: 500 },
    )
  }
}

// Create new initiative
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: CreateInitiativeInput = {
      title: body.title,
      intent: body.intent,
      success_criteria: body.success_criteria || [],
      owner_id: body.owner_id || user.id, // Default to current user if not provided
      formation_id: body.formation_id,
      horizon: body.horizon,
      context_links: body.context_links || [],
    }

    // Validate required fields
    if (!input.title || !input.intent) {
      return json(
        {
          success: false,
          error: 'Missing required fields: title, intent',
        },
        { status: 400 },
      )
    }

    const initiative = await initiativeService.create(input, user.id)

    return json({
      success: true,
      data: initiative,
    })
  } catch (error) {
    console.error('Failed to create initiative:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create initiative',
      },
      { status: 500 },
    )
  }
}
