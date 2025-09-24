#!/usr/bin/env node
// Ensure Svelte files that use keyOf(...) have
//   import { keyOf } from '$lib/utils/keyOf'
// inside the first <script> block.

const fs = require('fs')
const glob = require('glob')

const WRITE = process.argv.includes('--write')

const files = glob.sync('src/**/*.svelte', {
  ignore: ['**/node_modules/**', '**/.svelte-kit/**', '**/build/**', '**/dist/**']
})

let changed = 0

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')

  // Quick check for keyOf usage
  if (!/\bkeyOf\s*\(/.test(src)) continue

  const openMatch = src.match(/<script\b[^>]*>/)
  const closeIndex = src.indexOf('</script>')
  if (!openMatch || closeIndex === -1) continue

  const openTag = openMatch[0]
  const openIndex = openMatch.index
  const afterOpen = openIndex + openTag.length
  const scriptContent = src.slice(afterOpen, closeIndex)

  // Skip if already imported
  if (/import\s*\{\s*keyOf\s*\}\s*from\s*['"]\$lib\/utils\/keyOf['"]\s*;?/.test(scriptContent)) {
    continue
  }

  const importLine = "\n  import { keyOf } from '$lib/utils/keyOf'\n"
  const updated = src.slice(0, afterOpen) + importLine + src.slice(afterOpen)

  if (WRITE) {
    fs.writeFileSync(f, updated, 'utf8')
  } else {
    console.log(`[DRY-RUN] ${f}: would insert keyOf import inside <script> block`)
  }
  changed++
}

console.log(JSON.stringify({ filesScanned: files.length, changed }, null, 2))

