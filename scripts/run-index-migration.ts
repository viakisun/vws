import { readFileSync } from 'fs'
import { join } from 'path'
import { query } from '../src/lib/database/connection'

async function runMigration() {
  try {
    console.log('📦 Creating indexes for project_budgets...')

    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations/029_add_project_budgets_indexes.sql'),
      'utf-8',
    )

    await query(migrationSQL)

    console.log('✅ Indexes created successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
