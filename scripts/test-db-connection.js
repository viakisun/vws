import { Pool } from 'pg'

// Database configuration
const dbConfig = {
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}

async function testConnection() {
  const pool = new Pool(dbConfig)

  try {
    console.log('🔄 Testing database connection...')

    // Test basic connection
    const client = await pool.connect()
    console.log('✅ Database connection successful!')

    // Test query
    const result = await client.query('SELECT version()')
    console.log('📊 PostgreSQL version:', result.rows[0].version)

    // Check if tables exist
    const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `)

    console.log('📋 Existing tables:')
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found. Database needs to be initialized.')
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`)
      })
    }

    client.release()
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('Error details:', error)
  } finally {
    await pool.end()
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('🏁 Connection test completed.')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
