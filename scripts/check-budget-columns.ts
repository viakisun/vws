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

async function checkColumns() {
  const client = await pool.connect()

  try {
    console.log('🔍 Checking current database schema for budget-related columns...')
    console.log('')

    // Check project_budgets columns
    const budgetColumns = await client.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'project_budgets'
        AND (column_name LIKE '%cost%' OR column_name LIKE '%amount%' OR column_name = 'total_budget')
      ORDER BY column_name
    `)

    console.log('📊 project_budgets table:')
    console.log('')
    budgetColumns.rows.forEach((row) => {
      const precision = row.numeric_precision ? `(${row.numeric_precision},${row.numeric_scale})` : ''
      console.log(`  ${row.column_name.padEnd(35)} : ${row.data_type}${precision}`)
    })

    // Check if there are any DECIMAL columns
    const decimalColumns = budgetColumns.rows.filter(row => row.data_type === 'numeric')
    
    console.log('')
    if (decimalColumns.length > 0) {
      console.log(`⚠️  Found ${decimalColumns.length} DECIMAL/NUMERIC columns that should be converted to BIGINT`)
    } else {
      console.log('✅ All columns are already integer types')
    }

    // Sample data to check for decimal values
    console.log('')
    console.log('📝 Sample data (first 3 rows):')
    const sampleData = await client.query(`
      SELECT 
        period_number,
        personnel_cost_cash,
        research_material_cost_cash,
        research_activity_cost_cash,
        indirect_cost_cash
      FROM project_budgets
      LIMIT 3
    `)
    
    if (sampleData.rows.length > 0) {
      console.table(sampleData.rows)
    } else {
      console.log('  (No data found)')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

checkColumns().catch(console.error)

