import { RdDevInstitutionService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/institutions/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid institution ID' })
    }

    const institution = await RdDevInstitutionService.getInstitutionById(id)

    if (!institution) {
      return error(404, { message: 'Institution not found' })
    }

    return json({
      success: true,
      data: institution,
    })
  } catch (err) {
    console.error('Error fetching institution:', err)
    return error(500, {
      message: 'Failed to fetch institution',
    })
  }
}

// PUT /api/rd-development/institutions/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid institution ID' })
    }

    const body = await request.json()

    const institution = await RdDevInstitutionService.updateInstitution(id, body)

    if (!institution) {
      return error(404, { message: 'Institution not found' })
    }

    return json({
      success: true,
      data: institution,
    })
  } catch (err) {
    console.error('Error updating institution:', err)
    return error(500, {
      message: 'Failed to update institution',
    })
  }
}

// DELETE /api/rd-development/institutions/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid institution ID' })
    }

    const deleted = await RdDevInstitutionService.deleteInstitution(id)

    if (!deleted) {
      return error(404, { message: 'Institution not found' })
    }

    return json({
      success: true,
      message: 'Institution deleted successfully',
    })
  } catch (err) {
    console.error('Error deleting institution:', err)
    return error(500, {
      message: 'Failed to delete institution',
    })
  }
}
