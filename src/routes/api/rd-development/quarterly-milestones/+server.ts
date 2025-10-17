import { RdDevQuarterlyMilestoneService } from '$lib/services/rd-development'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/rd-development/quarterly-milestones
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project_id')
    const phaseId = url.searchParams.get('phase_id')
    const year = url.searchParams.get('year')
    const quarter = url.searchParams.get('quarter')

    const milestones = await RdDevQuarterlyMilestoneService.getAllQuarterlyMilestones({
      project_id: projectId ? parseInt(projectId) : undefined,
      phase_id: phaseId ? parseInt(phaseId) : undefined,
      year: year ? parseInt(year) : undefined,
      quarter: quarter || undefined,
    })

    return json({
      success: true,
      data: milestones,
    })
  } catch (err) {
    console.error('Error fetching quarterly milestones:', err)
    return error(500, {
      message: 'Failed to fetch quarterly milestones',
    })
  }
}

// POST /api/rd-development/quarterly-milestones
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()

    const milestone = await RdDevQuarterlyMilestoneService.createQuarterlyMilestone(body)

    return json(
      {
        success: true,
        data: milestone,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('Error creating quarterly milestone:', err)
    return error(500, {
      message: 'Failed to create quarterly milestone',
    })
  }
}
