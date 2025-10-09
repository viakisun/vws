import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { initiativeService } from '$lib/planner/services/initiative.service'
import type { InitiativeStage } from '$lib/planner/types'

// Change initiative stage
export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const newStage = body.stage as InitiativeStage

    if (!newStage) {
      return json(
        {
          success: false,
          error: 'Missing required field: stage',
        },
        { status: 400 },
      )
    }

    const initiative = await initiativeService.changeStage(params.id, newStage, user.id)

    if (!initiative) {
      return json({ success: false, error: 'Initiative not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: initiative,
    })
  } catch (error) {
    console.error('Failed to change initiative stage:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change initiative stage',
      },
      { status: 500 },
    )
  }
}
