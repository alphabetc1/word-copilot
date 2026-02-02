#!/usr/bin/env node
/**
 * Sideload Office Add-in manifest for Windows (Word/Excel/PowerPoint/Project).
 *
 * IMPORTANT:
 * Windows doesn't support the macOS-style "drop into wef folder" sideload for
 * taskpane/content add-ins. The recommended approach is a Shared Folder Catalog.
 *
 * What this script does:
 * - Copies a manifest to a local "catalog" folder (default: ~/Documents/OfficeAddinManifests)
 * - Prints the exact folder/file path so users can manually copy if needed
 * - Optionally registers the catalog as a Trusted Add-in Catalog via registry (HKCU)
 *
 * Expected manifest location (catalog folder):
 *   %USERPROFILE%\Documents\OfficeAddinManifests\word-copilot.xml
 *
 * Usage:
 *   npm run sideload:windows              # default: word-copilot.xml (hosted)
 *   npm run sideload:windows -- word-copilot-local.xml
 *   npm run sideload:windows -- /absolute/path/to/word-copilot.xml
 *
 * Optional (advanced):
 *   npm run sideload:windows -- word-copilot.xml --register "\\\\YOUR-PC-NAME\\\\OfficeAddinManifests"
 *
 * Notes:
 * - The `--register` URL should be a UNC share path. You still need to share the folder.
 * - If your Office major version isn't 16.0, pass `--officeVersion 16.0` accordingly.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const out = { positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--register") {
      out.register = argv[i + 1];
      i += 1;
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
ensureDir(catalogDir);

// Always overwrite the same file name to avoid multiple manifests with the same <Id>
// being picked up by Office.
const destPath = path.join(catalogDir, "word-copilot.xml");
fs.copyFileSync(inputManifest, destPath);

console.log(`✓ Manifest copied to: ${destPath}`);
console.log("");
console.log("Next steps (Windows):");
console.log("1) Share this folder (read access is enough):");
console.log(`   ${catalogDir}`);
console.log("2) In Word: File → Options → Trust Center → Trust Center Settings → Trusted Add-in Catalogs");
console.log("   Add the network path (UNC) of the shared folder, and check 'Show in Menu'.");
console.log("3) Restart Word, then: Home → Add-ins → Advanced → SHARED FOLDER → select 'Word Copilot'.");

// Optional registry registration (TrustedCatalogs)
if (args.register) {
  const officeVersion = args.officeVersion || "16.0";
  const guid = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
  const normalizedGuid = guid.startsWith("{") ? guid : `{${guid}}`;
  const key = `HKCU\\Software\\Microsoft\\Office\\${officeVersion}\\WEF\\TrustedCatalogs\\${normalizedGuid}`;

  console.log("");
  console.log("Registering Trusted Add-in Catalog (HKCU)...");
  console.log(`- Office version: ${officeVersion}`);
  console.log(`- Key: ${key}`);
  console.log(`- Url: ${args.register}`);

  try {
    regAdd(key, "Id", "REG_SZ", normalizedGuid);
    regAdd(key, "Url", "REG_SZ", args.register);
    regAdd(key, "Flags", "REG_DWORD", "1");
    console.log("✓ Registry updated. Restart Word to take effect.");
  } catch (e) {
    console.error(`Error: ${e.message}`);
    console.error("You can still configure the trust manually in Word's Trust Center.");
    process.exit(1);
  }
}

