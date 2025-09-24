#!/usr/bin/env node
// Ensure Svelte files that use `logger.*` have
//   import { logger } from '$lib/utils/logger'
// inside the <script> block.

const fs = require('fs')
const glob = require('glob')

const WRITE = process.argv.includes('--write')

const files = glob.sync('src/**/*.svelte', {
  ignore: ['**/node_modules/**', '**/.svelte-kit/**', '**/build/**', '**/dist/**']
})

let changed = 0

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')

  // Skip if file doesn't reference logger at all
  if (!/\blogger\./.test(src)) continue

  // Find first <script ...> ... </script>
  const scriptOpenMatch = src.match(/<script\b[^>]*>/)
  const scriptCloseIndex = src.indexOf('</script>')
  if (!scriptOpenMatch || scriptCloseIndex === -1) continue

  const openTag = scriptOpenMatch[0]
  const openIndex = scriptOpenMatch.index
  const afterOpenIndex = openIndex + openTag.length

  const scriptContent = src.slice(afterOpenIndex, scriptCloseIndex)

  // If already imported inside script, skip
  if (/import\s*\{\s*logger\s*\}\s*from\s*['"]\$lib\/utils\/logger['"]\s*;?/.test(scriptContent)) {
    continue
  }

  // Prepare insertion
  const importLine = "\n  import { logger } from '$lib/utils/logger'\n"
  const updated = src.slice(0, afterOpenIndex) + importLine + src.slice(afterOpenIndex)

  if (WRITE) {
    fs.writeFileSync(f, updated, 'utf8')
  } else {
    console.log(`[DRY-RUN] ${f}: would insert logger import inside <script> block`)
  }
  changed++
}

console.log(JSON.stringify({ filesScanned: files.length, changed }, null, 2))

