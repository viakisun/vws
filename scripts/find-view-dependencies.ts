import { config } from 'dotenv'
import pg from 'pg'

config()

const { Pool } = pg

async function findViewDependencies() {
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
    console.log('\n🔍 VIEW에 의존하는 칼럼 찾기...\n')

    // VIEW와 의존 테이블 조회
    const result = await pool.query(`
      SELECT DISTINCT
        v.table_name as view_name,
        d.refobjid::regclass as dependent_table,
        a.attname as dependent_column
      FROM pg_depend d
      JOIN pg_rewrite r ON r.oid = d.objid
      JOIN information_schema.views v ON v.table_name = (SELECT relname FROM pg_class WHERE oid = r.ev_class)
      JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
      WHERE v.table_schema = 'public'
        AND d.deptype = 'n'
        AND a.attnum > 0
      ORDER BY dependent_table, dependent_column
    `)

    console.log(`발견된 의존성: ${result.rows.length}개\n`)

    const dependencies = new Map<string, Set<string>>()

    result.rows.forEach((row) => {
      const key = `${row.dependent_table}.${row.dependent_column}`
      if (!dependencies.has(key)) {
        dependencies.set(key, new Set())
      }
      dependencies.get(key)!.add(row.view_name)
    })

    console.log('📋 VIEW에 의존하는 칼럼 목록:\n')
    for (const [column, views] of dependencies) {
      console.log(`  - ${column}`)
      views.forEach((view) => console.log(`      ← ${view}`))
    }

    console.log(`\n총 ${dependencies.size}개의 칼럼이 VIEW에 의존하고 있습니다.`)

    // 마이그레이션에서 제외할 목록 생성
    console.log('\n마이그레이션에서 제외해야 할 칼럼:')
    console.log('----------------------------------------')
    for (const column of dependencies.keys()) {
      console.log(column)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

findViewDependencies()
