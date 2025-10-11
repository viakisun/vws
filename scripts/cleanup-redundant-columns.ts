import { config } from 'dotenv'
import pg from 'pg'

config()

const { Pool } = pg

async function cleanupRedundantColumns() {
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
    console.log('\n🧹 중복 칼럼 및 백업 테이블 정리\n')
    console.log('=' .repeat(60))

    await pool.query('BEGIN')

    // 1. 백업 테이블 삭제
    console.log('\n🗑️  Step 1: 백업 테이블 삭제 중...\n')
    
    const backupTables = [
      'attendance_backup_20241011',
      'project_members_backup',
      'projects_backup'
    ]

    for (const table of backupTables) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
      console.log(`  ✅ ${table} 삭제 완료`)
    }

    // 2. attendance 중복 칼럼 제거
    console.log('\n🔧 Step 2: attendance 중복 칼럼 제거 중...\n')
    
    await pool.query(`
      ALTER TABLE attendance
      DROP COLUMN IF EXISTS date CASCADE,
      DROP COLUMN IF EXISTS local_date_kr CASCADE
    `)
    console.log('  ✅ attendance.date 제거 완료')
    console.log('  ✅ attendance.local_date_kr 제거 완료')

    // 3. attendance_records 중복 칼럼 제거
    console.log('\n🔧 Step 3: attendance_records 중복 칼럼 제거 중...\n')
    
    await pool.query(`
      ALTER TABLE attendance_records
      DROP COLUMN IF EXISTS date CASCADE,
      DROP COLUMN IF EXISTS local_date_kr CASCADE
    `)
    console.log('  ✅ attendance_records.date 제거 완료')
    console.log('  ✅ attendance_records.local_date_kr 제거 완료')

    // 4. leave_requests 중복 칼럼 제거
    console.log('\n🔧 Step 4: leave_requests 중복 칼럼 제거 중...\n')
    
    await pool.query(`
      ALTER TABLE leave_requests
      DROP COLUMN IF EXISTS local_start_date CASCADE,
      DROP COLUMN IF EXISTS local_end_date CASCADE
    `)
    console.log('  ✅ leave_requests.local_start_date 제거 완료')
    console.log('  ✅ leave_requests.local_end_date 제거 완료')

    await pool.query('COMMIT')

    // 5. 최종 확인
    console.log('\n✅ Step 5: 최종 확인 중...\n')
    
    const dateResult = await pool.query(`
      SELECT COUNT(*) as date_count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type = 'date'
    `)

    const dateCount = parseInt(dateResult.rows[0].date_count)

    console.log('=' .repeat(60))
    console.log(`📊 남은 DATE 칼럼: ${dateCount}개`)
    console.log('=' .repeat(60))
    console.log()
    console.log('🎉 정리 완료!')
    console.log()

  } catch (error) {
    console.error('\n❌ 오류 발생:', error)
    console.log('\n🔄 롤백 중...')
    await pool.query('ROLLBACK')
    console.log('✅ 롤백 완료')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

cleanupRedundantColumns()

