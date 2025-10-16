import { auditService } from '$lib/services/asset/audit-service'
import type { CreateAuditDto } from '$lib/types/asset'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/assets/audit - 자산 실사 목록 조회
export const GET: RequestHandler = async () => {
  try {
    const audits = await auditService.list()
    return json({ success: true, data: audits })
  } catch (error) {
    console.error('Failed to fetch audits:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/assets/audit - 자산 실사 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateAuditDto = await request.json()
    const audit = await auditService.createAudit(data)
    return json({ success: true, data: audit }, { status: 201 })
  } catch (error) {
    console.error('Failed to create audit:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}
