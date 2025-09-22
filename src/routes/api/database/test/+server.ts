import { json } from '@sveltejs/kit'
import { healthCheck, query } from '$lib/database/connection'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  try {
    console.log('Testing database connection...')

    // Test basic connection
    const isHealthy = await healthCheck()
    console.log('Health check result:', isHealthy)

    if (!isHealthy) {
      console.log('Health check failed')
      return json(
        {
          success: false,
          error: 'Database health check failed'
        },
        { status: 500 }
      )
    }

    // Test query execution
    const result = await query(
      'SELECT version() as version, current_database() as database, current_user as user'
    )

    // Get table count
    const tableCount = await query(`
			SELECT COUNT(*) as count 
			FROM information_schema.tables 
			WHERE table_schema = 'public'
		`)

    // Get sample data from key tables
    const userCount = await query('SELECT COUNT(*) as count FROM users')
    const projectCount = await query('SELECT COUNT(*) as count FROM projects')
    const employeeCount = await query('SELECT COUNT(*) as count FROM employees')

    return json({
      success: true,
      message: 'Database connection successful',
      database: {
        version: result.rows[0].version,
        name: result.rows[0].database,
        user: result.rows[0].user,
        totalTables: parseInt(tableCount.rows[0].count),
        recordCounts: {
          users: parseInt(userCount.rows[0].count),
          projects: parseInt(projectCount.rows[0].count),
          employees: parseInt(employeeCount.rows[0].count)
        }
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
