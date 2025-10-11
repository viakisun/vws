import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import pg from 'pg'

config()

const { Pool } = pg

async function runMigration() {
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
    console.log('\n🚀 Migration 021: TIMESTAMP → TIMESTAMPTZ 표준화')
    console.log('='.repeat(60))
    console.log()

    // 마이그레이션 파일 읽기
    const migrationPath = path.join(
      process.cwd(),
      'migrations',
      '021_standardize_all_timestamps.sql',
    )
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 마이그레이션 파일 로드 완료')
    console.log()

    // 확인 메시지
    console.log('⚠️  경고: 139개의 칼럼이 변경됩니다.')
    console.log('   기존 데이터는 KST(Asia/Seoul)로 간주하여 변환됩니다.')
    console.log()
    console.log('▶️  실행 시작...')
    console.log()

    // 마이그레이션 실행
    const startTime = Date.now()
    await pool.query(migrationSql)
    const duration = Date.now() - startTime

    console.log()
    console.log('✅ 마이그레이션 완료!')
    console.log(`   소요 시간: ${duration}ms`)
    console.log()

    // 검증
    console.log('🔍 검증 중...')
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as timestamp_count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          column_name LIKE '%_date%' OR
          column_name LIKE '%_time%' OR
          column_name LIKE '%_at'
        )
        AND udt_name = 'timestamp'
    `)

    const remainingTimestamp = parseInt(verifyResult.rows[0].timestamp_count)

    if (remainingTimestamp === 0) {
      console.log('✅ 모든 TIMESTAMP 칼럼이 TIMESTAMPTZ로 변환되었습니다!')
      console.log()
      console.log('📊 다음 명령어로 최종 확인:')
      console.log('   npx tsx scripts/scan-all-date-columns.ts')
    } else {
      console.log(`⚠️  아직 ${remainingTimestamp}개의 TIMESTAMP 칼럼이 남아있습니다.`)
      console.log('   수동 확인이 필요합니다.')
    }

    console.log()
    console.log('='.repeat(60))
    console.log('🎉 완료!\n')
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error)
    console.error()
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
