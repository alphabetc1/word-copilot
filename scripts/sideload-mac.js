#!/usr/bin/env node
/**
 * Sideload Office Add-in manifest for Mac
 * This copies the manifest to Word's wef directory.
 *
 * Expected destination (Word on macOS):
 *   ~/Library/Containers/com.microsoft.Word/Data/Documents/wef/word-copilot.xml
 *
 * Usage:
 *   npm run sideload:mac                 # default: word-copilot.xml (hosted)
 *   npm run sideload:mac -- word-copilot-local.xml
 *   npm run sideload:mac -- /absolute/path/to/word-copilot.xml
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Default to the hosted/production manifest most of the time.
const DEFAULT_MANIFEST = path.join(__dirname, "..", "word-copilot.xml");
const inputArg = process.argv.slice(2).find((a) => a && !a.startsWith("-"));
const manifestPath = inputArg
  ? path.isAbsolute(inputArg)
    ? inputArg
    : path.resolve(process.cwd(), inputArg)
  : DEFAULT_MANIFEST;

const wefDir = path.join(
  os.homedir(),
  "Library/Containers/com.microsoft.Word/Data/Documents/wef"
);

// Check if running on Mac
if (process.platform !== 'darwin') {
  console.log('This script is for macOS only.');
  console.log('On Windows, use: Insert → Get Add-ins → My Add-ins → Upload My Add-in');
  process.exit(0);
}

// Check if manifest exists
if (!fs.existsSync(manifestPath)) {
  console.error(`Error: manifest not found: ${manifestPath}`);
  console.error("Tip: run from project root, or pass a manifest path.");
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
// Always overwrite the same file name to avoid multiple manifests with the same <Id>
// being picked up by Word.
const destPath = path.join(wefDir, "word-copilot.xml");
try {
  fs.copyFileSync(manifestPath, destPath);
  console.log(`✓ Manifest copied to: ${destPath}`);
  console.log('');
  console.log('Next steps:');

  const xml = fs.readFileSync(manifestPath, "utf8");
  const isLocalhost = xml.includes("https://localhost:3000");

  if (isLocalhost) {
    console.log("1. Run: npm run dev  (keep it running)");
  } else {
    console.log("1. No dev server needed (manifest points to a hosted URL)");
  }

  console.log("2. Restart Word completely (Cmd+Q, then reopen)");
  console.log("3. Ribbon: look for the 'Word Copilot' tab");
  console.log("   Or: select text → right click → 'Word Copilot'");
} catch (err) {
  console.error(`Error copying manifest: ${err.message}`);
  process.exit(1);
}
