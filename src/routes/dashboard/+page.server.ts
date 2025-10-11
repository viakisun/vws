import type { PageServerLoad } from './$types'
import { productService } from '$lib/planner/services/product.service'
import { initiativeService } from '$lib/planner/services/initiative.service'
import { query } from '$lib/database/connection'
import { getHoliday } from '$lib/utils/holidays'

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user

  // Load user's products and upcoming milestone initiatives in parallel
  const [products, initiatives] = await Promise.all([
    user ? productService.list({ owner_id: user.id }) : Promise.resolve([]),
    user ? initiativeService.list({ owner_id: user.id }) : Promise.resolve([]),
  ])

  // Filter initiatives with horizon (exclude completed)
  const upcomingInitiatives = initiatives.filter((initiative) => {
    if (!initiative.horizon) return false
    if (initiative.status === 'shipped') return false
    if (initiative.status === 'abandoned') return false

    return true
  })

  // Get today's attendance and leave status
  let attendanceStatus: {
    today: string
    attendance: any
    hasLeave: boolean
    leaveInfo: any
    isHoliday: boolean
    workStartTime: string
  } | null = null
  if (user?.id) {
    const today = new Date().toISOString().split('T')[0]

    // Check today's attendance record
    const attendanceResult = await query(
      `SELECT id, check_in_time::text as check_in_time, check_out_time::text as check_out_time, status
       FROM attendance
       WHERE employee_id = $1 AND DATE(check_in_time) = $2`,
      [user.id, today],
    )

    // Check if today is a leave day
    const leaveResult = await query(
      `SELECT lr.id, lr.leave_type_id, lt.name as leave_type_name, lr.start_date, lr.end_date
       FROM leave_requests lr
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.employee_id = $1
         AND lr.status = 'approved'
         AND $2 >= lr.start_date
         AND $2 <= lr.end_date`,
      [user.id, today],
    )

    // Get attendance settings for work hours
    const companyResult = await query(`SELECT id FROM companies LIMIT 1`)
    const companyId = companyResult.rows[0]?.id

    let workStartTime = '09:00:00'
    if (companyId) {
      const settingsResult = await query(
        `SELECT work_start_time FROM attendance_settings WHERE company_id = $1`,
        [companyId],
      )
      if (settingsResult.rows.length > 0) {
        workStartTime = settingsResult.rows[0].work_start_time
      }
    }

    const isHoliday = getHoliday(today) !== null
    const hasLeave = leaveResult.rows.length > 0
    const attendance = attendanceResult.rows[0] || null

    attendanceStatus = {
      today,
      attendance,
      hasLeave,
      leaveInfo: hasLeave ? leaveResult.rows[0] : null,
      isHoliday,
      workStartTime,
    }
  }

  return {
    user,
    products,
    upcomingInitiatives,
    attendanceStatus,
  }
}
