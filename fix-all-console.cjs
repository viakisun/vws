const fs = require('fs')
const { execSync } = require('child_process')

// Find all files with console usage (excluding logger.ts itself)
const output = execSync(
  'find src -name "*.ts" -o -name "*.svelte" | xargs grep -l "console\\." | grep -v node_modules | grep -v logger.ts',
  { encoding: 'utf-8' },
)

const files = output
  .trim()
  .split('\n')
  .filter((f) => f)

console.log(`Found ${files.length} files with console usage\n`)

let replaced = 0
const replacements = [
  { from: /console\.error\(/g, to: 'logger.error(' },
  { from: /console\.log\(/g, to: 'logger.info(' },
  { from: /console\.warn\(/g, to: 'logger.warn(' },
  { from: /console\.info\(/g, to: 'logger.info(' },
]

files.forEach((file) => {
  try {
    let content = fs.readFileSync(file, 'utf-8')
    let modified = false

    replacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to)
        modified = true
      }
    })

    if (modified) {
      // Add logger import if not present
      if (!content.includes('import { logger }') && !content.includes("from '$lib/utils/logger'")) {
        const lines = content.split('\n')
        let insertIndex = -1

        // Find last import statement
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ') || lines[i].includes(' from ')) {
            insertIndex = i + 1
          } else if (
            insertIndex > 0 &&
            !lines[i].trim().startsWith('import ') &&
            lines[i].trim() !== ''
          ) {
            break
          }
        }

        if (insertIndex > 0) {
          lines.splice(insertIndex, 0, "import { logger } from '$lib/utils/logger'")
          content = lines.join('\n')
        } else if (lines[0].startsWith('<script')) {
          // Svelte file - add after <script> tag
          lines.splice(1, 0, "\timport { logger } from '$lib/utils/logger'")
          content = lines.join('\n')
        }
      }

      fs.writeFileSync(file, content)
      console.log(`✓ Fixed: ${file}`)
      replaced++
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message)
  }
})

console.log(`\n✅ Fixed ${replaced} files`)
