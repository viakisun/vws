#!/usr/bin/env node
// Trivial any -> unknown codemod (SAFE)
// Scope: src/**/*.{ts,tsx}
// Changes:
//  - any[]           -> unknown[]
//  - Array<any>      -> Array<unknown>
//  - Record<*, any>  -> Record<*, unknown>
//  - $state<any[]>   -> $state<unknown[]>
// Skips:
//  - .d.ts files
//  - test/spec files

const fs = require('fs')
const glob = require('glob')

const WRITE = process.argv.includes('--write')

const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: [
    '**/node_modules/**',
    '**/.svelte-kit/**',
    '**/build/**',
    '**/dist/**',
    '**/*.d.ts',
    '**/*.{test,spec}.ts',
    '**/*.{test,spec}.tsx'
  ]
})

let changedFiles = 0
let totalReplacements = 0

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  let out = src

  const before = out

  // Replace any[] when used as a type (avoid string literals)
  out = out.replace(/\bany\[\]/g, 'unknown[]')
  // Replace Array<any>
  out = out.replace(/\bArray<\s*any\s*>/g, 'Array<unknown>')
  // Replace Record<string, any> and Record<..., any>
  out = out.replace(/\bRecord<([^,>]+),\s*any\s*>/g, 'Record<$1, unknown>')
  // Replace $state<any[]>(...)
  out = out.replace(/\$state<\s*any\s*\[\s*\]\s*>\s*\(/g, '$state<unknown[]>(')

  if (out !== before) {
    const count = (out.match(/unknown/g) || []).length - (before.match(/unknown/g) || []).length
    totalReplacements += Math.max(0, count)
    changedFiles++
    if (WRITE) {
      fs.writeFileSync(f, out, 'utf8')
    } else {
      console.log(`[DRY-RUN] ${f}: would update trivial any usages`)
    }
  }
}

console.log(
  JSON.stringify(
    {
      filesScanned: files.length,
      changedFiles,
      totalReplacements,
      mode: WRITE ? 'WRITE' : 'DRY-RUN'
    },
    null,
    2
  )
)
