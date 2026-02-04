#!/usr/bin/env node
/**
 * Cross-platform sideload entrypoint.
 * Delegates to macOS or Windows script based on platform.
 */

const path = require("path");
const { spawnSync } = require("child_process");

function run(targetScript, args) {
  const result = spawnSync(process.execPath, [targetScript, ...args], {
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`Failed to run ${targetScript}: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

const args = process.argv.slice(2);
const scriptsDir = path.join(__dirname);

if (process.platform === "darwin") {
  run(path.join(scriptsDir, "sideload-mac.js"), args);
} else if (process.platform === "win32") {
  run(path.join(scriptsDir, "sideload-windows.js"), args);
} else {
  console.log("Unsupported platform for sideload.");
  console.log("Use macOS or Windows to run: npm run sideload");
  process.exit(1);
}
