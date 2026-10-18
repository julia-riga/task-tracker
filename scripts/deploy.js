#!/usr/bin/env node
/**
 * Local deploy script — copies frontend files to repo root for GitHub Pages testing.
 * Run: npm run deploy:local
 */

const fs = require('fs');
const path = require('path');

console.log('🏠 Deploying frontend to root level...');

const frontendDir = path.join(__dirname, '..', 'frontend');
const files = fs.readdirSync(frontendDir);

for (const file of files) {
    const srcPath = path.join(frontendDir, file);
    const destPath = path.join(__dirname, '..', file);
    
    if (fs.statSync(srcPath).isDirectory()) continue; // skip subdirs for local deploy
    
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✅ Copied ${file}`);
}

const rootIndex = path.join(__dirname, '..', 'index.html');
if (fs.existsSync(rootIndex)) {
    console.warn('  ⚠️  Existing index.html at root will be overwritten.');
}

console.log('\n✅ Deploy complete! Frontend files are now at repo root.');
console.log('   You can commit and push to trigger GitHub Pages deployment.');
