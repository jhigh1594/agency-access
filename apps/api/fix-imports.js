#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('src/**/*.ts');

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const original = content;
  
  // Fix relative imports: from '../path' or './path' -> from '../path.js' or './path.js'
  // But don't touch imports that already have extensions or are from node_modules
  content = content.replace(
    /from\s+['"](\.\.?\/[^'"]+)['"]/g,
    (match, path) => {
      // Skip if already has extension
      if (path.match(/\.(js|ts|json)$/)) {
        return match;
      }
      // Add .js extension
      return match.replace(path, `${path}.js`);
    }
  );
  
  // Also fix dynamic imports
  content = content.replace(
    /import\(['"](\.\.?\/[^'"]+)['"]\)/g,
    (match, path) => {
      if (path.match(/\.(js|ts|json)$/)) {
        return match;
      }
      return match.replace(path, `${path}.js`);
    }
  );
  
  if (content !== original) {
    writeFileSync(file, content, 'utf-8');
    console.log(`Fixed imports in ${file}`);
  }
}

console.log('Done fixing imports!');

