import { auditService } from '$lib/services/asset/audit-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// POST /api/assets/audit/quarterly - 분기별 자산 실사 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { year, quarter } = await request.json()

    if (!year || !quarter || quarter < 1 || quarter > 4) {
      return json({ success: false, error: '올바른 연도와 분기를 입력해주세요.' }, { status: 400 })
    }

    const audit = await auditService.createQuarterlyAudit(year, quarter)
    return json({ success: true, data: audit }, { status: 201 })
  } catch (error) {
    console.error('Failed to create quarterly audit:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}
