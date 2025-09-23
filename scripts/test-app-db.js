import { healthCheck, query } from '../src/lib/database/connection.ts'

async function testAppConnection() {
  try {
    console.log('🔄 Testing application database connection...')

    const isHealthy = await healthCheck()
    console.log('Health check result:', isHealthy)

    if (isHealthy) {
      const result = await query('SELECT version() as version')
      console.log('✅ Database connection successful!')
      console.log('📊 PostgreSQL version:', result.rows[0].version)
    } else {
      console.log('❌ Database health check failed')
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    console.error('Full error:', error)
  }
}

testAppConnection()
