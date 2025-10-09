import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { initiativeService } from '$lib/planner/services/initiative.service'
import type { UpdateInitiativeInput } from '$lib/planner/types'

// Get single initiative with details
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const initiative = await initiativeService.getByIdWithDetails(params.id)

    if (!initiative) {
      return json({ success: false, error: 'Initiative not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: initiative,
    })
  } catch (error) {
    console.error('Failed to get initiative:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get initiative',
      },
      { status: 500 },
    )
  }
}

// Update initiative
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: UpdateInitiativeInput = {
      title: body.title,
      intent: body.intent,
      success_criteria: body.success_criteria,
      owner_id: body.owner_id,
      formation_id: body.formation_id,
      horizon: body.horizon,
      context_links: body.context_links,
      pause_reason: body.pause_reason,
      abandonment_reason: body.abandonment_reason,
      shipped_notes: body.shipped_notes,
      milestone_id: body.milestone_id,
    }

    await initiativeService.update(params.id, input, user.id)

    // Fetch the updated initiative with all details (owner, formation, etc.)
    const initiative = await initiativeService.getByIdWithDetails(params.id)

    if (!initiative) {
      return json({ success: false, error: 'Initiative not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: initiative,
    })
  } catch (error) {
    console.error('Failed to update initiative:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update initiative',
      },
      { status: 500 },
    )
  }
}

// Delete initiative (soft delete)
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const success = await initiativeService.delete(params.id, user.id)

    if (!success) {
      return json({ success: false, error: 'Initiative not found' }, { status: 404 })
    }

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete initiative:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete initiative',
      },
      { status: 500 },
    )
  }
}
