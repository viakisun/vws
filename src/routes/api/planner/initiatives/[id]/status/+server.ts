import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { initiativeService } from '$lib/planner/services/initiative.service'
import type { InitiativeStatus } from '$lib/planner/types'

// Change initiative status
export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const newStatus = body.status as InitiativeStatus
    const metadata = {
      reason: body.reason,
      notes: body.notes,
    }

    if (!newStatus) {
      return json(
        {
          success: false,
          error: 'Missing required field: status',
        },
        { status: 400 },
      )
    }

    const initiative = await initiativeService.changeStatus(params.id, newStatus, user.id, metadata)

    if (!initiative) {
      return json({ success: false, error: 'Initiative not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: initiative,
    })
  } catch (error) {
    console.error('Failed to change initiative status:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change initiative status',
      },
      { status: 500 },
    )
  }
}
