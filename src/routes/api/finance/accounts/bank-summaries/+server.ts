import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 은행별 계좌 요약 정보 조회
export const GET: RequestHandler = async () => {
  try {
    const queryText = `
      SELECT
        b.id as bank_id,
        b.name as bank_name,
        b.code as bank_code,
        b.color as bank_color,
        COUNT(a.id) as account_count,
        COUNT(CASE WHEN a.status = 'active' THEN 1 END) as active_account_count,
        SUM(
          COALESCE(
            (SELECT SUM(amount)
             FROM finance_transactions
             WHERE account_id = a.id),
            0
          )
        ) as total_balance
      FROM finance_banks b
      LEFT JOIN finance_accounts a ON b.id = a.bank_id
      GROUP BY b.id, b.name, b.code, b.color
      ORDER BY total_balance DESC
    `

    const result = await query(queryText)

    const summaries = result.rows.map((row) => ({
      bankId: row.bank_id,
      bankName: row.bank_name,
      bankCode: row.bank_code,
      bankColor: row.bank_color || '#3B82F6',
      accountCount: parseInt(row.account_count),
      activeAccountCount: parseInt(row.active_account_count),
      totalBalance: parseFloat(row.total_balance) || 0,
    }))

    return json({
      success: true,
      data: summaries,
    })
  } catch (error) {
    logger.error('은행별 요약 정보 조회 실패:', error)
    return json(
      {
        success: false,
        error: `은행별 요약 정보를 조회할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}
