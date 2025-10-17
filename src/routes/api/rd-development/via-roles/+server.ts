import { RdDevViaRoleService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/via-roles
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project_id')
    const phaseId = url.searchParams.get('phase_id')
    const search = url.searchParams.get('search')

    const viaRoles = await RdDevViaRoleService.getAllViaRoles({
      project_id: projectId ? parseInt(projectId) : undefined,
      phase_id: phaseId ? parseInt(phaseId) : undefined,
      search: search || undefined,
    })

    return json({
      success: true,
      data: viaRoles,
    })
  } catch (err) {
    console.error('Error fetching VIA roles:', err)
    return error(500, {
      message: 'Failed to fetch VIA roles',
    })
  }
}

// POST /api/rd-development/via-roles
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()

    const viaRole = await RdDevViaRoleService.createViaRole(body)

    return json(
      {
        success: true,
        data: viaRole,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('Error creating VIA role:', err)
    return error(500, {
      message: 'Failed to create VIA role',
    })
  }
}
