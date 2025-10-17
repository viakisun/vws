import { RdDevPhaseService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/phases
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project_id')
    const yearNumber = url.searchParams.get('year_number')

    const phases = await RdDevPhaseService.getAllPhases({
      project_id: projectId ? parseInt(projectId) : undefined,
      year_number: yearNumber ? parseInt(yearNumber) : undefined,
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

    const phase = await RdDevPhaseService.createPhase(body)

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
