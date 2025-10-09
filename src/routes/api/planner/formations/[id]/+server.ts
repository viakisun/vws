import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { formationService } from '$lib/planner/services/formation.service'
import type { UpdateFormationInput } from '$lib/planner/types'

// Get formation with details
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formation = await formationService.getByIdWithDetails(params.id)

    if (!formation) {
      return json({ success: false, error: 'Formation not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: formation,
    })
  } catch (error) {
    console.error('Failed to get formation:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get formation',
      },
      { status: 500 },
    )
  }
}

// Update formation handler
async function updateFormation(params: any, request: Request, locals: App.Locals) {
  const user = locals.user
  if (!user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const input: UpdateFormationInput = {
    name: body.name,
    description: body.description,
    cadence_type: body.cadence_type,
    cadence_anchor_time: body.cadence_anchor_time,
    energy_state: body.energy_state,
  }

  const formation = await formationService.update(params.id, input, user.id)

  if (!formation) {
    return json({ success: false, error: 'Formation not found' }, { status: 404 })
  }

  return json({
    success: true,
    data: formation,
  })
}

// Update formation (PUT)
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    return await updateFormation(params, request, locals)
  } catch (error) {
    console.error('Failed to update formation:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update formation',
      },
      { status: 500 },
    )
  }
}

// Update formation (PATCH)
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    return await updateFormation(params, request, locals)
  } catch (error) {
    console.error('Failed to update formation:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update formation',
      },
      { status: 500 },
    )
  }
}

// Delete formation
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const success = await formationService.delete(params.id, user.id)

    if (!success) {
      return json({ success: false, error: 'Formation not found' }, { status: 404 })
    }

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete formation:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete formation',
      },
      { status: 500 },
    )
  }
}
