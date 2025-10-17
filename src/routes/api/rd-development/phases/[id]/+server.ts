import { RdDevPhaseService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/phases/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid phase ID' })
    }

    const phase = await RdDevPhaseService.getPhaseById(id)

    if (!phase) {
      return error(404, { message: 'Phase not found' })
    }

    return json({
      success: true,
      data: phase,
    })
  } catch (err) {
    console.error('Error fetching phase:', err)
    return error(500, {
      message: 'Failed to fetch phase',
    })
  }
}

// PUT /api/rd-development/phases/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid phase ID' })
    }

    const body = await request.json()

    const phase = await RdDevPhaseService.updatePhase(id, body)

    if (!phase) {
      return error(404, { message: 'Phase not found' })
    }

    return json({
      success: true,
      data: phase,
    })
  } catch (err) {
    console.error('Error updating phase:', err)
    return error(500, {
      message: 'Failed to update phase',
    })
  }
}

// DELETE /api/rd-development/phases/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid phase ID' })
    }

    const deleted = await RdDevPhaseService.deletePhase(id)

    if (!deleted) {
      return error(404, { message: 'Phase not found' })
    }

    return json({
      success: true,
      message: 'Phase deleted successfully',
    })
  } catch (err) {
    console.error('Error deleting phase:', err)
    return error(500, {
      message: 'Failed to delete phase',
    })
  }
}
