import pg from 'pg'
import { config } from 'dotenv'
import fs from 'fs'

config()

const { Pool } = pg

async function backupAndFixViews() {
  const pool = new Pool({
    host: process.env.AWS_DB_HOST,
    port: parseInt(process.env.AWS_DB_PORT || '5432'),
    database: process.env.AWS_DB_NAME,
    user: process.env.AWS_DB_USER,
    password: process.env.AWS_DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    console.log('\n🔍 VIEW 백업 및 TIMESTAMP 칼럼 변환\n')
    console.log('=' .repeat(60))

    // 1. VIEW 정의 백업
    console.log('\n📦 Step 1: VIEW 정의 백업 중...\n')
    
    const views = [
      'user_effective_roles',
      'active_salary_contracts', 
      'salary_contract_history'
    ]

    const viewDefinitions = new Map<string, string>()

    for (const viewName of views) {
      const result = await pool.query(`
        SELECT pg_get_viewdef('${viewName}'::regclass, true) as definition
      `)
      
      const definition = result.rows[0].definition
      viewDefinitions.set(viewName, definition)
      
      console.log(`  ✅ ${viewName} 백업 완료`)
    }

    // 백업 파일 저장
    const backupContent = Array.from(viewDefinitions.entries())
      .map(([name, def]) => `-- VIEW: ${name}\nCREATE OR REPLACE VIEW ${name} AS\n${def};\n`)
      .join('\n\n')
    
    fs.writeFileSync('migrations/backup_views.sql', backupContent)
    console.log('\n  📄 백업 파일 저장: migrations/backup_views.sql')

    // 2. VIEW DROP
    console.log('\n🗑️  Step 2: VIEW 제거 중...\n')
    
    await pool.query('BEGIN')
    
    for (const viewName of views.reverse()) {
      await pool.query(`DROP VIEW IF EXISTS ${viewName} CASCADE`)
      console.log(`  ✅ ${viewName} 제거 완료`)
    }

    // 3. 칼럼 변환
    console.log('\n🔧 Step 3: TIMESTAMP → TIMESTAMPTZ 변환 중...\n')
    
    await pool.query(`
      ALTER TABLE employee_roles
      ALTER COLUMN expires_at TYPE TIMESTAMPTZ
      USING expires_at AT TIME ZONE 'Asia/Seoul'
    `)
    console.log('  ✅ employee_roles.expires_at 변환 완료')

    await pool.query(`
      ALTER TABLE salary_contracts
      ALTER COLUMN created_at TYPE TIMESTAMPTZ
      USING created_at AT TIME ZONE 'Asia/Seoul',
      ALTER COLUMN updated_at TYPE TIMESTAMPTZ
      USING updated_at AT TIME ZONE 'Asia/Seoul'
    `)
    console.log('  ✅ salary_contracts.created_at 변환 완료')
    console.log('  ✅ salary_contracts.updated_at 변환 완료')

    // 4. VIEW 재생성
    console.log('\n🏗️  Step 4: VIEW 재생성 중...\n')
    
    for (const [viewName, definition] of viewDefinitions) {
      await pool.query(`CREATE OR REPLACE VIEW ${viewName} AS ${definition}`)
      console.log(`  ✅ ${viewName} 재생성 완료`)
    }

    await pool.query('COMMIT')

    // 5. 검증
    console.log('\n✅ Step 5: 최종 검증 중...\n')
    
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as timestamp_count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name NOT LIKE 'pg_%'
        AND (
          column_name LIKE '%_date%' OR
          column_name LIKE '%_time%' OR
          column_name LIKE '%_at'
        )
        AND udt_name = 'timestamp'
    `)

    const remainingTimestamp = parseInt(verifyResult.rows[0].timestamp_count)

    console.log('=' .repeat(60))
    if (remainingTimestamp === 0) {
      console.log('🎉 완벽! 모든 TIMESTAMP 칼럼이 TIMESTAMPTZ로 변환되었습니다!')
    } else {
      console.log(`⚠️  아직 ${remainingTimestamp}개의 TIMESTAMP 칼럼이 남아있습니다.`)
    }
    console.log('=' .repeat(60))
    console.log()

  } catch (error) {
    console.error('\n❌ 오류 발생:', error)
    console.log('\n🔄 롤백 중...')
    await pool.query('ROLLBACK')
    console.log('✅ 롤백 완료 - 변경사항이 취소되었습니다.')
    console.log('\n💡 백업 파일로 수동 복구 가능: migrations/backup_views.sql')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

backupAndFixViews()

