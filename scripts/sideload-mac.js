#!/usr/bin/env node
/**
 * Sideload Office Add-in manifest for Mac
 * This copies the manifest to Word's wef directory
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const manifestPath = path.join(__dirname, '..', 'manifest.xml');
const wefDir = path.join(
  os.homedir(),
  'Library/Containers/com.microsoft.Word/Data/Documents/wef'
);

// Check if running on Mac
if (process.platform !== 'darwin') {
  console.log('This script is for macOS only.');
  console.log('On Windows, use: Insert → Get Add-ins → My Add-ins → Upload My Add-in');
  process.exit(0);
}

// Check if manifest exists
if (!fs.existsSync(manifestPath)) {
  console.error('Error: manifest.xml not found. Run from project root.');
  process.exit(1);
}

// Create wef directory if it doesn't exist
if (!fs.existsSync(wefDir)) {
  try {
    fs.mkdirSync(wefDir, { recursive: true });
    console.log(`Created directory: ${wefDir}`);
  } catch (err) {
    console.error(`Error creating wef directory: ${err.message}`);
    console.error('Make sure Word has been opened at least once.');
    process.exit(1);
  }
}

// Copy manifest to wef directory
const destPath = path.join(wefDir, 'word-copilot.xml');
try {
  fs.copyFileSync(manifestPath, destPath);
  console.log(`✓ Manifest copied to: ${destPath}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Restart Word completely (Cmd+Q, then reopen)');
  console.log('3. Go to: 插入 → 加载项 → 我的加载项');
  console.log('4. You should see Word Copilot in the list');
} catch (err) {
  console.error(`Error copying manifest: ${err.message}`);
  process.exit(1);
}
