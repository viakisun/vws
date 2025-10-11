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
    console.log('🚀 Starting migration 026: Add sponsor contact fields...')
    console.log('')

    // Read migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '026_add_sponsor_contact_fields.sql'),
      'utf-8',
    )

    // Execute migration
    await client.query(migrationSQL)

    console.log('✅ Migration completed successfully!')
    console.log('📊 Sponsor contact fields have been added')
    console.log('')

    // Verify results
    console.log('📋 Verification:')
    console.log('')

    const columns = await client.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'projects'
        AND column_name LIKE 'sponsor%'
      ORDER BY column_name
    `)

    console.log('  Projects sponsor columns:')
    columns.rows.forEach((row) => {
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : ''
      console.log(`    ✓ ${row.column_name}: ${row.data_type}${length}`)
    })

    console.log('')
    console.log('🎉 Migration 026 completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch(console.error)

