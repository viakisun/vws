#!/usr/bin/env node
// Fix simple a11y label/control associations in Svelte files

const fs = require('fs')
const glob = require('glob')

const WRITE = process.argv.includes('--write')

const files = glob.sync('src/**/*.svelte', {
  ignore: ['**/node_modules/**', '**/.svelte-kit/**', '**/build/**', '**/dist/**']
})

let changed = 0
let todos = []

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  let updated = src
  let fileChanged = false

  // Pattern 1: <label>Label Text</label> followed by <input|select|textarea> without id/for
  const labelControlPattern =
    /<label\s+([^>]*?)class="([^"]*?)"\s*([^>]*?)>([^<]+)<\/label>\s*<(input|select|textarea)([^>]*?)>/g

  let match
  while ((match = labelControlPattern.exec(src)) !== null) {
    const [fullMatch, labelAttrs1, labelClass, labelAttrs2, labelText, controlTag, controlAttrs] =
      match

    // Skip if already has for/id association
    if (
      labelAttrs1.includes('for=') ||
      labelAttrs2.includes('for=') ||
      controlAttrs.includes('id=')
    ) {
      continue
    }

    // Generate unique id
    const fieldId = `field-${labelText.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`

    // Add id to control and for to label
    const newLabel = `<label ${labelAttrs1}class="${labelClass}" ${labelAttrs2}for="${fieldId}">${labelText}</label>`
    const newControl = `<${controlTag}${controlAttrs} id="${fieldId}">`

    updated = updated.replace(fullMatch, newLabel + '\n' + newControl)
    fileChanged = true
  }

  // Pattern 2: Simple adjacent label/control pairs
  const simplePattern =
    /<label\s+class="block text-sm font-medium text-gray-700 mb-1">([^<]+)<\/label>\s*<(input|select|textarea)([^>]*?)>/g

  while ((match = simplePattern.exec(src)) !== null) {
    const [fullMatch, labelText, controlTag, controlAttrs] = match

    // Skip if already has id/for
    if (controlAttrs.includes('id=') || fullMatch.includes('for=')) {
      continue
    }

    // Skip complex cases (multiple attributes, nested elements)
    if (controlAttrs.includes('bind:') || controlAttrs.includes('on:')) {
      todos.push(`${f}: Complex control with bind/on - manual review needed`)
      continue
    }

    const fieldId = `field-${labelText.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`
    const newLabel = `<label class="block text-sm font-medium text-gray-700 mb-1" for="${fieldId}">${labelText}</label>`
    const newControl = `<${controlTag}${controlAttrs} id="${fieldId}">`

    updated = updated.replace(fullMatch, newLabel + '\n' + newControl)
    fileChanged = true
  }

  if (fileChanged) {
    changed++
    if (WRITE) {
      fs.writeFileSync(f, updated, 'utf8')
    } else {
      console.log(`[DRY-RUN] ${f}: would fix a11y label/control associations`)
    }
  }
}

console.log(
  JSON.stringify(
    {
      filesScanned: files.length,
      changed,
      todos: todos.length > 0 ? todos : undefined
    },
    null,
    2
  )
)

