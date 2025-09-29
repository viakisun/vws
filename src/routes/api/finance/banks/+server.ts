import { query } from '$lib/database/connection'
import type { Bank } from '$lib/finance/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 은행 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const isActive = url.searchParams.get('isActive')

    let queryText = 'SELECT * FROM finance_banks'
    const params: any[] = []

    if (isActive !== null) {
      queryText += ' WHERE is_active = $1'
      params.push(isActive === 'true')
    }

    queryText += ' ORDER BY name ASC'

    const result = await query(queryText, params)

    const banks: Bank[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      color: row.color,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return json({
      success: true,
      data: banks,
      message: `${banks.length}개의 은행을 조회했습니다.`,
    })
  } catch (error) {
    console.error('은행 목록 조회 실패:', error)
    return json(
      {
        success: false,
        data: [],
        error: '은행 목록을 조회할 수 없습니다.',
      },
      { status: 500 },
    )
  }
}
