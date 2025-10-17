import { RdDevPhaseService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/phases
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project_id')
    const yearNumber = url.searchParams.get('year_number')

    const service = new RdDevPhaseService()
    const phases = await service.getPhases({
      project_id: projectId ? parseInt(projectId) : undefined,
      status: url.searchParams.get('status') || undefined,
    })

    return json({
      success: true,
      data: phases,
    })
  } catch (err) {
    console.error('Error fetching phases:', err)
    return error(500, {
      message: 'Failed to fetch phases',
    })
  }
}

// POST /api/rd-development/phases
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()

    const service = new RdDevPhaseService()
    const phase = await service.createPhase(body.project_id, body)

    return json(
      {
        success: true,
        data: phase,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('Error creating phase:', err)
    return error(500, {
      message: 'Failed to create phase',
    })
  }
}
