import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { threadService } from '$lib/planner/services/thread.service'
import type { UpdateThreadInput } from '$lib/planner/types'

// Get thread with details
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const thread = await threadService.getByIdWithDetails(params.id)

    if (!thread) {
      return json({ success: false, error: 'Thread not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: thread,
    })
  } catch (error) {
    console.error('Failed to get thread:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get thread',
      },
      { status: 500 },
    )
  }
}

// Update thread
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: UpdateThreadInput = {
      title: body.title,
      body: body.body,
      shape: body.shape,
      owner_id: body.owner_id,
      external_links: body.external_links,
      resolution: body.resolution,
    }

    const thread = await threadService.update(params.id, input, user.id)

    if (!thread) {
      return json({ success: false, error: 'Thread not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: thread,
    })
  } catch (error) {
    console.error('Failed to update thread:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update thread',
      },
      { status: 500 },
    )
  }
}

// Delete thread
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const success = await threadService.delete(params.id, user.id)

    if (!success) {
      return json({ success: false, error: 'Thread not found' }, { status: 404 })
    }

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete thread:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete thread',
      },
      { status: 500 },
    )
  }
}
