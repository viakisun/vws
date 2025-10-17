import { RdDevQuarterlyMilestoneService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/quarterly-milestones/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid quarterly milestone ID' })
    }

    const service = new RdDevQuarterlyMilestoneService()
    const milestone = await service.getQuarterlyMilestoneById(id)

    if (!milestone) {
      return error(404, { message: 'Quarterly milestone not found' })
    }

    return json({
      success: true,
      data: milestone,
    })
  } catch (err) {
    console.error('Error fetching quarterly milestone:', err)
    return error(500, {
      message: 'Failed to fetch quarterly milestone',
    })
  }
}

// PUT /api/rd-development/quarterly-milestones/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid quarterly milestone ID' })
    }

    const body = await request.json()

    const service = new RdDevQuarterlyMilestoneService()
    const milestone = await service.updateQuarterlyMilestone(id, body)

    if (!milestone) {
      return error(404, { message: 'Quarterly milestone not found' })
    }

    return json({
      success: true,
      data: milestone,
    })
  } catch (err) {
    console.error('Error updating quarterly milestone:', err)
    return error(500, {
      message: 'Failed to update quarterly milestone',
    })
  }
}

// DELETE /api/rd-development/quarterly-milestones/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid quarterly milestone ID' })
    }

    const service = new RdDevQuarterlyMilestoneService()
    const deleted = await service.deleteQuarterlyMilestone(id)

    if (!deleted) {
      return error(404, { message: 'Quarterly milestone not found' })
    }

    return json({
      success: true,
      message: 'Quarterly milestone deleted successfully',
    })
  } catch (err) {
    console.error('Error deleting quarterly milestone:', err)
    return error(500, {
      message: 'Failed to delete quarterly milestone',
    })
  }
}
