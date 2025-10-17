import { RdDevDeliverableService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/deliverables
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project_id')
    const phaseId = url.searchParams.get('phase_id')
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const search = url.searchParams.get('search')

    const service = new RdDevDeliverableService()
    const deliverables = await service.getDeliverables({
      project_id: projectId || undefined,
      phase_id: phaseId || undefined,
      status: (status as any) || undefined,
      type: type || undefined,
      search: search || undefined,
    })

    return json({
      success: true,
      data: deliverables,
    })
  } catch (err) {
    console.error('Error fetching deliverables:', err)
    return error(500, {
      message: 'Failed to fetch deliverables',
    })
  }
}

// POST /api/rd-development/deliverables
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()

    const service = new RdDevDeliverableService()
    const deliverable = await service.createDeliverable(body.project_id, body)

    return json(
      {
        success: true,
        data: deliverable,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('Error creating deliverable:', err)
    return error(500, {
      message: 'Failed to create deliverable',
    })
  }
}
