import { config } from 'dotenv'
import pg from 'pg'

config()

const { Pool } = pg
const pool = new Pool({
  host: process.env.AWS_DB_HOST,
  port: parseInt(process.env.AWS_DB_PORT || '5432'),
  database: process.env.AWS_DB_NAME,
  user: process.env.AWS_DB_USER,
  password: process.env.AWS_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

async function getAllSchemas() {
  const tables = [
    'projects',
    'project_members',
    'project_budgets',
    'project_evidence',
    'evidence_documents',
    'evidence_categories',
    'evidence_schedules',
    'budget_evidence',
    'participation_rates',
    'global_factors',
    'annual_budgets',
    'sales_customers',
    'sales_opportunities',
    'sales_contracts',
    'sales_transactions',
    'notifications',
    'certificates',
  ]

  for (const table of tables) {
    const r = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = $1 ORDER BY ordinal_position`,
      [table],
    )
    if (r.rows.length > 0) {
      console.log(`\n=== ${table} ===`)
      console.log(
        r.rows
          .map((row) => `${row.column_name} (${row.data_type})`)
          .join(', '),
      )
    }
  }
}

getAllSchemas()
  .then(() => pool.end())
  .catch((e) => {
    console.error(e.message)
    pool.end()
  })

