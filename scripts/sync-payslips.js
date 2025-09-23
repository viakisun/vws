#!/usr/bin/env node

/**
 * Payslips Synchronization Script
 *
 * This script syncs missing payslips from AWS to local database
 * Usage: node scripts/sync-payslips.js
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

class PayslipsSync {
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

  async getMissingPayslips() {
    // Get all payslips from AWS
    const awsResult = await this.awsPool.query('SELECT * FROM payslips ORDER BY created_at DESC')
    const awsPayslips = awsResult.rows

    // Get existing payslips from local
    const localResult = await this.localPool.query('SELECT employee_name, period FROM payslips')
    const localPayslips = new Set(localResult.rows.map(p => `${p.employee_name}-${p.period}`))

    // Find missing payslips
    const missingPayslips = awsPayslips.filter(
      p => !localPayslips.has(`${p.employee_name}-${p.period}`)
    )

    console.log(`📊 AWS payslips: ${awsPayslips.length}`)
    console.log(`📊 Local payslips: ${localResult.rows.length}`)
    console.log(`📊 Missing payslips: ${missingPayslips.length}`)

    return missingPayslips
  }

  async insertPayslip(payslip) {
    try {
      const query = `
				INSERT INTO payslips (
					id, employee_id, pay_period_start, pay_period_end,
					base_salary, overtime_pay, bonus, old_deductions,
					total_amount, status, created_at, updated_at,
					period, pay_date, employee_name, employee_id_number,
					department, position, hire_date, total_payments,
					total_deductions, net_salary, payments, is_generated,
					created_by, updated_by, deductions
				) VALUES (
					$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
					$13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
					$23, $24, $25, $26, $27
				)
			`

      const values = [
        payslip.id,
        payslip.employee_id,
        payslip.pay_period_start,
        payslip.pay_period_end,
        payslip.base_salary,
        payslip.overtime_pay,
        payslip.bonus,
        payslip.old_deductions,
        payslip.total_amount,
        payslip.status,
        payslip.created_at,
        payslip.updated_at,
        payslip.period,
        payslip.pay_date,
        payslip.employee_name,
        payslip.employee_id_number,
        payslip.department,
        payslip.position,
        payslip.hire_date,
        payslip.total_payments,
        payslip.total_deductions,
        payslip.net_salary,
        payslip.payments,
        payslip.is_generated,
        payslip.created_by,
        payslip.updated_by,
        payslip.deductions
      ]

      await this.localPool.query(query, values)
      return true
    } catch (error) {
      console.error(
        `❌ Failed to insert payslip ${payslip.employee_name}-${payslip.period}:`,
        error.message
      )
      return false
    }
  }

  async syncPayslips() {
    console.log('🚀 Starting payslips synchronization...\n')

    await this.connect()

    // Get missing payslips
    const missingPayslips = await this.getMissingPayslips()

    if (missingPayslips.length === 0) {
      console.log('✅ All payslips are already synchronized!')
      return
    }

    console.log('\n📋 Missing payslips to sync:')
    missingPayslips.forEach((payslip, index) => {
      console.log(
        `   ${index + 1}. ${payslip.employee_name || 'Unknown'} - ${payslip.period} (${payslip.total_amount?.toLocaleString()}원)`
      )
    })

    // Sync missing payslips
    console.log('\n🔄 Syncing payslips...')
    let successCount = 0
    let failCount = 0

    for (const payslip of missingPayslips) {
      const success = await this.insertPayslip(payslip)
      if (success) {
        successCount++
        console.log(`   ✅ ${payslip.employee_name || 'Unknown'} - ${payslip.period}`)
      } else {
        failCount++
      }
    }

    // Summary
    console.log('\n📊 SYNC SUMMARY:')
    console.log(`   ✅ Successfully synced: ${successCount}`)
    console.log(`   ❌ Failed to sync: ${failCount}`)
    console.log(`   📊 Total processed: ${missingPayslips.length}`)

    if (successCount > 0) {
      console.log('\n🎉 Payslips synchronization completed!')
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
  const sync = new PayslipsSync()

  try {
    await sync.syncPayslips()
  } catch (error) {
    console.error('❌ Payslips synchronization failed:', error)
    process.exit(1)
  } finally {
    await sync.close()
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { PayslipsSync }
