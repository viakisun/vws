import { RdDevDeliverableService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// PUT /api/rd-development/deliverables/[id]/status
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid deliverable ID' })
    }

    const body = await request.json()
    const { status, notes } = body

    if (!status) {
      return error(400, { message: 'Status is required' })
    }

    const validStatuses = ['planned', 'in_progress', 'completed', 'delayed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return error(400, { message: 'Invalid status value' })
    }

    const service = new RdDevDeliverableService()
    const deliverable = await service.updateDeliverableStatus(id.toString(), status, notes)

    if (!deliverable) {
      return error(404, { message: 'Deliverable not found' })
    }

    return json({
      success: true,
      data: deliverable,
    })
  } catch (err) {
    console.error('Error updating deliverable status:', err)
    return error(500, {
      message: 'Failed to update deliverable status',
    })
  }
}
