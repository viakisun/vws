const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all +server.ts files that use logger but don't import it
const files = execSync(
  'find src/routes/api/finance -name "+server.ts"',
  { encoding: 'utf-8' }
)
  .trim()
  .split('\n');

let fixed = 0;

files.forEach((file) => {
  try {
    const content = fs.readFileSync(file, 'utf-8');

    // Check if file uses logger but doesn't import it
    if (content.includes('logger.') && !content.includes("import { logger }")) {
      console.log(`Adding logger import to: ${file}`);

      // Find the first import statement
      const lines = content.split('\n');
      let insertIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          insertIndex = i + 1;
        } else if (insertIndex > 0 && !lines[i].startsWith('import ')) {
          break;
        }
      }

      if (insertIndex > 0) {
        lines.splice(insertIndex, 0, "import { logger } from '$lib/utils/logger'");
        fs.writeFileSync(file, lines.join('\n'));
        fixed++;
      }
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`\nFixed ${fixed} files`);
