#!/usr/bin/env node

/**
 * Database Environment Switcher
 *
 * This script helps switch between local and AWS database environments
 * Usage: node scripts/switch-env.js [local|aws]
 */

import fs from 'fs'
import path from 'path'

const envFile = '.env'
const validEnvs = ['local', 'aws']

function updateEnvFile(env) {
	if (!validEnvs.includes(env)) {
		console.error(`❌ Invalid environment: ${env}`)
		console.error(`Valid options: ${validEnvs.join(', ')}`)
		process.exit(1)
	}

	try {
		// Read current .env file
		const envPath = path.resolve(envFile)
		let envContent = fs.readFileSync(envPath, 'utf8')

		// Update DB_ENV line
		envContent = envContent.replace(/^DB_ENV=.*$/m, `DB_ENV=${env}`)

		// Write back to file
		fs.writeFileSync(envPath, envContent)

		console.log(`✅ Database environment switched to: ${env.toUpperCase()}`)
		console.log(`📝 Updated ${envFile}`)

		if (env === 'local') {
			console.log(`💡 Make sure local PostgreSQL is running: docker-compose up postgres -d`)
		}
	} catch (error) {
		console.error(`❌ Failed to update ${envFile}:`, error.message)
		process.exit(1)
	}
}

function showCurrentEnv() {
	try {
		const envPath = path.resolve(envFile)
		const envContent = fs.readFileSync(envPath, 'utf8')
		const match = envContent.match(/^DB_ENV=(.*)$/m)

		if (match) {
			console.log(`🗄️  Current database environment: ${match[1].toUpperCase()}`)
		} else {
			console.log(`❓ No DB_ENV found in ${envFile}`)
		}
	} catch (error) {
		console.error(`❌ Failed to read ${envFile}:`, error.message)
		process.exit(1)
	}
}

// Main execution
const args = process.argv.slice(2)

if (args.length === 0) {
	showCurrentEnv()
} else {
	const env = args[0].toLowerCase()
	updateEnvFile(env)
}

