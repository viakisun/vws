#!/usr/bin/env node

/**
 * AWS Database to Local Database Migration Script
 *
 * This script migrates data from AWS PostgreSQL to local PostgreSQL
 * Usage: node scripts/migrate-to-local.js
 */

import { Pool } from 'pg'

// AWS Database Configuration
const awsConfig = {
	host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
	port: 5432,
	database: 'postgres',
	user: 'postgres',
	password: 'viahubdev',
	ssl: {
		rejectUnauthorized: false
	}
}

// Local Database Configuration
const localConfig = {
	host: 'localhost',
	port: 5432,
	database: 'workstream',
	user: 'adminvia'
}

// Tables to migrate (in dependency order)
const TABLES_TO_MIGRATE = [
	'users',
	'companies',
	'budget_categories',
	'bank_accounts',
	'job_titles',
	'employees',
	'leave_types',
	'projects',
	'departments',
	'positions',
	'global_factors',
	'salary_contracts',
	'leave_requests',
	'transactions',
	'expense_items',
	'project_budgets',
	'project_members',
	'payrolls',
	'payslips',
	'active_salary_contracts',
	'salary_history',
	'audit_logs'
]

class DatabaseMigrator {
	constructor() {
		this.awsPool = null
		this.localPool = null
	}

	async connect() {
		console.log('🔗 Connecting to databases...')

		// Connect to AWS
		try {
			this.awsPool = new Pool(awsConfig)
			await this.awsPool.connect()
			console.log('✅ Connected to AWS database')
		} catch (error) {
			console.error('❌ Failed to connect to AWS database:', error.message)
			throw error
		}

		// Connect to local
		try {
			this.localPool = new Pool(localConfig)
			await this.localPool.connect()
			console.log('✅ Connected to local database')
		} catch (error) {
			console.error('❌ Failed to connect to local database:', error.message)
			throw error
		}
	}

	async checkTablesExist(pool, config) {
		console.log(`📋 Checking tables in ${config.host}...`)

		const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `)

		const tables = result.rows.map(row => row.table_name)
		console.log(`   Found ${tables.length} tables:`, tables.join(', '))

		return tables
	}

	async getTableData(pool, tableName) {
		try {
			const result = await pool.query(`SELECT * FROM ${tableName}`)
			console.log(`   📊 ${tableName}: ${result.rows.length} rows`)
			return result.rows
		} catch (error) {
			console.log(`   ⚠️  ${tableName}: Table not found or error - ${error.message}`)
			return []
		}
	}

	async clearLocalTable(pool, tableName) {
		try {
			// Disable foreign key checks temporarily
			await pool.query('SET session_replication_role = replica')
			await pool.query(`DELETE FROM ${tableName}`)
			await pool.query('SET session_replication_role = DEFAULT')
			console.log(`   🗑️  Cleared ${tableName}`)
		} catch (error) {
			console.log(`   ⚠️  Could not clear ${tableName}: ${error.message}`)
		}
	}

	async insertData(pool, tableName, data) {
		if (data.length === 0) return

		try {
			// Get column names from first row
			const columns = Object.keys(data[0])
			const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ')

			const query = `
                INSERT INTO ${tableName} (${columns.join(', ')})
                VALUES (${placeholders})
            `

			// Insert data in batches
			const batchSize = 100
			for (let i = 0; i < data.length; i += batchSize) {
				const batch = data.slice(i, i + batchSize)

				for (const row of batch) {
					const values = columns.map(col => row[col])
					await pool.query(query, values)
				}
			}

			console.log(`   ✅ Inserted ${data.length} rows into ${tableName}`)
		} catch (error) {
			console.error(`   ❌ Failed to insert data into ${tableName}:`, error.message)
			throw error
		}
	}

	async migrateTable(tableName) {
		console.log(`\n🔄 Migrating ${tableName}...`)

		try {
			// Get data from AWS
			const data = await this.getTableData(this.awsPool, tableName)

			if (data.length === 0) {
				console.log(`   ⏭️  Skipping ${tableName} (no data)`)
				return
			}

			// Clear local table
			await this.clearLocalTable(this.localPool, tableName)

			// Insert data to local
			await this.insertData(this.localPool, tableName, data)
		} catch (error) {
			console.error(`   ❌ Failed to migrate ${tableName}:`, error.message)
			// Continue with other tables
		}
	}

	async migrate() {
		console.log('🚀 Starting database migration...\n')

		await this.connect()

		// Check what tables exist in both databases
		const awsTables = await this.checkTablesExist(this.awsPool, awsConfig)
		const localTables = await this.checkTablesExist(this.localPool, localConfig)

		// Migrate each table
		for (const tableName of TABLES_TO_MIGRATE) {
			if (awsTables.includes(tableName)) {
				await this.migrateTable(tableName)
			} else {
				console.log(`⏭️  Skipping ${tableName} (not found in AWS database)`)
			}
		}

		console.log('\n✅ Migration completed!')
	}

	async close() {
		if (this.awsPool) {
			await this.awsPool.end()
			console.log('🔌 Disconnected from AWS database')
		}
		if (this.localPool) {
			await this.localPool.end()
			console.log('🔌 Disconnected from local database')
		}
	}
}

// Main execution
async function main() {
	const migrator = new DatabaseMigrator()

	try {
		await migrator.migrate()
	} catch (error) {
		console.error('❌ Migration failed:', error)
		process.exit(1)
	} finally {
		await migrator.close()
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(console.error)
}

export { DatabaseMigrator }
