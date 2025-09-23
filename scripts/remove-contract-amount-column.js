#!/usr/bin/env node

/**
 * contract_amount 컬럼 제거 스크립트
 *
 * 이 스크립트는 project_members 테이블에서 contract_amount 컬럼을 완전히 제거합니다.
 * 실제 근로계약서 데이터를 사용하므로 중복된 contract_amount 컬럼은 혼란을 야기할 수 있습니다.
 */

import { Pool } from 'pg'

// 데이터베이스 연결 설정
const dbConfig = {
  host: process.env.DB_HOST || 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'viahubdev',
  ssl: {
    rejectUnauthorized: false
  }
}

async function removeContractAmountColumn() {
  const pool = new Pool(dbConfig)

  try {
    console.log('🔄 Starting contract_amount column removal...')
    console.log('📊 Database config:', { ...dbConfig, password: '[HIDDEN]' })

    const client = await pool.connect()
    console.log('✅ Database connection successful!')

    // 1. 컬럼 존재 여부 확인
    console.log('🔍 Checking if contract_amount column exists...')
    const columnCheckResult = await client.query(`
			SELECT column_name 
			FROM information_schema.columns 
			WHERE table_name = 'project_members' 
			AND column_name = 'contract_amount'
		`)

    if (columnCheckResult.rows.length === 0) {
      console.log('ℹ️  contract_amount column does not exist. Nothing to remove.')
      return
    }

    console.log('📋 Found contract_amount column in project_members table')

    // 2. 컬럼 제거 전 데이터 백업 (참고용)
    console.log('📊 Backing up contract_amount data for reference...')
    const backupResult = await client.query(`
			SELECT id, employee_id, contract_amount, monthly_amount, participation_rate
			FROM project_members 
			WHERE contract_amount IS NOT NULL AND contract_amount != 0
		`)

    if (backupResult.rows.length > 0) {
      console.log(`📋 Found ${backupResult.rows.length} records with non-zero contract_amount:`)
      backupResult.rows.forEach(row => {
        console.log(
          `   - ID: ${row.id}, Employee: ${row.employee_id}, Contract: ${row.contract_amount}, Monthly: ${row.monthly_amount}, Rate: ${row.participation_rate}%`
        )
      })
    } else {
      console.log('📋 No non-zero contract_amount values found')
    }

    // 3. 컬럼 제거
    console.log('🗑️  Removing contract_amount column...')
    await client.query(`
			ALTER TABLE project_members 
			DROP COLUMN IF EXISTS contract_amount
		`)
    console.log('✅ contract_amount column removed successfully!')

    // 4. 결과 확인
    console.log('🔍 Verifying column removal...')
    const finalCheckResult = await client.query(`
			SELECT column_name 
			FROM information_schema.columns 
			WHERE table_name = 'project_members' 
			AND column_name = 'contract_amount'
		`)

    if (finalCheckResult.rows.length === 0) {
      console.log('✅ contract_amount column successfully removed from project_members table')
    } else {
      console.log('❌ contract_amount column still exists')
    }

    // 5. 현재 테이블 구조 확인
    console.log('📋 Current project_members table structure:')
    const tableStructureResult = await client.query(`
			SELECT column_name, data_type, is_nullable, column_default
			FROM information_schema.columns 
			WHERE table_name = 'project_members'
			ORDER BY ordinal_position
		`)

    tableStructureResult.rows.forEach(row => {
      console.log(
        `   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`
      )
    })

    client.release()
    console.log('🎉 contract_amount column removal completed successfully!')
  } catch (error) {
    console.error('❌ Error removing contract_amount column:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// 스크립트 실행
removeContractAmountColumn()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
