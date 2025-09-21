#!/usr/bin/env node

/**
 * Local Database Test Script
 *
 * This script tests the local PostgreSQL connection and setup
 * Usage: node scripts/test-local-db.js
 */

import { Pool } from 'pg'

// Local Database Configuration
const localConfig = {
	host: 'localhost',
	port: 5432,
	database: 'workstream',
	user: 'adminvia'
}

async function testLocalDatabase() {
	console.log('🧪 Testing local database connection...\n')

	const pool = new Pool(localConfig)

	try {
		// Test connection
		console.log('🔗 Testing connection...')
		const client = await pool.connect()
		console.log('✅ Connection successful!')

		// Test basic query
		console.log('\n📊 Testing basic queries...')
		const versionResult = await client.query('SELECT version()')
		console.log('   PostgreSQL version:', versionResult.rows[0].version)

		const dbResult = await client.query('SELECT current_database(), current_user')
		console.log('   Database:', dbResult.rows[0].current_database)
		console.log('   User:', dbResult.rows[0].current_user)

		// Check if schema is initialized
		console.log('\n📋 Checking database schema...')
		const tablesResult = await client.query(`
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_name = t.table_name AND table_schema = 'public') as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `)

		if (tablesResult.rows.length === 0) {
			console.log('   ⚠️  No tables found. Database needs to be initialized.')
			console.log('   💡 Run: docker-compose up postgres to initialize the database.')
		} else {
			console.log(`   ✅ Found ${tablesResult.rows.length} tables:`)
			tablesResult.rows.forEach(row => {
				console.log(`      - ${row.table_name} (${row.column_count} columns)`)
			})
		}

		// Check for initial data
		console.log('\n📊 Checking initial data...')
		const budgetCategoriesResult = await client.query('SELECT COUNT(*) FROM budget_categories')
		console.log(`   Budget categories: ${budgetCategoriesResult.rows[0].count}`)

		const leaveTypesResult = await client.query('SELECT COUNT(*) FROM leave_types')
		console.log(`   Leave types: ${leaveTypesResult.rows[0].count}`)

		// Test a sample query
		console.log('\n🔍 Testing sample queries...')
		try {
			const sampleResult = await client.query(`
                SELECT name, code, description 
                FROM budget_categories 
                LIMIT 3
            `)
			console.log('   Sample budget categories:')
			sampleResult.rows.forEach(row => {
				console.log(`      - ${row.name} (${row.code}): ${row.description}`)
			})
		} catch (error) {
			console.log('   ⚠️  Could not query budget_categories:', error.message)
		}

		client.release()
		console.log('\n✅ Local database test completed successfully!')
	} catch (error) {
		console.error('❌ Local database test failed:', error.message)
		console.error('\n🔧 Troubleshooting tips:')
		console.error('   1. Make sure PostgreSQL is running: docker-compose up postgres')
		console.error('   2. Check if the database is initialized with schema')
		console.error('   3. Verify connection parameters in the script')
		process.exit(1)
	} finally {
		await pool.end()
	}
}

// Run the test
testLocalDatabase().catch(console.error)
