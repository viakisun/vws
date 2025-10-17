import { RdDevTechnicalSpecService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/technical-specs/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid technical spec ID' })
    }

    const service = new RdDevTechnicalSpecService()
    const technicalSpec = await service.getTechnicalSpecById(id)

    if (!technicalSpec) {
      return error(404, { message: 'Technical spec not found' })
    }

    return json({
      success: true,
      data: technicalSpec,
    })
  } catch (err) {
    console.error('Error fetching technical spec:', err)
    return error(500, {
      message: 'Failed to fetch technical spec',
    })
  }
}

// PUT /api/rd-development/technical-specs/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid technical spec ID' })
    }

    const body = await request.json()

    const service = new RdDevTechnicalSpecService()
    const technicalSpec = await service.updateTechnicalSpec(id, body)

    if (!technicalSpec) {
      return error(404, { message: 'Technical spec not found' })
    }

    return json({
      success: true,
      data: technicalSpec,
    })
  } catch (err) {
    console.error('Error updating technical spec:', err)
    return error(500, {
      message: 'Failed to update technical spec',
    })
  }
}

// DELETE /api/rd-development/technical-specs/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid technical spec ID' })
    }

    const service = new RdDevTechnicalSpecService()
    const deleted = await service.deleteTechnicalSpec(id)

    if (!deleted) {
      return error(404, { message: 'Technical spec not found' })
    }

    return json({
      success: true,
      message: 'Technical spec deleted successfully',
    })
  } catch (err) {
    console.error('Error deleting technical spec:', err)
    return error(500, {
      message: 'Failed to delete technical spec',
    })
  }
}
