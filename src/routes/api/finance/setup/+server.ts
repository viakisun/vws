import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getDatabasePool } from '$lib/finance/services/database/connection'
import { readFileSync } from 'fs'
import { join } from 'path'

// 데이터베이스 초기화 및 기본 데이터 설정
export const POST: RequestHandler = async () => {
  try {
    const pool = getDatabasePool()

    // 스키마 파일 읽기
    const schemaPath = join(process.cwd(), 'src/lib/finance/services/database/schema.sql')
    const schemaSQL = readFileSync(schemaPath, 'utf-8')

    // 스키마 실행
    await pool.query(schemaSQL)

    // 기본 계좌 생성 (예시 데이터)
    const sampleAccounts = [
      {
        name: '하나은행 주거래계좌',
        accountNumber: '123-456-789',
        bankId: await getBankId(pool, 'HANA'),
        accountType: 'checking',
        initialBalance: 0, // 모든 계좌는 0원에서 시작
        isPrimary: true,
      },
      {
        name: '전북은행 예금계좌',
        accountNumber: '987-654-321',
        bankId: await getBankId(pool, 'JEONBUK'),
        accountType: 'savings',
        initialBalance: 0, // 모든 계좌는 0원에서 시작
        isPrimary: false,
      },
      {
        name: '농협은행 사업자계좌',
        accountNumber: '456-789-123',
        bankId: await getBankId(pool, 'NH'),
        accountType: 'business',
        initialBalance: 0, // 모든 계좌는 0원에서 시작
        isPrimary: false,
      },
    ]

    for (const account of sampleAccounts) {
      await pool.query(
        `
        INSERT INTO finance_accounts (name, account_number, bank_id, account_type, balance, is_primary)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (bank_id, account_number) DO NOTHING
      `,
        [
          account.name,
          account.accountNumber,
          account.bankId,
          account.accountType,
          account.initialBalance,
          account.isPrimary,
        ],
      )
    }

    // 샘플 거래 내역 생성
    await createSampleTransactions(pool)

    return json({
      success: true,
      message: '자금일보 시스템이 성공적으로 초기화되었습니다.',
    })
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error)
    return json(
      {
        success: false,
        error: `데이터베이스 초기화에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}

// 은행 ID 조회 헬퍼 함수
async function getBankId(pool: any, bankCode: string): Promise<string> {
  const result = await pool.query('SELECT id FROM finance_banks WHERE code = $1', [bankCode])
  return result.rows[0].id
}

// 샘플 거래 내역 생성
async function createSampleTransactions(pool: any) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const accounts = await pool.query('SELECT id FROM finance_accounts LIMIT 3')
  const categories = await pool.query(
    'SELECT id, type, name FROM finance_categories WHERE is_active = true',
  )

  // 카테고리 매핑
  const incomeCategory = categories.rows.find((c: any) => c.type === 'income')
  const salaryCategory = categories.rows.find((c: any) => c.type === 'expense' && c.name === '급여')
  const rentCategory = categories.rows.find((c: any) => c.type === 'expense' && c.name === '임대료')
  const utilityCategory = categories.rows.find(
    (c: any) => c.type === 'expense' && c.name === '공과금',
  )

  const sampleTransactions = [
    {
      accountId: accounts.rows[0].id,
      categoryId: incomeCategory?.id,
      amount: 10000000, // 1천만원
      type: 'income',
      description: '월 매출',
      transactionDate: today.toISOString().split('T')[0],
    },
    {
      accountId: accounts.rows[0].id,
      categoryId: salaryCategory?.id,
      amount: 5000000, // 5백만원
      type: 'expense',
      description: '직원 급여',
      transactionDate: today.toISOString().split('T')[0],
    },
    {
      accountId: accounts.rows[0].id,
      categoryId: rentCategory?.id,
      amount: 2000000, // 2백만원
      type: 'expense',
      description: '사무실 임대료',
      transactionDate: yesterday.toISOString().split('T')[0],
    },
    {
      accountId: accounts.rows[0].id,
      categoryId: utilityCategory?.id,
      amount: 500000, // 50만원
      type: 'expense',
      description: '전기세',
      transactionDate: yesterday.toISOString().split('T')[0],
    },
  ]

  // null이 아닌 카테고리만 처리
  const validTransactions = sampleTransactions.filter((t) => t.categoryId)

  for (const transaction of validTransactions) {
    await pool.query(
      `
      INSERT INTO finance_transactions (account_id, category_id, amount, type, description, transaction_date)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        transaction.accountId,
        transaction.categoryId,
        transaction.amount,
        transaction.type,
        transaction.description,
        transaction.transactionDate,
      ],
    )
  }
}
