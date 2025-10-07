import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 엑셀 데이터 가져오기
export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file || !type) {
      return json(
        {
          success: false,
          error: '파일과 타입이 필요합니다.',
        },
        { status: 400 },
      )
    }

    // 파일 내용 읽기
    const content = await file.text()
    const data = parseCSV(content)

    let result: any = {}

    switch (type) {
      case 'transactions':
        result = await importTransactions(data)
        break
      case 'accounts':
        result = await importAccounts(data)
        break
      case 'budgets':
        result = await importBudgets(data)
        break
      default:
        return json(
          {
            success: false,
            error: '지원하지 않는 가져오기 타입입니다.',
          },
          { status: 400 },
        )
    }

    return json({
      success: true,
      data: result,
      message: `${result.success}개 성공, ${result.failed}개 실패`,
    })
  } catch (error) {
    logger.error('엑셀 가져오기 실패:', error)
    return json(
      {
        success: false,
        error: '데이터 가져오기에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// CSV 파싱
function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
  const data: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''))
    if (values.length !== headers.length) continue

    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    data.push(row)
  }

  return data
}

// 거래 내역 가져오기
async function importTransactions(data: any[]) {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const row of data) {
    try {
      // 필수 필드 검증
      if (!row['거래일'] || !row['설명'] || !row['금액'] || !row['타입']) {
        failed++
        errors.push(`행 ${success + failed}: 필수 필드가 누락되었습니다.`)
        continue
      }

      // 계좌 ID 조회
      let accountId = null
      if (row['계좌명']) {
        const accountResult = await query('SELECT id FROM finance_accounts WHERE name = $1', [
          row['계좌명'],
        ])
        if (accountResult.rows.length > 0) {
          accountId = accountResult.rows[0].id
        }
      }

      // 카테고리 ID 조회
      let categoryId = null
      if (row['카테고리']) {
        const categoryResult = await query('SELECT id FROM finance_categories WHERE name = $1', [
          row['카테고리'],
        ])
        if (categoryResult.rows.length > 0) {
          categoryId = categoryResult.rows[0].id
        }
      }

      // 거래 생성
      await query(
        `
        INSERT INTO finance_transactions (
          account_id, category_id, amount, type, description,
          transaction_date, reference_number, notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed')
        `,
        [
          accountId,
          categoryId,
          parseFloat(row['금액']),
          row['타입'],
          row['설명'],
          row['거래일'],
          row['참조번호'] || null,
          row['메모'] || null,
        ],
      )

      success++
    } catch (error) {
      failed++
      errors.push(
        `행 ${success + failed}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      )
    }
  }

  return { success, failed, errors }
}

// 계좌 목록 가져오기
async function importAccounts(data: any[]) {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const row of data) {
    try {
      // 필수 필드 검증
      if (!row['계좌명'] || !row['계좌번호'] || !row['계좌타입']) {
        failed++
        errors.push(`행 ${success + failed}: 필수 필드가 누락되었습니다.`)
        continue
      }

      // 은행 ID 조회
      let bankId = null
      if (row['은행명']) {
        const bankResult = await query('SELECT id FROM finance_banks WHERE name = $1', [
          row['은행명'],
        ])
        if (bankResult.rows.length > 0) {
          bankId = bankResult.rows[0].id
        }
      }

      // 계좌 생성
      await query(
        `
        INSERT INTO finance_accounts (
          name, account_number, bank_id, account_type,
          balance, status, is_primary, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          row['계좌명'],
          row['계좌번호'],
          bankId,
          row['계좌타입'],
          parseFloat(row['잔액'] || '0'),
          row['상태'] || 'active',
          row['주요계좌'] === 'true' || row['주요계좌'] === true,
          row['설명'] || null,
        ],
      )

      success++
    } catch (error) {
      failed++
      errors.push(
        `행 ${success + failed}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      )
    }
  }

  return { success, failed, errors }
}

// 예산 목록 가져오기
async function importBudgets(data: any[]) {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const row of data) {
    try {
      // 필수 필드 검증
      if (!row['예산명'] || !row['예산타입'] || !row['예산기간'] || !row['연도']) {
        failed++
        errors.push(`행 ${success + failed}: 필수 필드가 누락되었습니다.`)
        continue
      }

      // 카테고리 ID 조회
      let categoryId = null
      if (row['카테고리']) {
        const categoryResult = await query('SELECT id FROM finance_categories WHERE name = $1', [
          row['카테고리'],
        ])
        if (categoryResult.rows.length > 0) {
          categoryId = categoryResult.rows[0].id
        }
      }

      // 예산 생성
      await query(
        `
        INSERT INTO finance_budgets (
          name, type, period, year, month, quarter,
          category_id, planned_amount, actual_amount, status, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          row['예산명'],
          row['예산타입'],
          row['예산기간'],
          parseInt(row['연도']),
          row['월'] ? parseInt(row['월']) : null,
          row['분기'] ? parseInt(row['분기']) : null,
          categoryId,
          parseFloat(row['계획금액'] || '0'),
          parseFloat(row['실제금액'] || '0'),
          row['상태'] || 'active',
          row['설명'] || null,
        ],
      )

      success++
    } catch (error) {
      failed++
      errors.push(
        `행 ${success + failed}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      )
    }
  }

  return { success, failed, errors }
}
