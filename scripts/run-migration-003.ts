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
    console.log('🚀 Starting migration 003: Add planner permissions...')
    console.log('')

    // Read migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '003_add_planner_permissions.sql'),
      'utf-8',
    )

    // Execute migration
    await client.query(migrationSQL)

    console.log('✅ Migration completed successfully!')
    console.log('')

    // Verify results
    console.log('📊 Verification:')
    console.log('')

    // Check planner permissions count
    const plannerPermsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM permissions 
      WHERE resource LIKE 'planner.%'
    `)
    console.log(`  ✓ Planner permissions: ${plannerPermsResult.rows[0].count}`)

    // Check researcher permissions
    const researcherPlannerResult = await client.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code = 'RESEARCHER' 
        AND p.resource LIKE 'planner.%'
    `)
    console.log(`  ✓ Researcher planner permissions: ${researcherPlannerResult.rows[0].count}`)

    const researcherProjectResult = await client.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code = 'RESEARCHER' 
        AND p.resource LIKE 'project.%'
    `)
    console.log(`  ✓ Researcher project permissions: ${researcherProjectResult.rows[0].count}`)

    // Check management permissions
    const managementPlannerResult = await client.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code = 'MANAGEMENT' 
        AND p.resource LIKE 'planner.%'
        AND p.action = 'read'
    `)
    console.log(`  ✓ Management planner read permissions: ${managementPlannerResult.rows[0].count}`)

    console.log('')
    console.log('🎉 Migration 003 completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch(console.error)
