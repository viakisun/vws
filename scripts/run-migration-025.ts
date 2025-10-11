import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'

const pool = new Pool({
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: {
    rejectUnauthorized: false,
  },
})

async function runMigration() {
  const client = await pool.connect()

  try {
    console.log('🚀 Starting migration 025: Convert budget amounts to BIGINT...')
    console.log('')

    // Read migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '025_convert_budget_amounts_to_bigint.sql'),
      'utf-8',
    )

    // Execute migration
    await client.query(migrationSQL)

    console.log('✅ Migration completed successfully!')
    console.log('📊 All budget amount columns have been converted to BIGINT')
    console.log('')

    // Verify results
    console.log('📋 Verification:')
    console.log('')

    // Check project_budgets columns
    const budgetColumns = await client.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision
      FROM information_schema.columns
      WHERE table_name = 'project_budgets'
        AND (column_name LIKE '%cost%' OR column_name LIKE '%amount%' OR column_name = 'total_budget')
      ORDER BY column_name
    `)

    console.log('  Project Budgets columns:')
    budgetColumns.rows.forEach((row) => {
      console.log(`    ✓ ${row.column_name}: ${row.data_type}`)
    })

    console.log('')
    console.log('🎉 Migration 025 completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch(console.error)
