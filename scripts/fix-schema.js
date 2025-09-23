#!/usr/bin/env node

/**
 * Schema Fixer
 *
 * This script fixes common issues in the extracted AWS schema
 * Usage: node scripts/fix-schema.js
 */

import fs from 'fs'

function fixSchema() {
  console.log('🔧 Fixing AWS schema...')

  let schema = fs.readFileSync('aws-schema.sql', 'utf8')

  // Fix integer data types with precision (PostgreSQL doesn't support integer(32))
  schema = schema.replace(/integer\(\d+\)/g, 'integer')
  schema = schema.replace(/bigint\(\d+\)/g, 'bigint')

  // Fix ARRAY type
  schema = schema.replace(/ARRAY,/g, 'text[],')

  // Fix function definitions - add proper function syntax
  schema = schema.replace(
    /CREATE OR REPLACE FUNCTION update_updated_at_column\(\)\s*RETURNS TRIGGER AS \$\$\s*BEGIN\s*NEW\.updated_at = CURRENT_TIMESTAMP;\s*RETURN NEW;\s*END;\s*\$\$ LANGUAGE plpgsql;/g,
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`
  )

  // Fix trigger definitions
  schema = schema.replace(/CREATE TRIGGER update_[^;]+;\s*null;/g, '')

  // Remove problematic trigger definitions
  schema = schema.replace(/CREATE TRIGGER [^;]+;\s*null;/g, '')

  // Remove duplicate table definitions
  const lines = schema.split('\n')
  const seenTables = new Set()
  const fixedLines = []

  for (const line of lines) {
    const createTableMatch = line.match(/CREATE TABLE (\w+)/)
    if (createTableMatch) {
      const tableName = createTableMatch[1]
      if (seenTables.has(tableName)) {
        console.log(`   ⏭️  Skipping duplicate table: ${tableName}`)
        continue
      }
      seenTables.add(tableName)
    }
    fixedLines.push(line)
  }

  schema = fixedLines.join('\n')

  // Write fixed schema
  fs.writeFileSync('aws-schema-fixed.sql', schema)

  console.log('✅ Schema fixed!')
  console.log('📄 Fixed schema saved to: aws-schema-fixed.sql')
  console.log(`📊 Total size: ${(schema.length / 1024).toFixed(2)} KB`)
}

// Main execution
fixSchema()
