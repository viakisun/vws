#!/usr/bin/env node
/* Safe {#each} key inserter for Svelte files
 * Scope: simple single-line openings only
 * Rules:
 *  - Skip if opening already has a key "(...)"
 *  - Match only: {#each <expr> as <item>} or {#each <expr> as <item>, <idx>}
 *  - If block uses item.id/uuid/key → use (item.id ?? item.uuid ?? item.key)
 *  - Else index fallback:
 *      - if idx exists → (idx)
 *      - else inject ", idx" and use (idx), plus TODO comment after the opening line
 *  - Skip if nested each exists in the same block (to avoid mispairing)
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

const WRITE = process.argv.includes('--write')
const ROOT = process.cwd()

const files = glob.sync('src/**/*.svelte', {
  ignore: ['**/node_modules/**', '**/.svelte-kit/**', '**/build/**', '**/dist/**']
})

let changedFiles = 0
let changedOpenings = 0
let skippedNested = 0
let skippedHasKey = 0
let skippedComplex = 0

function hasExistingKey(opening) {
  // detect "(...)" after "as ..." before "}"
  const asPos = opening.indexOf(' as ')
  if (asPos === -1) return true // unexpected: treat as has key to skip
  const closePos = opening.indexOf('}')
  if (closePos === -1) return true
  const segment = opening.slice(asPos, closePos)
  return /\([^)]*\)\s*$/.test(segment) // "(...)" right before "}"
}

function isSingleLineOpening(opening) {
  return !opening.includes('\n')
}

function getBlock(text, openIndex) {
  // naive: find nearest closing "{/each}" after opening, ensure no nested "{#each}" between
  const closeIndex = text.indexOf('{/each}', openIndex)
  if (closeIndex === -1) return null
  const inner = text.slice(openIndex, closeIndex)
  if (inner.includes('{#each')) return null // nested each → skip
  return { body: inner, end: closeIndex + '{/each}'.length }
}

// Regex for single-line openings WITHOUT key (two patterns: w/ and w/o index var)
const RX_EACH_NOIDX = /\{#each\s+([^\n}]+?)\s+as\s+([A-Za-z_$][\w$]*)\s*\}/g
const RX_EACH_IDX = /\{#each\s+([^\n}]+?)\s+as\s+([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*\}/g

for (const f of files) {
  let src = fs.readFileSync(f, 'utf8')
  let original = src
  let localChanged = 0

  function processMatches(rx, withIndex) {
    rx.lastIndex = 0
    let m
    const edits = [] // { start, end, replacement, extraInsertAt, extraText }
    while ((m = rx.exec(src)) !== null) {
      const full = m[0]
      const expr = m[1].trim()
      const item = m[2].trim()
      const idxVar = withIndex ? m[3].trim() : null

      // Skip if opening already has key "(...)"
      if (hasExistingKey(full)) {
        skippedHasKey++
        continue
      }
      if (!isSingleLineOpening(full)) {
        skippedComplex++
        continue
      }

      // Find block body to inspect usage
      const openingStart = m.index
      const openingEnd = m.index + full.length
      const block = getBlock(src, openingEnd)
      if (!block) {
        skippedNested++
        continue
      }

      const body = block.body
      const stableKeyUsed = new RegExp(`\\b${item}\\.(id|uuid|key)\\b`).test(body)

      let replacement
      let extraInsertAt = null
      let extraText = ''

      if (stableKeyUsed) {
        // use (item.id ?? item.uuid ?? item.key)
        const keyExpr = `(${item}.id ?? ${item}.uuid ?? ${item}.key)`
        if (withIndex) {
          // {#each expr as item, idx}
          replacement = `{#each ${expr} as ${item}, ${idxVar} ${keyExpr}}`
        } else {
          // {#each expr as item}
          replacement = `{#each ${expr} as ${item} ${keyExpr}}`
        }
      } else {
        // index fallback
        const idxSafe = idxVar || 'idx'
        if (withIndex) {
          replacement = `{#each ${expr} as ${item}, ${idxSafe} (${idxSafe})}`
          // add TODO comment after opening line
          extraInsertAt = openingEnd
          extraText = `\n<!-- TODO: replace index key with a stable id when model provides one -->`
        } else {
          // inject index var
          replacement = `{#each ${expr} as ${item}, ${idxSafe} (${idxSafe})}`
          extraInsertAt = openingEnd
          extraText = `\n<!-- TODO: replace index key with a stable id when model provides one -->`
        }
      }

      edits.push({ start: openingStart, end: openingEnd, replacement, extraInsertAt, extraText })
    }

    // Apply edits from last to first (index-safe)
    if (edits.length) {
      localChanged += edits.length
      edits
        .sort((a, b) => b.start - a.start)
        .forEach(e => {
          src = src.slice(0, e.start) + e.replacement + src.slice(e.end)
          if (e.extraInsertAt != null && e.extraText) {
            const offset = e.extraInsertAt + (e.replacement.length - (e.end - e.start))
            src = src.slice(0, offset) + e.extraText + src.slice(offset)
          }
        })
    }
  }

  processMatches(RX_EACH_IDX, true)
  processMatches(RX_EACH_NOIDX, false)

  if (localChanged > 0) {
    changedFiles++
    changedOpenings += localChanged
    if (WRITE) {
      fs.writeFileSync(f, src, 'utf8')
    } else {
      console.log(`[DRY-RUN] ${f}: would modify ${localChanged} opening(s)`)
    }
  }
}

const summary = {
  filesScanned: files.length,
  changedFiles,
  changedOpenings,
  skippedHasKey,
  skippedNested,
  skippedComplex,
  mode: WRITE ? 'WRITE' : 'DRY-RUN'
}

console.log(JSON.stringify(summary, null, 2))
if (!WRITE && changedOpenings === 0) {
  console.log('No candidates found in dry-run. Nothing to do.')
}

