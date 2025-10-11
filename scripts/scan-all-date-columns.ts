import { config } from 'dotenv'
import pg from 'pg'

config()

const { Pool } = pg

async function scanAllDateColumns() {
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
    console.log('\n🔍 전체 날짜/시간 칼럼 스캔 중...\n')

    const result = await pool.query(`
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        t.table_type
      FROM information_schema.columns c
      JOIN information_schema.tables t 
        ON c.table_schema = t.table_schema 
        AND c.table_name = t.table_name
      WHERE c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND (
          c.column_name LIKE '%_date%' OR
          c.column_name LIKE '%_time%' OR
          c.column_name LIKE '%_at' OR
          c.data_type LIKE '%timestamp%' OR
          c.data_type = 'date'
        )
      ORDER BY c.table_name, c.column_name
    `)

    // 타입별로 분류
    const timestamptz: any[] = []
    const timestamp: any[] = []
    const dateOnly: any[] = []

    result.rows.forEach((row) => {
      if (row.udt_name === 'timestamptz') {
        timestamptz.push(row)
      } else if (row.udt_name === 'timestamp') {
        timestamp.push(row)
      } else if (row.udt_name === 'date') {
        dateOnly.push(row)
      }
    })

    // ✅ TIMESTAMPTZ (표준)
    if (timestamptz.length > 0) {
      console.log(`✅ TIMESTAMPTZ (표준 - ${timestamptz.length}개):`)
      timestamptz.forEach((row) => {
        console.log(`  - ${row.table_name}.${row.column_name} (nullable: ${row.is_nullable})`)
      })
      console.log()
    }

    // ⚠️ TIMESTAMP (타임존 없음)
    if (timestamp.length > 0) {
      console.log(`⚠️  TIMESTAMP (타임존 없음 - ${timestamp.length}개):`)
      timestamp.forEach((row) => {
        console.log(`  - ${row.table_name}.${row.column_name} (nullable: ${row.is_nullable})`)
      })
      console.log()
    }

    // 📅 DATE (시간 정보 없음)
    if (dateOnly.length > 0) {
      console.log(`📅 DATE (시간 정보 없음 - ${dateOnly.length}개):`)
      dateOnly.forEach((row) => {
        console.log(`  - ${row.table_name}.${row.column_name} (nullable: ${row.is_nullable})`)
      })
      console.log()
    }

    // 마이그레이션 SQL 생성
    if (timestamp.length > 0) {
      console.log('\n📝 마이그레이션 SQL (TIMESTAMP → TIMESTAMPTZ):\n')
      console.log('-- migrations/021_standardize_all_timestamps.sql')
      console.log('BEGIN;\n')

      timestamp.forEach((row) => {
        console.log(`-- ${row.table_name}.${row.column_name}`)
        console.log(`ALTER TABLE ${row.table_name}`)
        console.log(`ALTER COLUMN ${row.column_name} TYPE TIMESTAMPTZ`)
        console.log(`USING ${row.column_name} AT TIME ZONE 'Asia/Seoul';`)
        console.log()
      })

      console.log('COMMIT;')
    }

    // 요약
    console.log('\n📊 요약:')
    console.log(`  ✅ TIMESTAMPTZ: ${timestamptz.length}개 (표준)`)
    console.log(`  ⚠️  TIMESTAMP: ${timestamp.length}개 (수정 필요)`)
    console.log(`  📅 DATE: ${dateOnly.length}개 (검토 필요)`)
    console.log()

    if (timestamp.length === 0) {
      console.log('🎉 모든 시간 칼럼이 TIMESTAMPTZ로 표준화되어 있습니다!\n')
    } else {
      console.log('⚠️  TIMESTAMP 칼럼을 TIMESTAMPTZ로 변환해야 합니다.\n')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

scanAllDateColumns()
