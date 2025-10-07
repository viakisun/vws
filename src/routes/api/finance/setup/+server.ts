/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

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
    accounting_code VARCHAR(10),
    tax_code VARCHAR(10),
    color VARCHAR(7) DEFAULT '#6B7280',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계좌 태그 테이블
CREATE TABLE IF NOT EXISTS finance_account_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT,
    tag_type VARCHAR(20) DEFAULT 'custom' CHECK (tag_type IN ('dashboard', 'revenue', 'operation', 'fund', 'rnd', 'custom')),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계좌 테이블
-- 잔액(balance)은 저장하지 않음 - transactions 테이블의 최신 balance로 계산
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_id UUID NOT NULL REFERENCES finance_banks(id),
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'business', 'investment', 'loan')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'closed')),
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    alert_threshold DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bank_id, account_number)
);

-- 계좌-태그 연결 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS finance_account_tag_relations (
    account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES finance_account_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (account_id, tag_id)
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
    reference_number VARCHAR(100),
    notes TEXT,
    tags TEXT[],
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 예산 테이블
CREATE TABLE IF NOT EXISTS finance_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('monthly', 'quarterly', 'yearly', 'project')),
    period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly', 'custom')),
    year INTEGER NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12),
    quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
    category_id UUID REFERENCES finance_categories(id),
    account_id UUID REFERENCES finance_accounts(id),
    planned_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    actual_amount DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
    description TEXT,
    tags TEXT[],
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 테이블에 status 컬럼 추가 (이미 존재하는 경우 무시)
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';

-- transaction_date 컬럼을 TIMESTAMP WITH TIME ZONE으로 변경
-- 기존 DATE 타입의 데이터를 TIMESTAMP WITH TIME ZONE으로 변환
DO $$
BEGIN
    -- 컬럼이 DATE 타입인지 확인하고 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finance_transactions' 
        AND column_name = 'transaction_date' 
        AND data_type = 'date'
    ) THEN
        -- 기존 데이터를 보존하면서 컬럼 타입 변경
        ALTER TABLE finance_transactions 
        ALTER COLUMN transaction_date TYPE TIMESTAMP WITH TIME ZONE 
        USING transaction_date::timestamp with time zone;
    END IF;
END $$;

-- 기본 은행 데이터
INSERT INTO finance_banks (name, code, color) VALUES
('KB국민은행', 'KB', '#FFEAA7'),
('신한은행', 'SHINHAN', '#96CEB4'),
('우리은행', 'WOORI', '#DDA0DD'),
('KEB하나은행', 'HANA', '#FF6B6B'),
('NH농협은행', 'NH', '#45B7D1'),
('IBK기업은행', 'IBK', '#98D8C8'),
('SC제일은행', 'SC', '#00A9CE'),
('한국씨티은행', 'CITI', '#003DA5'),
('BNK부산은행', 'BNK_BUSAN', '#FF6B9D'),
('BNK경남은행', 'BNK_KYONGNAM', '#FF4B77'),
('DGB대구은행', 'DGB', '#0066B2'),
('전북은행', 'JEONBUK', '#4ECDC4'),
('광주은행', 'KWANGJU', '#00A9E0'),
('제주은행', 'JEJU', '#FF6B35'),
('Sh수협은행', 'SUHYUP', '#0094D9'),
('케이뱅크', 'KBANK', '#FFD400'),
('카카오뱅크', 'KAKAOBANK', '#FFEB00'),
('토스뱅크', 'TOSSBANK', '#0064FF'),
('새마을금고', 'SAEMAEUL', '#F7DC6F')
ON CONFLICT (code) DO NOTHING;

-- 시스템 태그 데이터
INSERT INTO finance_account_tags (name, color, description, tag_type, is_system) VALUES
('대시보드', '#3B82F6', '대시보드에 표시되는 주요 계좌', 'dashboard', true),
('매출통장', '#10B981', '매출 분석 대상 계좌', 'revenue', true),
('운영비', '#EF4444', '운영비 분석 대상 계좌', 'operation', true),
('자금관리', '#F59E0B', '자금관리 분석 대상 계좌', 'fund', true),
('R&D', '#8B5CF6', '연구개발 계좌 (회사 자금 집계 제외)', 'rnd', true)
ON CONFLICT (name) DO NOTHING;

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

// 거래 타입 정의
type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment'

// 계좌 정보 타입
interface AccountInfo {
  name: string
  accountNumber: string
  bankId: string
  accountType: string
  initialBalance: number
  isPrimary: boolean
}

