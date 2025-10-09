import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { threadService } from '$lib/planner/services/thread.service'
import type { ThreadState } from '$lib/planner/types'

// Change thread state
export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const newState = body.state as ThreadState
    const resolution = body.resolution

    if (!newState) {
      return json(
        {
          success: false,
          error: 'Missing required field: state',
        },
        { status: 400 },
      )
    }

    const thread = await threadService.changeState(params.id, newState, user.id, resolution)

    if (!thread) {
      return json({ success: false, error: 'Thread not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: thread,
    })
  } catch (error) {
    console.error('Failed to change thread state:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change thread state',
      },
      { status: 500 },
    )
  }
}
