import { RdDevTechnicalSpecService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/technical-specs
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project_id')
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')

    const technicalSpecs = await RdDevTechnicalSpecService.getAllTechnicalSpecs({
      project_id: projectId ? parseInt(projectId) : undefined,
      category: category || undefined,
      search: search || undefined,
    })

    return json({
      success: true,
      data: technicalSpecs,
    })
  } catch (err) {
    console.error('Error fetching technical specs:', err)
    return error(500, {
      message: 'Failed to fetch technical specs',
    })
  }
}

// POST /api/rd-development/technical-specs
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()

    const technicalSpec = await RdDevTechnicalSpecService.createTechnicalSpec(body)

    return json(
      {
        success: true,
        data: technicalSpec,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('Error creating technical spec:', err)
    return error(500, {
      message: 'Failed to create technical spec',
    })
  }
}
