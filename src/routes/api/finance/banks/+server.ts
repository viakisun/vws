import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getDatabasePool } from '$lib/finance/services/database/connection'
import type { Bank } from '$lib/finance/types'

// 은행 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const pool = getDatabasePool()

    const isActive = url.searchParams.get('isActive')

    let query = 'SELECT * FROM finance_banks'
    const params: any[] = []

    if (isActive !== null) {
      query += ' WHERE is_active = $1'
      params.push(isActive === 'true')
    }

    query += ' ORDER BY name ASC'

    const result = await pool.query(query, params)

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
