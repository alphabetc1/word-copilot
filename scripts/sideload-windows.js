#!/usr/bin/env node
/**
 * Sideload Office Add-in manifest for Windows (Word/Excel/PowerPoint/Project).
 *
 * What this script does:
 * 1. Copies manifest to catalog folder: ~/Documents/OfficeAddinManifests
 * 2. Automatically shares the folder (requires admin privileges)
 * 3. Registers the catalog as Trusted Add-in Catalog via registry (HKCU)
 *
 * Usage:
 *   npm run sideload:windows              # default: word-copilot.xml (hosted)
 *   npm run sideload:windows -- word-copilot-local.xml
 *   npm run sideload:windows -- --skip-share   # skip auto-sharing (if already shared)
 *
 * Notes:
 * - If your Office major version isn't 16.0, pass `--officeVersion 16.0` accordingly.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawnSync, execSync } = require("child_process");

function parseArgs(argv) {
  const out = { positional: [], skipShare: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--skip-share") {
      out.skipShare = true;
      continue;
    }
    if (a === "--officeVersion") {
      out.officeVersion = argv[i + 1];
      i += 1;
      continue;
    }
    if (a.startsWith("--")) continue;
    out.positional.push(a);
  }
  return out;
}

function getComputerName() {
  try {
    return execSync("hostname", { encoding: "utf8" }).trim();
  } catch {
    return os.hostname();
  }
}

function shareFolder(folderPath, shareName) {
  // Check if share already exists
  const checkResult = spawnSync("net", ["share", shareName], {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (checkResult.status === 0) {
    console.log(`✓ Share "${shareName}" already exists.`);
    return true;
  }

  // Create the share
  console.log(`Creating network share: ${shareName}...`);
  const result = spawnSync(
    "net",
    ["share", `${shareName}=${folderPath}`, "/grant:everyone,read"],
    { stdio: "inherit" }
  );
  if (result.status === 0) {
    console.log(`✓ Folder shared as: \\\\${getComputerName()}\\${shareName}`);
    return true;
  } else {
    console.log("⚠ Failed to auto-share folder (may need admin privileges).");
    console.log("  You can share it manually:");
    console.log(`  1. Right-click folder: ${folderPath}`);
    console.log("  2. Properties → Sharing → Share → Add 'Everyone' with Read permission");
    return false;
  }
}

function toAbsolute(p) {
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

function ensureDir(dir) {
  if (fs.existsSync(dir)) return;
  fs.mkdirSync(dir, { recursive: true });
}

function regAdd(key, name, type, value) {
  const args = ["add", key, "/f"];
  if (name) args.push("/v", name);
  if (type) args.push("/t", type);
  if (value !== undefined) args.push("/d", value);

  const r = spawnSync("reg", args, { stdio: "inherit" });
  if (r.status !== 0) {
    throw new Error(`reg add failed for key: ${key}`);
  }
}

// Platform guard
if (process.platform !== "win32") {
  console.log("This script is for Windows only.");
  console.log("On macOS, use: npm run sideload:mac");
  process.exit(0);
}

// Default to the hosted/production manifest most of the time.
const DEFAULT_MANIFEST = path.join(__dirname, "..", "word-copilot.xml");
const args = parseArgs(process.argv.slice(2));
const inputManifest = args.positional[0] ? toAbsolute(args.positional[0]) : DEFAULT_MANIFEST;

if (!fs.existsSync(inputManifest)) {
  console.error(`Error: manifest not found: ${inputManifest}`);
  console.error("Tip: run from project root, or pass a manifest path.");
  process.exit(1);
}

const catalogDir = path.join(os.homedir(), "Documents", "OfficeAddinManifests");
const shareName = "OfficeAddinManifests";
ensureDir(catalogDir);

// Always overwrite the same file name to avoid multiple manifests with the same <Id>
// being picked up by Office.
const destPath = path.join(catalogDir, "word-copilot.xml");
fs.copyFileSync(inputManifest, destPath);

console.log(`✓ Manifest copied to: ${destPath}`);
console.log("");

// Step 2: Share the folder
let shareSuccess = false;
if (!args.skipShare) {
  shareSuccess = shareFolder(catalogDir, shareName);
  console.log("");
}

// Step 3: Register Trusted Add-in Catalog in registry
const computerName = getComputerName();
const uncPath = `\\\\${computerName}\\${shareName}`;
const officeVersion = args.officeVersion || "16.0";
const guid = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
const normalizedGuid = guid.startsWith("{") ? guid : `{${guid}}`;
const key = `HKCU\\Software\\Microsoft\\Office\\${officeVersion}\\WEF\\TrustedCatalogs\\${normalizedGuid}`;

console.log("Registering Trusted Add-in Catalog (HKCU)...");
console.log(`- Office version: ${officeVersion}`);
console.log(`- UNC path: ${uncPath}`);

try {
  regAdd(key, "Id", "REG_SZ", normalizedGuid);
  regAdd(key, "Url", "REG_SZ", uncPath);
  regAdd(key, "Flags", "REG_DWORD", "1");
  console.log("✓ Registry updated.");
} catch (e) {
  console.error(`⚠ Registry update failed: ${e.message}`);
  console.error("You can configure the trust manually in Word's Trust Center.");
}

console.log("");
console.log("=" .repeat(60));
console.log("Installation complete! Next steps:");
console.log("=" .repeat(60));
console.log("1) Restart Word (completely close and reopen)");
console.log("2) Go to: Insert → Add-ins → My Add-ins → SHARED FOLDER");
console.log("3) Select 'Word Copilot' and click Add");
console.log("");
if (!shareSuccess && !args.skipShare) {
  console.log("⚠ Note: If the add-in doesn't appear, you may need to:");
  console.log("  - Run this script as Administrator, OR");
  console.log("  - Manually share the folder (right-click → Properties → Sharing)");
}