// 거래 타입별 계좌 잔액 업데이트 함수
async function updateAccountBalance(
  accountId: string,
  amount: number,
  type: TransactionType,
): Promise<void> {
  try {
    let balanceChange = 0

    switch (type) {
      case 'income':
        // 수입: 잔액 증가 (+)
        balanceChange = amount
        break
      case 'expense':
        // 지출: 잔액 감소 (-)
        balanceChange = -amount
        break
      case 'transfer':
        // 이체: 별도 처리 필요 (출금 계좌와 입금 계좌 모두 필요)
        // 이 함수에서는 단일 계좌만 처리하므로 잔액 변화 없음
        balanceChange = 0
        break
      case 'adjustment':
        // 조정: 잔액 변화 없음 (0)
        balanceChange = 0
        break
      default:
        logger.warn(`알 수 없는 거래 타입: ${type}`)
        balanceChange = 0
    }

    // 잔액 업데이트는 거래 내역의 balance 필드에서 자동으로 계산됩니다
    // finance_accounts 테이블의 balance 컬럼은 제거되었으므로 별도 업데이트 불필요
  } catch (error) {
    logger.error('계좌 잔액 업데이트 실패:', error)
    throw error
  }
}

// 데이터베이스 초기화 및 기본 데이터 설정
export const POST: RequestHandler = async () => {
  try {
    // 스키마 실행
    await query(FINANCE_SCHEMA_SQL)

    // 샘플 데이터는 생성하지 않음 - 사용자가 직접 계좌를 추가해야 함

    return json({
      success: true,
      message: '자금일보 시스템이 성공적으로 초기화되었습니다.',
    })
  } catch (error) {
    logger.error('데이터베이스 초기화 실패:', error)
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
async function getBankId(bankCode: string): Promise<string> {
  const result = await query<{ id: string }>('SELECT id FROM finance_banks WHERE code = $1', [
    bankCode,
  ])
  if (!result.rows[0]) {
    throw new Error(`은행을 찾을 수 없습니다: ${bankCode}`)
  }
  return result.rows[0].id
}

// 데이터베이스 행 타입 정의
interface AccountRow extends Record<string, unknown> {
  id: string
}

interface CategoryRow extends Record<string, unknown> {
  id: string
  type: string
  name: string
}

interface SampleTransaction {
  accountId: string
  categoryId: string | undefined
  amount: number
  type: TransactionType
  description: string
  transactionDate: string
}

// 샘플 거래 내역 생성 (사용 안 함)
async function createSampleTransactions(): Promise<void> {
  // 더 이상 샘플 데이터를 생성하지 않음
  return
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const accounts = await query<AccountRow>('SELECT id FROM finance_accounts LIMIT 3')
  const categories = await query<CategoryRow>(
    'SELECT id, type, name FROM finance_categories WHERE is_active = true',
  )

  // 카테고리 매핑
  const incomeCategory = categories.rows.find((c) => c.type === 'income')
  const salaryCategory = categories.rows.find((c) => c.type === 'expense' && c.name === '급여')
  const rentCategory = categories.rows.find((c) => c.type === 'expense' && c.name === '임대료')
  const utilityCategory = categories.rows.find((c) => c.type === 'expense' && c.name === '공과금')

  const accountId = accounts.rows[0]?.id
  if (!accountId) {
    throw new Error('계좌를 찾을 수 없습니다')
  }

  const sampleTransactions: SampleTransaction[] = [
    {
      accountId,
      categoryId: incomeCategory?.id,
      amount: 10000000, // 1천만원
      type: 'income',
      description: '월 매출',
      transactionDate: today.toISOString(),
    },
    {
      accountId,
      categoryId: salaryCategory?.id,
      amount: 5000000, // 5백만원
      type: 'expense',
      description: '직원 급여',
      transactionDate: today.toISOString(),
    },
    {
      accountId,
      categoryId: rentCategory?.id,
      amount: 2000000, // 2백만원
      type: 'expense',
      description: '사무실 임대료',
      transactionDate: yesterday.toISOString(),
    },
    {
      accountId,
      categoryId: utilityCategory?.id,
      amount: 500000, // 50만원
      type: 'expense',
      description: '전기세',
      transactionDate: yesterday.toISOString(),
    },
  ]

  // null이 아닌 카테고리만 처리
  const validTransactions = sampleTransactions.filter(
    (t): t is SampleTransaction & { categoryId: string } => t.categoryId !== undefined,
  )

  for (const transaction of validTransactions) {
    await query(
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

    // 계좌 잔액 업데이트
    await updateAccountBalance(transaction.accountId, transaction.amount, transaction.type)
  }
}
