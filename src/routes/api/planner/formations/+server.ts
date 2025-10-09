import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { formationService } from '$lib/planner/services/formation.service'
import type { CreateFormationInput, FormationFilters } from '$lib/planner/types'

// List formations
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const filters: FormationFilters = {}

    const energy_state = url.searchParams.get('energy_state')
    if (energy_state) filters.energy_state = energy_state as any

    const member_id = url.searchParams.get('member_id')
    if (member_id) filters.member_id = member_id

    const limit = url.searchParams.get('limit')
    if (limit) filters.limit = parseInt(limit)

    const offset = url.searchParams.get('offset')
    if (offset) filters.offset = parseInt(offset)

    const formations = await formationService.list(filters)

    return json({
      success: true,
      data: formations,
    })
  } catch (error) {
    console.error('Failed to list formations:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list formations',
      },
      { status: 500 },
    )
  }
}

// Create new formation
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: CreateFormationInput = {
      name: body.name,
      description: body.description,
      cadence_type: body.cadence_type || 'weekly',
      cadence_anchor_time: body.cadence_anchor_time,
      energy_state: body.energy_state || 'healthy',
    }

    if (!input.name) {
      return json(
        {
          success: false,
          error: 'Missing required field: name',
        },
        { status: 400 },
      )
    }

    const formation = await formationService.create(input, user.id)

    return json({
      success: true,
      data: formation,
    })
  } catch (error) {
    console.error('Failed to create formation:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create formation',
      },
      { status: 500 },
    )
  }
}
