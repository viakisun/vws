import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

/**
 * 자금일보 시스템 데이터베이스 스키마 초기화 API
 *
 * POST /api/finance/setup - 테이블 생성 및 기본 데이터 초기화
 */

// ============================================
// 테이블 스키마 정의
// ============================================
const CREATE_TABLES_SQL = `
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accounting_code VARCHAR(10),
    tax_code VARCHAR(10),
    is_default BOOLEAN DEFAULT false,
    code VARCHAR(10),
    account_code VARCHAR(20)
);

-- 계좌 태그 테이블
CREATE TABLE IF NOT EXISTS finance_account_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT,
    tag_type VARCHAR(20) DEFAULT 'custom' CHECK (tag_type IN ('dashboard', 'revenue', 'operation', 'rnd', 'custom')),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
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
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'closed')),
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bank_id, account_number)
);

-- 계좌-태그 관계 테이블
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
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'completed',
    reference_number VARCHAR(100),
    notes TEXT,
    tags TEXT[],
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern TEXT,
    counterparty VARCHAR(255),
    deposits BIGINT DEFAULT 0,
    withdrawals BIGINT DEFAULT 0,
    balance BIGINT DEFAULT 0
);

`

// ============================================
// 인덱스 생성
// ============================================
const CREATE_INDEXES_SQL = `
-- Categories 인덱스
CREATE INDEX IF NOT EXISTS idx_finance_categories_code ON finance_categories(code);
CREATE INDEX IF NOT EXISTS idx_finance_categories_account_code ON finance_categories(account_code);
`

// ============================================
// 기본 데이터 삽입
// ============================================
const INSERT_INITIAL_DATA_SQL = `
-- 한국 주요 은행 데이터
INSERT INTO finance_banks (name, code, color) VALUES
('하나은행', 'HANA', '#FF6B6B'),
('농협은행', 'NH', '#45B7D1'),
('전북은행', 'JEONBUK', '#4ECDC4'),
('국민은행', 'KB', '#FFEAA7'),
('신한은행', 'SHINHAN', '#96CEB4'),
('우리은행', 'WOORI', '#DDA0DD'),
('기업은행', 'IBK', '#98D8C8'),
('새마을금고', 'SAEMAEUL', '#F7DC6F'),
('SC제일은행', 'SC', '#A29BFE'),
('한국씨티은행', 'CITI', '#74B9FF'),
('KEB하나은행', 'KEB', '#FD79A8'),
('카카오뱅크', 'KAKAO', '#FDCB6E'),
('케이뱅크', 'KBANK', '#6C5CE7'),
('토스뱅크', 'TOSS', '#0984E3'),
('부산은행', 'BUSAN', '#00B894'),
('대구은행', 'DAEGU', '#E17055'),
('경남은행', 'KYONGNAM', '#FFEAA7'),
('광주은행', 'GWANGJU', '#A29BFE'),
('제주은행', 'JEJU', '#74B9FF'),
('수협은행', 'SUHYUP', '#00CEC9')
ON CONFLICT (code) DO NOTHING;

-- 기본 카테고리 데이터
INSERT INTO finance_categories (name, type, color, is_system) VALUES
-- 수입 카테고리
('매출', 'income', '#10B981', true),
('투자수익', 'income', '#059669', true),
('기타수입', 'income', '#047857', true),
-- 지출 카테고리
('급여', 'expense', '#EF4444', true),
('임대료', 'expense', '#F59E0B', true),
('공과금', 'expense', '#D97706', true),
('보험료', 'expense', '#B45309', true),
('사무용품', 'expense', '#8B5CF6', true),
('통신비', 'expense', '#7C3AED', true),
('교통비', 'expense', '#6D28D9', true),
('식비', 'expense', '#5B21B6', true),
('광고비', 'expense', '#EC4899', true),
('세금', 'expense', '#6B7280', true),
('기타지출', 'expense', '#4B5563', true),
-- 이체 카테고리
('계좌이체', 'transfer', '#3B82F6', true),
-- 조정 카테고리
('잔액조정', 'adjustment', '#6B7280', true)
ON CONFLICT DO NOTHING;

-- 기본 계좌 태그 데이터
INSERT INTO finance_account_tags (name, color, description, tag_type, is_system) VALUES
('대시보드', '#3B82F6', '대시보드에 표시되는 주요 계좌', 'dashboard', true),
('매출통장', '#10B981', '매출 분석 대상 계좌', 'revenue', true),
('운영비', '#EF4444', '운영비 분석 대상 계좌', 'operation', true),
('R&D', '#8B5CF6', '연구개발 계좌 (회사 자금 집계 제외)', 'rnd', true)
ON CONFLICT (name) DO NOTHING;
`

export const POST: RequestHandler = async () => {
  try {
    logger.info('Starting finance database initialization...')

    // 1. 테이블 생성
    logger.info('Creating tables...')
    await query(CREATE_TABLES_SQL)

    // 2. 인덱스 생성
    logger.info('Creating indexes...')
    await query(CREATE_INDEXES_SQL)

    // 3. 기본 데이터 삽입
    logger.info('Inserting initial data...')
    await query(INSERT_INITIAL_DATA_SQL)

    logger.info('Finance database initialization completed successfully')

    return json({
      success: true,
      message: 'Database initialized successfully',
      details: {
        tablesCreated: true,
        indexesCreated: true,
        initialDataInserted: true,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Database initialization failed:', error)

    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
