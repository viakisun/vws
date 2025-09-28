import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getDatabasePool } from '$lib/finance/services/database/connection'

// 엑셀 데이터 내보내기
export const GET: RequestHandler = async ({ url }) => {
  try {
    const pool = getDatabasePool()
    const type = url.searchParams.get('type') || 'transactions'
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    let data: any[] = []
    let filename = ''

    switch (type) {
      case 'transactions':
        data = await exportTransactions(pool, startDate || undefined, endDate || undefined)
        filename = `거래내역_${new Date().toISOString().split('T')[0]}.csv`
        break
      case 'accounts':
        data = await exportAccounts(pool)
        filename = `계좌목록_${new Date().toISOString().split('T')[0]}.csv`
        break
      case 'budgets':
        data = await exportBudgets(pool)
        filename = `예산목록_${new Date().toISOString().split('T')[0]}.csv`
        break
      case 'loans':
        data = await exportLoans(pool)
        filename = `대출계획_${new Date().toISOString().split('T')[0]}.csv`
        break
      default:
        return json(
          {
            success: false,
            error: '지원하지 않는 내보내기 타입입니다.',
          },
          { status: 400 },
        )
    }

    // CSV 형식으로 변환
    const csv = convertToCSV(data)

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('엑셀 내보내기 실패:', error)
    return json(
      {
        success: false,
        error: '데이터 내보내기에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 거래 내역 내보내기
async function exportTransactions(pool: any, startDate?: string, endDate?: string) {
  let query = `
    SELECT
      t.transaction_date as "거래일",
      t.description as "설명",
      t.amount as "금액",
      t.type as "타입",
      t.status as "상태",
      t.reference_number as "참조번호",
      t.notes as "메모",
      a.name as "계좌명",
      c.name as "카테고리",
      b.name as "은행명"
    FROM finance_transactions t
    LEFT JOIN finance_accounts a ON t.account_id = a.id
    LEFT JOIN finance_categories c ON t.category_id = c.id
    LEFT JOIN finance_banks b ON a.bank_id = b.id
    WHERE 1=1
  `

  const params: any[] = []
  let paramIndex = 1

  if (startDate) {
    query += ` AND t.transaction_date >= $${paramIndex++}`
    params.push(startDate)
  }

  if (endDate) {
    query += ` AND t.transaction_date <= $${paramIndex++}`
    params.push(endDate)
  }

  query += ` ORDER BY t.transaction_date DESC`

  const result = await pool.query(query, params)
  return result.rows
}

// 계좌 목록 내보내기
async function exportAccounts(pool: any) {
  const result = await pool.query(`
    SELECT
      a.name as "계좌명",
      a.account_number as "계좌번호",
      a.account_type as "계좌타입",
      a.balance as "잔액",
      a.status as "상태",
      a.is_primary as "주요계좌",
      a.description as "설명",
      b.name as "은행명"
    FROM finance_accounts a
    LEFT JOIN finance_banks b ON a.bank_id = b.id
    ORDER BY a.is_primary DESC, a.created_at DESC
  `)

  return result.rows
}

// 예산 목록 내보내기
async function exportBudgets(pool: any) {
  const result = await pool.query(`
    SELECT
      b.name as "예산명",
      b.type as "예산타입",
      b.period as "예산기간",
      b.year as "연도",
      b.month as "월",
      b.quarter as "분기",
      b.planned_amount as "계획금액",
      b.actual_amount as "실제금액",
      b.status as "상태",
      b.description as "설명",
      c.name as "카테고리"
    FROM finance_budgets b
    LEFT JOIN finance_categories c ON b.category_id = c.id
    ORDER BY b.year DESC, b.month DESC
  `)

  return result.rows
}

// 대출 계획 내보내기
async function exportLoans(pool: any) {
  const result = await pool.query(`
    SELECT
      l.type as "대출타입",
      l.amount as "금액",
      l.interest_rate as "이자율",
      l.term as "기간",
      l.planned_date as "계획일",
      l.actual_date as "실행일",
      l.status as "상태",
      l.description as "설명",
      l.notes as "메모",
      a.name as "계좌명",
      b.name as "은행명"
    FROM finance_loans l
    LEFT JOIN finance_accounts a ON l.account_id = a.id
    LEFT JOIN finance_banks b ON a.bank_id = b.id
    ORDER BY l.planned_date ASC
  `)

  return result.rows
}

// 데이터를 CSV 형식으로 변환
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  // 헤더 생성
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')

  // 데이터 행 생성
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header]
        // 값에 쉼표나 따옴표가 있으면 따옴표로 감싸기
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(',')
  })

  // BOM 추가 (한글 깨짐 방지)
  const csv = '\uFEFF' + csvHeaders + '\n' + csvRows.join('\n')

  return csv
}
