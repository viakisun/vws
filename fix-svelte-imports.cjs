const fs = require('fs')
const { execSync } = require('child_process')

// Find all Svelte files with logger import issues
const output = execSync('find src -name "*.svelte" -exec grep -l "logger" {} \\;', {
  encoding: 'utf-8',
})

const files = output
  .trim()
  .split('\n')
  .filter((f) => f)

console.log(`Checking ${files.length} Svelte files\n`)

let fixed = 0

files.forEach((file) => {
  try {
    let content = fs.readFileSync(file, 'utf-8')
    let modified = false

    // Pattern 1: import inside type import block
    // from:
    //   import type {
    //   import { logger } from ...
    //     SomeType,
    // to:
    //   import { logger } from ...
    //   import type {
    //     SomeType,
    if (/import type \{[^}]*\n\s*import \{ logger \}/.test(content)) {
      // Extract the logger import line
      const loggerImportMatch = content.match(
        /(\s*)import \{ logger \} from '\$lib\/utils\/logger'/,
      )
      if (loggerImportMatch) {
        const loggerImport = loggerImportMatch[0].trim()

        // Remove the misplaced import
        content = content.replace(/\n\s*import \{ logger \} from '\$lib\/utils\/logger'/, '')

        // Find the import type block and insert before it
        content = content.replace(/(import [^]*?\n)(\s*import type \{)/, `$1  ${loggerImport}\n$2`)

        modified = true
      }
    }

    // Pattern 2: import inside regular import block
    // from:
    //   import {
    //   import { logger } from ...
    //     someFunc,
    // to:
    //   import { logger } from ...
    //   import {
    //     someFunc,
    if (/import \{[^}]*\n\s*import \{ logger \}/.test(content)) {
      const loggerImportMatch = content.match(
        /(\s*)import \{ logger \} from '\$lib\/utils\/logger'/,
      )
      if (loggerImportMatch) {
        const loggerImport = loggerImportMatch[0].trim()

        // Remove the misplaced import
        content = content.replace(/\n\s*import \{ logger \} from '\$lib\/utils\/logger'/, '')

        // Find the previous import and insert after it
        content = content.replace(/(import [^]*?\n)(\s*import \{[^i])/, `$1  ${loggerImport}\n$2`)

        modified = true
      }
    }

    if (modified) {
      fs.writeFileSync(file, content)
      console.log(`✓ Fixed: ${file}`)
      fixed++
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message)
  }
})

console.log(`\n✅ Fixed ${fixed} files`)
