import { RdDevDeliverableService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/deliverables/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid deliverable ID' })
    }

    const service = new RdDevDeliverableService()
    const deliverable = await service.getDeliverableById(id.toString())

    if (!deliverable) {
      return error(404, { message: 'Deliverable not found' })
    }

    return json({
      success: true,
      data: deliverable,
    })
  } catch (err) {
    console.error('Error fetching deliverable:', err)
    return error(500, {
      message: 'Failed to fetch deliverable',
    })
  }
}

// PUT /api/rd-development/deliverables/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid deliverable ID' })
    }

    const body = await request.json()

    const service = new RdDevDeliverableService()
    const deliverable = await service.updateDeliverable(id.toString(), body)

    if (!deliverable) {
      return error(404, { message: 'Deliverable not found' })
    }

    return json({
      success: true,
      data: deliverable,
    })
  } catch (err) {
    console.error('Error updating deliverable:', err)
    return error(500, {
      message: 'Failed to update deliverable',
    })
  }
}

// DELETE /api/rd-development/deliverables/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid deliverable ID' })
    }

    const service = new RdDevDeliverableService()
    const deleted = await service.deleteDeliverable(id.toString())

    if (!deleted) {
      return error(404, { message: 'Deliverable not found' })
    }

    return json({
      success: true,
      message: 'Deliverable deleted successfully',
    })
  } catch (err) {
    console.error('Error deleting deliverable:', err)
    return error(500, {
      message: 'Failed to delete deliverable',
    })
  }
}
