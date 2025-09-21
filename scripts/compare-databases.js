#!/usr/bin/env node

/**
 * AWS vs Local Database Comparison Script
 *
 * This script compares data between AWS and local databases
 * Usage: node scripts/compare-databases.js
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

// Tables to compare
const TABLES_TO_COMPARE = [
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

class DatabaseComparer {
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

	async getTableCount(pool, tableName) {
		try {
			const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`)
			return parseInt(result.rows[0].count)
		} catch (error) {
			return -1 // Table doesn't exist or error
		}
	}

	async compareTable(tableName) {
		console.log(`\n📊 Comparing ${tableName}...`)

		const awsCount = await this.getTableCount(this.awsPool, tableName)
		const localCount = await this.getTableCount(this.localPool, tableName)

		if (awsCount === -1 && localCount === -1) {
			console.log(`   ⚠️  Table ${tableName} not found in either database`)
			return { table: tableName, aws: 0, local: 0, status: 'missing' }
		} else if (awsCount === -1) {
			console.log(`   ❌ Table ${tableName} missing in AWS (local: ${localCount})`)
			return { table: tableName, aws: 0, local: localCount, status: 'aws_missing' }
		} else if (localCount === -1) {
			console.log(`   ❌ Table ${tableName} missing in Local (AWS: ${awsCount})`)
			return { table: tableName, aws: awsCount, local: 0, status: 'local_missing' }
		} else if (awsCount === localCount) {
			console.log(`   ✅ ${tableName}: ${awsCount} rows (both databases match)`)
			return { table: tableName, aws: awsCount, local: localCount, status: 'match' }
		} else {
			console.log(`   ❌ ${tableName}: AWS(${awsCount}) vs Local(${localCount}) - MISMATCH`)
			return { table: tableName, aws: awsCount, local: localCount, status: 'mismatch' }
		}
	}

	async compare() {
		console.log('🔍 Starting database comparison...\n')

		await this.connect()

		const results = []
		let matchCount = 0
		let mismatchCount = 0
		let missingCount = 0

		// Compare each table
		for (const tableName of TABLES_TO_COMPARE) {
			const result = await this.compareTable(tableName)
			results.push(result)

			switch (result.status) {
				case 'match':
					matchCount++
					break
				case 'mismatch':
				case 'aws_missing':
				case 'local_missing':
					mismatchCount++
					break
				case 'missing':
					missingCount++
					break
			}
		}

		// Summary
		console.log('\n📋 COMPARISON SUMMARY:')
		console.log('=' * 50)
		console.log(`✅ Matching tables: ${matchCount}`)
		console.log(`❌ Mismatched tables: ${mismatchCount}`)
		console.log(`⚠️  Missing tables: ${missingCount}`)
		console.log(`📊 Total tables checked: ${results.length}`)

		// Show mismatches in detail
		if (mismatchCount > 0) {
			console.log('\n❌ MISMATCHED TABLES:')
			results
				.filter(r => r.status !== 'match')
				.forEach(result => {
					console.log(`   ${result.table}: AWS(${result.aws}) vs Local(${result.local})`)
				})
		}

		// Overall status
		if (mismatchCount === 0 && missingCount === 0) {
			console.log('\n🎉 All databases are in sync!')
		} else {
			console.log('\n⚠️  Databases are not fully synchronized')
		}

		return results
	}

	async close() {
		if (this.awsPool) {
			await this.awsPool.end()
			console.log('\n🔌 Disconnected from AWS database')
		}
		if (this.localPool) {
			await this.localPool.end()
			console.log('🔌 Disconnected from local database')
		}
	}
}

// Main execution
async function main() {
	const comparer = new DatabaseComparer()

	try {
		await comparer.compare()
	} catch (error) {
		console.error('❌ Comparison failed:', error)
		process.exit(1)
	} finally {
		await comparer.close()
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(console.error)
}

export { DatabaseComparer }
