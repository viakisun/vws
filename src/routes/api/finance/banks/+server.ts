import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import type { Bank } from '$lib/finance/types'

// ============================================================================
// Types
// ============================================================================

interface BankRow {
  id: string
  name: string
  code: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CreateBankInput {
  name?: string
  code?: string
  color?: string
  isActive?: boolean
}

interface UpdateBankInput {
  id?: string
  name?: string
  code?: string
  color?: string
  isActive?: boolean
}

interface DeleteBankInput {
  id?: string
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BANK_COLOR = '#3B82F6'

const SELECT_BANK_FIELDS = `
  id, name, code, color, is_active, created_at, updated_at
`

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * DB row를 Bank 객체로 변환
 */
function mapRowToBank(row: BankRow): Bank {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    color: row.color,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * 에러 응답 생성
 */
function errorResponse(message: string, status: number) {
  return json({ success: false, error: message }, { status })
}

/**
 * 은행 존재 여부 확인
 */
async function bankExists(id: string): Promise<boolean> {
  try {
    const result = await query<{ id: string }>('SELECT id FROM finance_banks WHERE id = $1', [id])
    return result.rows.length > 0
  } catch {
    return false
  }
}

/**
 * 은행 코드 중복 확인
 */
async function isDuplicateCode(code: string, excludeId?: string): Promise<boolean> {
  try {
    const queryText = excludeId
      ? 'SELECT id FROM finance_banks WHERE code = $1 AND id != $2'
      : 'SELECT id FROM finance_banks WHERE code = $1'

    const params = excludeId ? [code, excludeId] : [code]
    const result = await query<{ id: string }>(queryText, params)
    return result.rows.length > 0
  } catch {
    return false
  }
}

// ============================================================================
// Request Handlers
// ============================================================================

/**
 * 은행 목록 조회 API
 * GET /api/finance/banks?isActive=true
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const isActive = url.searchParams.get('isActive')

    // 쿼리 구성
    const conditions: string[] = []
    const params: (boolean | string)[] = []

    if (isActive !== null) {
      conditions.push(`is_active = $${params.length + 1}`)
      params.push(isActive === 'true')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const queryText = `
      SELECT id, name, code, color, is_active, created_at, updated_at
      FROM finance_banks
      ${whereClause}
      ORDER BY name ASC
    `

    const result = await query<BankRow>(queryText, params)
    const banks = result.rows.map(mapRowToBank)

    return json({
      success: true,
      data: banks,
      total: banks.length,
    })
  } catch (error) {
    logger.error('Bank list retrieval failed:', error)
    return errorResponse('Failed to retrieve bank list', 500)
  }
}

/**
 * 은행 생성 API
 * POST /api/finance/banks
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = (await request.json()) as CreateBankInput

    // 입력 검증
    if (!body.name || !body.code) {
      return errorResponse('Name and code are required', 400)
    }

    // 중복 코드 확인
    if (await isDuplicateCode(body.code)) {
      return errorResponse('Bank code already exists', 409)
    }

    // 은행 생성
    const result = await query<BankRow>(
      `INSERT INTO finance_banks (name, code, color, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING ${SELECT_BANK_FIELDS}`,
      [body.name, body.code, body.color || DEFAULT_BANK_COLOR, body.isActive ?? true],
    )

    const bank = mapRowToBank(result.rows[0])
    logger.info(`Bank created: ${bank.name} (${bank.code})`)

    return json({ success: true, data: bank })
  } catch (error) {
    logger.error('Bank creation failed:', error)
    return errorResponse('Failed to create bank', 500)
  }
}

/**
 * 은행 수정 API
 * PUT /api/finance/banks
 */
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const body = (await request.json()) as UpdateBankInput

    // ID 검증
    if (!body.id) {
      return errorResponse('Bank ID is required', 400)
    }

    // 은행 존재 확인
    if (!(await bankExists(body.id))) {
      return errorResponse('Bank not found', 404)
    }

    // 코드 중복 확인 (자기 자신 제외)
    if (body.code && (await isDuplicateCode(body.code, body.id))) {
      return errorResponse('Bank code already exists', 409)
    }

    // 업데이트 필드 동적 구성
    const updates: string[] = []
    const params: (string | boolean)[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      params.push(body.name)
    }
    if (body.code !== undefined) {
      updates.push(`code = $${paramIndex++}`)
      params.push(body.code)
    }
    if (body.color !== undefined) {
      updates.push(`color = $${paramIndex++}`)
      params.push(body.color)
    }
    if (body.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      params.push(body.isActive)
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', 400)
    }

    updates.push(`updated_at = NOW()`)
    params.push(body.id)

    const result = await query<BankRow>(
      `UPDATE finance_banks
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING ${SELECT_BANK_FIELDS}`,
      params,
    )

    const bank = mapRowToBank(result.rows[0])
    logger.info(`Bank updated: ${bank.name} (${bank.code})`)

    return json({ success: true, data: bank })
  } catch (error) {
    logger.error('Bank update failed:', error)
    return errorResponse('Failed to update bank', 500)
  }
}

/**
 * 은행 삭제 API
 * DELETE /api/finance/banks
 */
export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const body = (await request.json()) as DeleteBankInput

    // ID 검증
    if (!body.id) {
      return errorResponse('Bank ID is required', 400)
    }

    // 연결된 계좌 확인
    const linkedAccounts = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM finance_accounts WHERE bank_id = $1',
      [body.id],
    )

    const accountCount = parseInt(linkedAccounts.rows[0].count)
    if (accountCount > 0) {
      return errorResponse('Cannot delete bank with existing accounts', 409)
    }

    // 은행 삭제
    const result = await query<{ name: string; code: string }>(
      'DELETE FROM finance_banks WHERE id = $1 RETURNING name, code',
      [body.id],
    )

    if (result.rows.length === 0) {
      return errorResponse('Bank not found', 404)
    }

    const deleted = result.rows[0]
    logger.info(`Bank deleted: ${deleted.name} (${deleted.code})`)

    return json({ success: true, message: 'Bank deleted successfully' })
  } catch (error) {
    logger.error('Bank deletion failed:', error)
    return errorResponse('Failed to delete bank', 500)
  }
}
