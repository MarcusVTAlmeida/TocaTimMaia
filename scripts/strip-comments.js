const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{src/**/*.js,*.js,functions/*.js}', {
  ignore: ['**/node_modules/**', '**/.history/**', 'node_modules/**', '**/functions/node_modules/**'],
});

let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // 1. Remove JSX comments:  { /* ... */ }
  content = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  // 2. Remove full-line JS comments:  // ...
  content = content.replace(/^[ \t]*\/\/(?!\/).*/gm, '');

  // 3. Remove block comments:  /* ... */   (non‑JSX)
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');

  // 4. Remove empty‑comment lines that proguard leaves (lines with just * characters)
  content = content.replace(/^[ \t]*\*.*/gm, '');

  // 5. Remove trailing inline // comments (safe: not inside strings)
  content = content.replace(/[ \t]\/\/(?!\/).*/g, '');

  // 6. Remove trailing whitespace from lines
  content = content.replace(/[ \t]+$/gm, '');

  // 7. Collapse 3+ consecutive blank lines into 2
  content = content.replace(/\n{3,}/g, '\n\n');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ ${file}`);
    count++;
  }
}

console.log(`\nDone. ${count} files modified.`);
