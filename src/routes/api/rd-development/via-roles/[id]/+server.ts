import { RdDevViaRoleService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/via-roles/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid VIA role ID' })
    }

    const viaRole = await RdDevViaRoleService.getViaRoleById(id)

    if (!viaRole) {
      return error(404, { message: 'VIA role not found' })
    }

    return json({
      success: true,
      data: viaRole,
    })
  } catch (err) {
    console.error('Error fetching VIA role:', err)
    return error(500, {
      message: 'Failed to fetch VIA role',
    })
  }
}

// PUT /api/rd-development/via-roles/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid VIA role ID' })
    }

    const body = await request.json()

    const viaRole = await RdDevViaRoleService.updateViaRole(id, body)

    if (!viaRole) {
      return error(404, { message: 'VIA role not found' })
    }

    return json({
      success: true,
      data: viaRole,
    })
  } catch (err) {
    console.error('Error updating VIA role:', err)
    return error(500, {
      message: 'Failed to update VIA role',
    })
  }
}

// DELETE /api/rd-development/via-roles/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return error(400, { message: 'Invalid VIA role ID' })
    }

    const deleted = await RdDevViaRoleService.deleteViaRole(id)

    if (!deleted) {
      return error(404, { message: 'VIA role not found' })
    }

    return json({
      success: true,
      message: 'VIA role deleted successfully',
    })
  } catch (err) {
    console.error('Error deleting VIA role:', err)
    return error(500, {
      message: 'Failed to delete VIA role',
    })
  }
}
