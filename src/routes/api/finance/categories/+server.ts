import { query } from '$lib/database/connection'
import type { TransactionCategory } from '$lib/finance/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 카테고리 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const type = url.searchParams.get('type')
    const isActive = url.searchParams.get('isActive')
    const isSystem = url.searchParams.get('isSystem')

    let queryText = 'SELECT * FROM finance_categories'
    const params: any[] = []
    const conditions: string[] = []

    if (type) {
      conditions.push(`type = $${params.length + 1}`)
      params.push(type)
    }

    if (isActive !== null) {
      conditions.push(`is_active = $${params.length + 1}`)
      params.push(isActive === 'true')
    }

    if (isSystem !== null) {
      conditions.push(`is_system = $${params.length + 1}`)
      params.push(isSystem === 'true')
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`
    }

    queryText += ' ORDER BY type, name ASC'

    const result = await query(queryText, params)

    const categories: TransactionCategory[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      parentId: row.parent_id,
      accountingCode: row.accounting_code,
      taxCode: row.tax_code,
      color: row.color,
      description: row.description,
      isActive: row.is_active,
      isSystem: row.is_system,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return json({
      success: true,
      data: categories,
      message: `${categories.length}개의 카테고리를 조회했습니다.`,
    })
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error)
    return json(
      {
        success: false,
        data: [],
        error: '카테고리 목록을 조회할 수 없습니다.',
      },
      { status: 500 },
    )
  }
}
