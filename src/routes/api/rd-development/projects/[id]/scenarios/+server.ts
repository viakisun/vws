/**
 * R&D Development Verification Scenarios API
 * GET  /api/rd-development/projects/:id/scenarios - 시나리오 목록 조회
 * POST /api/rd-development/projects/:id/scenarios - 시나리오 생성
 */

import { RdDevVerificationScenarioService } from '$lib/services/rd-development'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const scenarioService = new RdDevVerificationScenarioService()

/**
 * 시나리오 목록 조회
 */
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const projectId = params.id
    const status = url.searchParams.get('status')

    let scenarios
    if (status) {
      scenarios = await scenarioService.getScenariosByStatus(projectId, status)
    } else {
      scenarios = await scenarioService.getScenariosByProjectId(projectId)
    }

    return json({ success: true, data: scenarios })
  } catch (error) {
    console.error('GET /api/rd-development/projects/[id]/scenarios error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch scenarios',
      },
      { status: 500 },
    )
  }
}

/**
 * 시나리오 생성
 */
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const projectId = params.id
    const data = await request.json()

    const scenario = await scenarioService.createScenario({
      project_id: projectId,
      ...data,
    })

    return json({ success: true, data: scenario }, { status: 201 })
  } catch (error) {
    console.error('POST /api/rd-development/projects/[id]/scenarios error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create scenario',
      },
      { status: 500 },
    )
  }
}
