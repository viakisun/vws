import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { DatabaseService } from '$lib/database/connection'

// GET: Calculate total allocation for current user
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const user = locals.user
    if (!user?.employee_id) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = user.employee_id

    // Get all formations where user is a member with their allocations
    const result = await DatabaseService.query(
      `
      SELECT
        f.id as formation_id,
        f.name as formation_name,
        fm.role as member_role,
        fm.bandwidth,
        json_agg(
          json_build_object(
            'initiative_id', fi.initiative_id,
            'initiative_title', i.title,
            'allocation_percentage', fi.allocation_percentage
          )
        ) FILTER (WHERE fi.initiative_id IS NOT NULL) as initiatives
      FROM planner_formations f
      JOIN planner_formation_members fm ON f.id = fm.formation_id
      LEFT JOIN planner_formation_initiatives fi ON f.id = fi.formation_id AND fi.deleted_at IS NULL
      LEFT JOIN planner_initiatives i ON fi.initiative_id = i.id AND i.deleted_at IS NULL
      WHERE fm.employee_id = $1
        AND fm.deleted_at IS NULL
        AND f.deleted_at IS NULL
      GROUP BY f.id, f.name, fm.role, fm.bandwidth
    `,
      [employeeId],
    )

    const formations = result.rows.map((row: any) => {
      const initiatives = row.initiatives || []
      const totalAllocation = initiatives.reduce(
        (sum: number, init: any) => sum + (init.allocation_percentage || 0),
        0,
      )

      return {
        formation_id: row.formation_id,
        formation_name: row.formation_name,
        member_role: row.member_role,
        bandwidth: row.bandwidth,
        initiatives: initiatives.filter((i: any) => i.initiative_id !== null),
        total_allocation: totalAllocation,
      }
    })

    // Calculate overall total
    const overallTotal = formations.reduce((sum: number, f: any) => sum + f.total_allocation, 0)

    return json({
      success: true,
      data: {
        formations,
        total_allocation: overallTotal,
        is_over_allocated: overallTotal > 100,
      },
    })
  } catch (error) {
    console.error('Error calculating allocation:', error)
    return json(
      {
        success: false,
        error: 'Failed to calculate allocation',
      },
      { status: 500 },
    )
  }
}
