import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { milestoneService } from '$lib/planner/services/milestone.service'
import type { UpdateMilestoneInput } from '$lib/planner/types'

// GET: Get milestone by ID
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const milestone = await milestoneService.getById(params.id)

    if (!milestone) {
      return json({ success: false, error: 'Milestone not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: milestone,
    })
  } catch (error) {
    console.error('Failed to get milestone:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get milestone',
      },
      { status: 500 },
    )
  }
}

// PUT: Update milestone
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: UpdateMilestoneInput = {
      name: body.name,
      description: body.description,
      target_date: body.target_date,
      status: body.status,
      achievement_notes: body.achievement_notes,
    }

    const milestone = await milestoneService.update(params.id, input, user.id)

    if (!milestone) {
      return json({ success: false, error: 'Milestone not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: milestone,
    })
  } catch (error) {
    console.error('Failed to update milestone:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update milestone',
      },
      { status: 500 },
    )
  }
}

// DELETE: Delete milestone (soft delete)
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const success = await milestoneService.delete(params.id, user.id)

    if (!success) {
      return json({ success: false, error: 'Milestone not found' }, { status: 404 })
    }

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete milestone:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete milestone',
      },
      { status: 500 },
    )
  }
}
