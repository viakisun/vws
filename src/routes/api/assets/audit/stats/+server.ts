import { auditService } from '$lib/services/asset/audit-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  try {
    const stats = await auditService.getDashboardStats()
    return json({ success: true, data: stats })
  } catch (error) {
    console.error('Failed to fetch audit stats:', error)
    return json({ success: false, error: 'Failed to fetch audit stats' }, { status: 500 })
  }
}
