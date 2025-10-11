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

async function checkTables() {
  try {
    for (const table of ['finance_transactions', 'finance_accounts', 'finance_alerts']) {
      console.log(`\n=== ${table} ===`)
      const r = await pool.query(
        'SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
        [table],
      )
      console.log(r.rows.map((r) => r.column_name).join(', '))
    }
  } catch (e: any) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}

checkTables()
