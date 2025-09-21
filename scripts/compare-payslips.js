#!/usr/bin/env node

/**
 * AWS vs Local Payslips Comparison Script
 *
 * This script compares payslips data between AWS and local databases
 * Usage: node scripts/compare-payslips.js
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

class PayslipsComparer {
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

	async getPayslipsData(pool, dbName) {
		try {
			const result = await pool.query(`
				SELECT 
					id,
					employee_name,
					period,
					total_amount,
					status,
					created_at
				FROM payslips 
				ORDER BY period DESC, created_at DESC
			`)
			console.log(`📊 ${dbName} payslips: ${result.rows.length} records`)
			return result.rows
		} catch (error) {
			console.error(`❌ Failed to get payslips from ${dbName}:`, error.message)
			return []
		}
	}

	async comparePayslips() {
		console.log('🔍 Comparing payslips data...\n')

		await this.connect()

		// Get payslips from both databases
		const awsPayslips = await this.getPayslipsData(this.awsPool, 'AWS')
		const localPayslips = await this.getPayslipsData(this.localPool, 'Local')

		console.log('\n📋 AWS Payslips:')
		if (awsPayslips.length === 0) {
			console.log('   (No payslips found)')
		} else {
			awsPayslips.forEach((payslip, index) => {
				console.log(`   ${index + 1}. ${payslip.employee_name} - ${payslip.period} (${payslip.total_amount?.toLocaleString()}원) - ${payslip.status}`)
			})
		}

		console.log('\n📋 Local Payslips:')
		if (localPayslips.length === 0) {
			console.log('   (No payslips found)')
		} else {
			localPayslips.forEach((payslip, index) => {
				console.log(`   ${index + 1}. ${payslip.employee_name} - ${payslip.period} (${payslip.total_amount?.toLocaleString()}원) - ${payslip.status}`)
			})
		}

		// Find missing payslips
		console.log('\n🔍 Missing payslips analysis:')
		
		const localPayslipKeys = new Set(localPayslips.map(p => `${p.employee_name}-${p.period}`))
		const missingInLocal = awsPayslips.filter(p => !localPayslipKeys.has(`${p.employee_name}-${p.period}`))
		
		if (missingInLocal.length > 0) {
			console.log(`❌ Missing in Local (${missingInLocal.length} records):`)
			missingInLocal.forEach(payslip => {
				console.log(`   - ${payslip.employee_name} - ${payslip.period} (${payslip.total_amount?.toLocaleString()}원)`)
			})
		} else {
			console.log('✅ All AWS payslips exist in local database')
		}

		const awsPayslipKeys = new Set(awsPayslips.map(p => `${p.employee_name}-${p.period}`))
		const missingInAWS = localPayslips.filter(p => !awsPayslipKeys.has(`${p.employee_name}-${p.period}`))
		
		if (missingInAWS.length > 0) {
			console.log(`⚠️  Missing in AWS (${missingInAWS.length} records):`)
			missingInAWS.forEach(payslip => {
				console.log(`   - ${payslip.employee_name} - ${payslip.period} (${payslip.total_amount?.toLocaleString()}원)`)
			})
		} else {
			console.log('✅ All local payslips exist in AWS database')
		}

		// Summary
		console.log('\n📊 SUMMARY:')
		console.log(`   AWS payslips: ${awsPayslips.length}`)
		console.log(`   Local payslips: ${localPayslips.length}`)
		console.log(`   Missing in local: ${missingInLocal.length}`)
		console.log(`   Missing in AWS: ${missingInAWS.length}`)

		if (missingInLocal.length > 0) {
			console.log('\n💡 Recommendation: Run payslips migration to sync missing data')
		}

		return {
			aws: awsPayslips,
			local: localPayslips,
			missingInLocal,
			missingInAWS
		}
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
	const comparer = new PayslipsComparer()

	try {
		await comparer.comparePayslips()
	} catch (error) {
		console.error('❌ Payslips comparison failed:', error)
		process.exit(1)
	} finally {
		await comparer.close()
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(console.error)
}

export { PayslipsComparer }
