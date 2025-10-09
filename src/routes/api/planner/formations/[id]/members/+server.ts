import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { formationService } from '$lib/planner/services/formation.service'
import type { AddFormationMemberInput } from '$lib/planner/types'

// Add member to formation
export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: AddFormationMemberInput = {
      formation_id: params.id,
      employee_id: body.employee_id,
      role: body.role || 'contributor',
      bandwidth: body.bandwidth || 'partial',
    }

    if (!input.employee_id) {
      return json(
        {
          success: false,
          error: 'Missing required field: employee_id',
        },
        { status: 400 },
      )
    }

    const member = await formationService.addMember(input, user.id)

    return json({
      success: true,
      data: member,
    })
  } catch (error) {
    console.error('Failed to add formation member:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add formation member',
      },
      { status: 500 },
    )
  }
}

// Remove member from formation
export const DELETE: RequestHandler = async ({ params, url, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = url.searchParams.get('employee_id')
    if (!employeeId) {
      return json(
        {
          success: false,
          error: 'Missing required parameter: employee_id',
        },
        { status: 400 },
      )
    }

    await formationService.removeMember(params.id, employeeId, user.id)

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to remove formation member:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove formation member',
      },
      { status: 500 },
    )
  }
}
