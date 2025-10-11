import { readFileSync } from 'fs'
import { join } from 'path'
import { Pool } from 'pg'

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
    console.log('🚀 Starting migration 027: Update project view with sponsor contacts...')
    console.log('')

    // Read migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '027_update_project_view_with_sponsor_contacts.sql'),
      'utf-8',
    )

    // Execute migration
    await client.query(migrationSQL)

    console.log('✅ Migration completed successfully!')
    console.log('📊 v_projects_with_dates view has been updated')
    console.log('')

    // Verify results
    console.log('📋 Verification:')
    console.log('')

    const columns = await client.query(`
      SELECT 
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'v_projects_with_dates'
        AND column_name LIKE 'sponsor%'
      ORDER BY column_name
    `)

    console.log('  View sponsor columns:')
    columns.rows.forEach((row) => {
      console.log(`    ✓ ${row.column_name}: ${row.data_type}`)
    })

    console.log('')
    console.log('🎉 Migration 027 completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch(console.error)

