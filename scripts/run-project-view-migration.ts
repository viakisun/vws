import { readFileSync } from 'fs'
import { join } from 'path'
import { query } from '../src/lib/database/connection'

async function runMigration() {
  try {
    console.log('📦 Creating v_projects_with_dates view...')

    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations/028_create_project_view_with_dates.sql'),
      'utf-8',
    )

    await query(migrationSQL)

    console.log('✅ View created successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
