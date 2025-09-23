const fs = require('fs')
const glob = require('glob')

// Find all .svelte files
const files = glob.sync('**/*.svelte', {
  ignore: ['**/node_modules/**', '**/build/**']
})

let modifiedCount = 0

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const originalContent = content

  // Add type="button" to buttons that don't have a type attribute
  content = content.replace(/<button(?![^>]*\btype=)([^>]*)>/g, '<button type="button"$1>')

  if (content !== originalContent) {
    fs.writeFileSync(file, content)
    modifiedCount++
    console.log(`Modified: ${file}`)
  }
}

console.log(`\nTotal files modified: ${modifiedCount}`)
