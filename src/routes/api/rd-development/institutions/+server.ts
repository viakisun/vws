import { RdDevInstitutionService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/institutions
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project_id')
    const type = url.searchParams.get('type')
    const search = url.searchParams.get('search')

    const service = new RdDevInstitutionService()
    const institutions = await service.getInstitutions({
      project_id: projectId ? parseInt(projectId) : undefined,
      type: type || undefined,
      search: search || undefined,
    })

    return json({
      success: true,
      data: institutions,
    })
  } catch (err) {
    console.error('Error fetching institutions:', err)
    return error(500, {
      message: 'Failed to fetch institutions',
    })
  }
}

// POST /api/rd-development/institutions
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()

    const service = new RdDevInstitutionService()
    const institution = await service.createInstitution(body.project_id, body)

    return json(
      {
        success: true,
        data: institution,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('Error creating institution:', err)
    return error(500, {
      message: 'Failed to create institution',
    })
  }
}
