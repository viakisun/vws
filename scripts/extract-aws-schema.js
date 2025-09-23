#!/usr/bin/env node

/**
 * AWS Database Schema Extractor
 *
 * This script extracts the complete schema from AWS database
 * Usage: node scripts/extract-aws-schema.js
 */

import fs from 'fs'
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

class SchemaExtractor {
  constructor() {
    this.awsPool = null
  }

  async connect() {
    console.log('🔗 Connecting to AWS database...')
    try {
      this.awsPool = new Pool(awsConfig)
      await this.awsPool.connect()
      console.log('✅ Connected to AWS database')
    } catch (error) {
      console.error('❌ Failed to connect to AWS database:', error.message)
      throw error
    }
  }

  async getTableDefinitions() {
    console.log('📋 Extracting table definitions...')

    const result = await this.awsPool.query(`
			SELECT 
				table_name,
				column_name,
				data_type,
				is_nullable,
				column_default,
				character_maximum_length,
				numeric_precision,
				numeric_scale,
				ordinal_position
			FROM information_schema.columns 
			WHERE table_schema = 'public' 
			ORDER BY table_name, ordinal_position
		`)

    const tables = {}
    result.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = []
      }
      tables[row.table_name].push(row)
    })

    console.log(`   Found ${Object.keys(tables).length} tables`)
    return tables
  }

  async getIndexes() {
    console.log('🔍 Extracting indexes...')

    const result = await this.awsPool.query(`
			SELECT 
				tablename,
				indexname,
				indexdef
			FROM pg_indexes 
			WHERE schemaname = 'public'
			ORDER BY tablename, indexname
		`)

    console.log(`   Found ${result.rows.length} indexes`)
    return result.rows
  }

  async getConstraints() {
    console.log('🔗 Extracting constraints...')

    const result = await this.awsPool.query(`
			SELECT 
				tc.table_name,
				tc.constraint_name,
				tc.constraint_type,
				kcu.column_name,
				ccu.table_name AS foreign_table_name,
				ccu.column_name AS foreign_column_name
			FROM information_schema.table_constraints AS tc 
			LEFT JOIN information_schema.key_column_usage AS kcu
				ON tc.constraint_name = kcu.constraint_name
				AND tc.table_schema = kcu.table_schema
			LEFT JOIN information_schema.constraint_column_usage AS ccu
				ON ccu.constraint_name = tc.constraint_name
				AND ccu.table_schema = tc.table_schema
			WHERE tc.table_schema = 'public'
			ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name
		`)

    console.log(`   Found ${result.rows.length} constraints`)
    return result.rows
  }

  async getFunctions() {
    console.log('⚙️  Extracting functions...')

    const result = await this.awsPool.query(`
			SELECT 
				routine_name,
				routine_definition
			FROM information_schema.routines 
			WHERE routine_schema = 'public' 
			AND routine_type = 'FUNCTION'
			ORDER BY routine_name
		`)

    console.log(`   Found ${result.rows.length} functions`)
    return result.rows
  }

  async getTriggers() {
    console.log('🎯 Extracting triggers...')

    const result = await this.awsPool.query(`
			SELECT 
				trigger_name,
				event_object_table,
				action_statement
			FROM information_schema.triggers 
			WHERE trigger_schema = 'public'
			ORDER BY event_object_table, trigger_name
		`)

    console.log(`   Found ${result.rows.length} triggers`)
    return result.rows
  }

  async getViews() {
    console.log('👁️  Extracting views...')

    const result = await this.awsPool.query(`
			SELECT 
				table_name,
				view_definition
			FROM information_schema.views 
			WHERE table_schema = 'public'
			ORDER BY table_name
		`)

    console.log(`   Found ${result.rows.length} views`)
    return result.rows
  }

  generateCreateTableSQL(tableName, columns) {
    let sql = `CREATE TABLE ${tableName} (\n`

    const columnDefs = columns.map(col => {
      let def = `  ${col.column_name} ${col.data_type}`

      if (col.character_maximum_length) {
        def += `(${col.character_maximum_length})`
      } else if (col.numeric_precision) {
        def += `(${col.numeric_precision}`
        if (col.numeric_scale) {
          def += `,${col.numeric_scale}`
        }
        def += `)`
      }

      if (col.is_nullable === 'NO') {
        def += ' NOT NULL'
      }

      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`
      }

      return def
    })

    sql += columnDefs.join(',\n')
    sql += '\n);'

    return sql
  }

  async generateCompleteSchema() {
    console.log('🚀 Generating complete schema...\n')

    const tables = await this.getTableDefinitions()
    const indexes = await this.getIndexes()
    const constraints = await this.getConstraints()
    const functions = await this.getFunctions()
    const triggers = await this.getTriggers()
    const views = await this.getViews()

    let schema = `-- AWS Database Schema Export
-- Generated on: ${new Date().toISOString()}
-- Source: ${awsConfig.host}

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

`

    // Generate CREATE TABLE statements
    Object.keys(tables).forEach(tableName => {
      schema += `\n-- Table: ${tableName}\n`
      schema += this.generateCreateTableSQL(tableName, tables[tableName])
      schema += '\n\n'
    })

    // Generate indexes
    if (indexes.length > 0) {
      schema += '-- Indexes\n'
      indexes.forEach(index => {
        if (!index.indexname.includes('_pkey')) {
          // Skip primary keys
          schema += `${index.indexdef};\n`
        }
      })
      schema += '\n'
    }

    // Generate constraints
    if (constraints.length > 0) {
      schema += '-- Constraints\n'
      constraints.forEach(constraint => {
        if (constraint.constraint_type === 'FOREIGN KEY') {
          schema += `ALTER TABLE ${constraint.table_name} ADD CONSTRAINT ${constraint.constraint_name} FOREIGN KEY (${constraint.column_name}) REFERENCES ${constraint.foreign_table_name}(${constraint.foreign_column_name});\n`
        }
      })
      schema += '\n'
    }

    // Generate functions
    if (functions.length > 0) {
      schema += '-- Functions\n'
      functions.forEach(func => {
        schema += `-- Function: ${func.routine_name}\n`
        schema += `${func.routine_definition};\n\n`
      })
    }

    // Generate triggers
    if (triggers.length > 0) {
      schema += '-- Triggers\n'
      triggers.forEach(trigger => {
        schema += `CREATE TRIGGER ${trigger.trigger_name}\n`
        schema += `  ON ${trigger.event_object_table}\n`
        schema += `  ${trigger.action_statement};\n\n`
      })
    }

    // Generate views
    if (views.length > 0) {
      schema += '-- Views\n'
      views.forEach(view => {
        schema += `CREATE VIEW ${view.table_name} AS\n`
        schema += `${view.view_definition};\n\n`
      })
    }

    return schema
  }

  async extract() {
    console.log('🚀 Starting AWS schema extraction...\n')

    await this.connect()

    const schema = await this.generateCompleteSchema()

    // Write to file
    const outputFile = 'aws-schema.sql'
    fs.writeFileSync(outputFile, schema)

    console.log(`\n✅ Schema extraction completed!`)
    console.log(`📄 Schema saved to: ${outputFile}`)
    console.log(`📊 Total size: ${(schema.length / 1024).toFixed(2)} KB`)
  }

  async close() {
    if (this.awsPool) {
      await this.awsPool.end()
      console.log('🔌 Disconnected from AWS database')
    }
  }
}

// Main execution
async function main() {
  const extractor = new SchemaExtractor()

  try {
    await extractor.extract()
  } catch (error) {
    console.error('❌ Schema extraction failed:', error)
    process.exit(1)
  } finally {
    await extractor.close()
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { SchemaExtractor }
