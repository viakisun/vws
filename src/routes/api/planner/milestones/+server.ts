import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { milestoneService } from '$lib/planner/services/milestone.service'
import type { CreateMilestoneInput, MilestoneFilters } from '$lib/planner/types'

// GET: List milestones
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const filters: MilestoneFilters = {
      product_id: url.searchParams.get('product_id') || undefined,
      status: url.searchParams.get('status') as any,
      target_before: url.searchParams.get('target_before') || undefined,
      target_after: url.searchParams.get('target_after') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '100'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    }

    const milestones = await milestoneService.list(filters)

    return json({
      success: true,
      data: milestones,
    })
  } catch (error) {
    console.error('Failed to list milestones:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list milestones',
      },
      { status: 500 },
    )
  }
}

// POST: Create milestone
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: CreateMilestoneInput = {
      product_id: body.product_id,
      name: body.name,
      description: body.description,
      target_date: body.target_date,
    }

    if (!input.product_id || !input.name) {
      return json(
        {
          success: false,
          error: 'Missing required fields: product_id, name',
        },
        { status: 400 },
      )
    }

    const milestone = await milestoneService.create(input, user.id)

    return json({
      success: true,
      data: milestone,
    })
  } catch (error) {
    console.error('Failed to create milestone:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create milestone',
      },
      { status: 500 },
    )
  }
}
