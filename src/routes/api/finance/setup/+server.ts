import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getDatabasePool } from '$lib/finance/services/database/connection'

// 스키마 SQL을 직접 정의 (파일 의존성 제거)
const FINANCE_SCHEMA_SQL = `
-- 자금일보 시스템 데이터베이스 스키마
-- PostgreSQL 기반

-- 은행 테이블
CREATE TABLE IF NOT EXISTS finance_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래 카테고리 테이블
CREATE TABLE IF NOT EXISTS finance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
    parent_id UUID REFERENCES finance_categories(id),
    color VARCHAR(7) DEFAULT '#6B7280',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계좌 테이블
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_id UUID NOT NULL REFERENCES finance_banks(id),
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'business', 'investment', 'loan')),
    balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'closed')),
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    alert_threshold DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bank_id, account_number)
);

-- 거래 테이블
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES finance_accounts(id),
    category_id UUID NOT NULL REFERENCES finance_categories(id),
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
    description TEXT,
    reference VARCHAR(100),
    transaction_date DATE NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 은행 데이터
INSERT INTO finance_banks (name, code, color) VALUES
('하나은행', 'HANA', '#FF6B6B'),
('전북은행', 'JEONBUK', '#4ECDC4'),
('농협은행', 'NH', '#45B7D1'),
('신한은행', 'SHINHAN', '#96CEB4'),
('국민은행', 'KB', '#FFEAA7'),
('우리은행', 'WOORI', '#DDA0DD'),
('기업은행', 'IBK', '#98D8C8'),
('새마을금고', 'SAEMAEUL', '#F7DC6F')
ON CONFLICT (code) DO NOTHING;

-- 기본 카테고리 데이터
INSERT INTO finance_categories (name, type, color, is_system) VALUES
-- 수입 카테고리
('매출', 'income', '#10B981', true),
('투자수익', 'income', '#059669', true),
('기타수입', 'income', '#047857', true),
-- 지출 카테고리
('급여', 'expense', '#EF4444', true),
('임대료', 'expense', '#DC2626', true),
('공과금', 'expense', '#B91C1C', true),
('마케팅', 'expense', '#F97316', true),
('운영비', 'expense', '#EA580C', true),
('기타지출', 'expense', '#C2410C', true)
ON CONFLICT DO NOTHING;
`

// 데이터베이스 초기화 및 기본 데이터 설정
export const POST: RequestHandler = async () => {
  try {
    const pool = getDatabasePool()

    // 스키마 실행
    await pool.query(FINANCE_SCHEMA_SQL)

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
