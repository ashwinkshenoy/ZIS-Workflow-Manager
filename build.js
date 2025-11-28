// **********
// To Build Manifest File (based on ENV from cli command)
// **********

import manifestData from './manifest.js';
import fs from 'fs';
import path from 'path';

const manifest = JSON.stringify(manifestData, null, 2);
let outputPath = 'manifest.json';
const foldersToCopy = ['assets', 'translations'];

// Check for 'prod' argument to adjust output path and copy static folders
process.argv.forEach((val) => {
  if (val === 'prod') {
    outputPath = './out/manifest.json';
    const outDir = path.resolve('out');

    for (const folder of foldersToCopy) {
      const from = path.resolve(folder);
      const to = path.join(outDir, folder);
      if (fs.existsSync(from)) {
        console.log(`📦 Copying ${folder} → ${to}`);
        copyFolderSync(from, to);
      } else {
        console.warn(`⚠️  Skipping missing folder: ${folder}`);
      }
    }

    console.log('✅ Static folders copied to .out/');
  }
});

fs.writeFile(outputPath, manifest, 'utf-8', (err) => {
  if (err) {
    console.error('Error:', err);
  }
});

function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const file of fs.readdirSync(from)) {
    const srcPath = path.join(from, file);
    const destPath = path.join(to, file);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
