import { query } from '$lib/database/connection'
import type { Account, CreateAccountRequest } from '$lib/finance/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 계좌 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    // 쿼리 파라미터 파싱
    const bankId = url.searchParams.get('bankId')
    const accountType = url.searchParams.get('accountType')
    const status = url.searchParams.get('status')
    const isPrimary = url.searchParams.get('isPrimary')
    const search = url.searchParams.get('search')

    // 동적 쿼리 구성 (거래 내역의 최신 balance 사용)
    let queryText = `
      SELECT
        a.*,
        b.name as bank_name,
        b.code as bank_code,
        b.color as bank_color,
        COALESCE(latest_tx.balance, 0) as current_balance
      FROM finance_accounts a
      LEFT JOIN finance_banks b ON a.bank_id = b.id
      LEFT JOIN LATERAL (
        SELECT balance
        FROM finance_transactions
        WHERE account_id = a.id
        ORDER BY transaction_date DESC, created_at DESC
        LIMIT 1
      ) latest_tx ON true
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (bankId) {
      queryText += ` AND a.bank_id = $${paramIndex++}`
      params.push(bankId)
    }

    if (accountType) {
      queryText += ` AND a.account_type = $${paramIndex++}`
      params.push(accountType)
    }

    if (status) {
      queryText += ` AND a.status = $${paramIndex++}`
      params.push(status)
    }

    if (isPrimary !== null) {
      queryText += ` AND a.is_primary = $${paramIndex++}`
      params.push(isPrimary === 'true')
    }

    if (search) {
      queryText += ` AND (a.name ILIKE $${paramIndex++} OR a.account_number ILIKE $${paramIndex++})`
      params.push(`%${search}%`, `%${search}%`)
    }

    queryText += ` ORDER BY a.is_primary DESC, a.created_at DESC`

    const result = await query(queryText, params)

    // 각 계좌의 태그 조회
    const accountIds = result.rows.map((row) => row.id)
    let tagsMap = new Map()

    if (accountIds.length > 0) {
      const tagsQuery = `
        SELECT
          r.account_id,
          t.id,
          t.name,
          t.color,
          t.description,
          t.tag_type as "tagType",
          t.is_system as "isSystem",
          t.is_active as "isActive",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt"
        FROM finance_account_tag_relations r
        INNER JOIN finance_account_tags t ON r.tag_id = t.id
        WHERE r.account_id = ANY($1)
        ORDER BY t.is_system DESC, t.name ASC
      `
      const tagsResult = await query(tagsQuery, [accountIds])

      // 계좌별로 태그 그룹화
      for (const row of tagsResult.rows) {
        if (!tagsMap.has(row.account_id)) {
          tagsMap.set(row.account_id, [])
        }
        tagsMap.get(row.account_id).push({
          id: row.id,
          name: row.name,
          color: row.color,
          description: row.description,
          tagType: row.tagType,
          isSystem: row.isSystem,
          isActive: row.isActive,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })
      }
    }

    const accounts: Account[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      accountNumber: row.account_number,
      bankId: row.bank_id,
      bank: {
        id: row.bank_id,
        name: row.bank_name,
        code: row.bank_code,
        color: row.bank_color,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      accountType: row.account_type,
      balance: parseFloat(row.current_balance),
      status: row.status,
      description: row.description,
      isPrimary: row.is_primary,
      alertThreshold: row.alert_threshold ? parseFloat(row.alert_threshold) : undefined,
      tags: tagsMap.get(row.id) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return json({
      success: true,
      data: accounts,
      message: `${accounts.length}개의 계좌를 조회했습니다.`,
    })
  } catch (error) {
    console.error('계좌 목록 조회 실패:', error)
    return json(
      {
        success: false,
        data: [],
        error: `계좌 목록을 조회할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}

// 새 계좌 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: CreateAccountRequest = await request.json()

    // 필수 필드 검증
    if (!body.name || !body.accountNumber || !body.bankId || !body.accountType) {
      return json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 계좌 생성 (balance 필드 제거됨)
    const queryText = `
      INSERT INTO finance_accounts (
        name, account_number, bank_id, account_type,
        description, is_primary, alert_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const params = [
      body.name,
      body.accountNumber.replace(/-/g, ''), // 하이픈 제거
      body.bankId,
      body.accountType,
      body.description || null,
      body.isPrimary || false,
      body.alertThreshold || null,
    ]

    const result = await query(queryText, params)
    const account = result.rows[0]

    // 은행 정보 조회
    const bankResult = await query('SELECT * FROM finance_banks WHERE id = $1', [account.bank_id])
    const bank = bankResult.rows[0]

    return json({
      success: true,
      data: {
        id: account.id,
        name: account.name,
        accountNumber: account.account_number,
        bankId: account.bank_id,
        bank: bank
          ? {
              id: bank.id,
              name: bank.name,
              code: bank.code || '',
              color: bank.color || '#3B82F6',
              isActive: true,
              createdAt: bank.created_at,
              updatedAt: bank.updated_at,
            }
          : undefined,
        accountType: account.account_type,
        balance: 0, // 새 계좌는 잔액이 0
        status: account.status,
        description: account.description,
        isPrimary: account.is_primary,
        alertThreshold: account.alert_threshold ? parseFloat(account.alert_threshold) : undefined,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
      },
      message: '계좌가 성공적으로 생성되었습니다.',
    })
  } catch (error) {
    console.error('계좌 생성 실패:', error)
    return json(
      {
        success: false,
        error: '계좌 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
