#!/usr/bin/env node

/**
 * 재무관리 시스템 데이터베이스 초기화 스크립트
 *
 * 사용법:
 * node scripts/init-finance-db.js
 */

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { query } from '../src/lib/database/connection.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function initializeFinanceDatabase() {
  console.log('🏦 재무관리 시스템 데이터베이스 초기화 시작...')

  try {
    // 스키마 생성
    console.log('📋 스키마 생성 중...')
    const schemaPath = join(__dirname, '../src/lib/database/migrations/finance-schema.sql')
    const schemaSQL = readFileSync(schemaPath, 'utf8')
    await query(schemaSQL)
    console.log('✅ 스키마 생성 완료')

    // 초기 데이터 삽입
    console.log('📊 초기 데이터 삽입 중...')
    const dataPath = join(__dirname, '../src/lib/database/migrations/finance-initial-data.sql')
    const dataSQL = readFileSync(dataPath, 'utf8')
    await query(dataSQL)
    console.log('✅ 초기 데이터 삽입 완료')

    // 결과 확인
    const banksResult = await query('SELECT COUNT(*) as count FROM banks')
    const accountsResult = await query('SELECT COUNT(*) as count FROM accounts')
    const categoriesResult = await query('SELECT COUNT(*) as count FROM transaction_categories')
    const transactionsResult = await query('SELECT COUNT(*) as count FROM transactions')

    console.log('\n🎉 재무관리 시스템 초기화 완료!')
    console.log(`📊 생성된 데이터:`)
    console.log(`   - 은행: ${banksResult.rows[0].count}개`)
    console.log(`   - 계좌: ${accountsResult.rows[0].count}개`)
    console.log(`   - 거래 카테고리: ${categoriesResult.rows[0].count}개`)
    console.log(`   - 거래 내역: ${transactionsResult.rows[0].count}개`)
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error)
    process.exit(1)
  }
}

// 스크립트 실행
initializeFinanceDatabase()
