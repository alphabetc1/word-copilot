#!/usr/bin/env node
/**
 * Manage a background local Word Copilot runtime:
 * - find an available localhost HTTPS port
 * - build the add-in
 * - generate a runtime manifest for that port
 * - sideload the generated manifest
 * - run a detached local HTTPS server
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const net = require("net");
const { spawn, spawnSync } = require("child_process");

const projectRoot = path.join(__dirname, "..");
const stateDir = path.join(projectRoot, ".word-copilot-local");
const stateFile = path.join(stateDir, "runtime.json");
const logFile = path.join(stateDir, "server.log");
const runtimeManifestPath = path.join(stateDir, "word-copilot-local.runtime.xml");
const templateManifestPath = path.join(projectRoot, "word-copilot-local.xml");
const serverScriptPath = path.join(__dirname, "local-https-server.js");
const startPort = 38300;
const maxPortAttempts = 200;
const host = "localhost";

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

function ensureSupportedPlatform() {
  if (process.platform !== "darwin" && process.platform !== "win32") {
    exitWithError("This local runtime only supports macOS and Windows.");
  }
}

function ensureStateDir() {
  fs.mkdirSync(stateDir, { recursive: true });
}

function loadState() {
  if (!fs.existsSync(stateFile)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {
    return null;
  }
}

function saveState(state) {
  ensureStateDir();
  fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function removeState() {
  if (fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile);
  }
}

function isProcessRunning(pid) {
  if (!pid || Number.isNaN(Number(pid))) {
    return false;
  }

  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env, ...(options.env || {}) },
  });

  if (result.error) {
    exitWithError(`Failed to run ${command}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    exitWithError(`${command} ${args.join(" ")} failed with exit code ${result.status}.`);
  }
}

function ensureDependencies() {
  const webpackPath =
    process.platform === "win32"
      ? path.join(projectRoot, "node_modules", ".bin", "webpack.cmd")
      : path.join(projectRoot, "node_modules", ".bin", "webpack");

  if (!fs.existsSync(webpackPath)) {
    console.log("Installing dependencies...");
    runCommand(npmCommand(), ["install"], { env: { HUSKY: "0" } });
  }
}

function ensureCertificates() {
  const certDir = path.join(os.homedir(), ".office-addin-dev-certs");
  const keyPath = path.join(certDir, "localhost.key");
  const certPath = path.join(certDir, "localhost.crt");

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log("Installing localhost dev certificates...");
    runCommand(npmCommand(), ["run", "dev:certs"]);
  }
}

function buildBundle() {
  console.log("Building local bundle...");
  runCommand(npmCommand(), ["run", "build"]);
}

function generateRuntimeManifest(port) {
  if (!fs.existsSync(templateManifestPath)) {
    exitWithError(`Template manifest not found: ${templateManifestPath}`);
  }

  const template = fs.readFileSync(templateManifestPath, "utf8");
  const runtimeManifest = template.replaceAll(
    "https://localhost:3000",
    `https://${host}:${port}`
  );

  ensureStateDir();
  fs.writeFileSync(runtimeManifestPath, runtimeManifest, "utf8");
  return runtimeManifestPath;
}

function sideloadManifest(manifestPath) {
  const sideloadScript =
    process.platform === "darwin"
      ? path.join(__dirname, "sideload-mac.js")
      : path.join(__dirname, "sideload-windows.js");

  console.log("Sideloading local manifest...");
  runCommand(process.execPath, [sideloadScript, manifestPath]);
}

function checkPortAvailability(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, host);
  });
}

async function findAvailablePort() {
  for (let port = startPort; port < startPort + maxPortAttempts; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await checkPortAvailability(port)) {
      return port;
    }
  }

  exitWithError(
    `No free port found in range ${startPort}-${startPort + maxPortAttempts - 1}.`
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForPort(port, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    const available = await checkPortAvailability(port);
    if (!available) {
      return true;
    }
    // eslint-disable-next-line no-await-in-loop
    await wait(250);
  }
  return false;
}

function startServer(port) {
  ensureStateDir();
  const output = fs.openSync(logFile, "a");
  const child = spawn(process.execPath, [serverScriptPath], {
    cwd: projectRoot,
    detached: true,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host,
    },
    stdio: ["ignore", output, output],
    windowsHide: true,
  });

  child.unref();
  return child.pid;
}

function stopRunningProcess(pid) {
  if (!isProcessRunning(pid)) {
    return false;
  }

  try {
    process.kill(Number(pid));
    return true;
  } catch (error) {
    exitWithError(`Failed to stop process ${pid}: ${error.message}`);
  }
}

function instructionPrefix() {
  return process.platform === "darwin"
    ? "bash scripts/start-local-mac.sh"
    : ".\\scripts\\start-local-windows.cmd";
}

function printStatus(state, isRunning) {
  if (!state) {
    console.log("Local Word Copilot runtime is not running.");
    console.log(`Start: ${instructionPrefix()}`);
    return;
  }

  if (!isRunning) {
    console.log("Local Word Copilot runtime state exists, but the server is not running.");
    console.log(`Clean restart: ${instructionPrefix()} stop`);
    console.log(`Then run: ${instructionPrefix()}`);
    return;
  }

  console.log("Local Word Copilot runtime is running.");
  console.log(`- PID: ${state.pid}`);
  console.log(`- URL: https://${host}:${state.port}`);
  console.log(`- Log: ${logFile}`);
  console.log(`Stop: ${instructionPrefix()} stop`);
}

async function startRuntime() {
  ensureSupportedPlatform();
  ensureStateDir();

  const existingState = loadState();
  if (existingState && isProcessRunning(existingState.pid)) {
    printStatus(existingState, true);
    return;
  }

  if (existingState) {
    removeState();
  }

  ensureDependencies();
  ensureCertificates();

  const port = await findAvailablePort();
  buildBundle();
  const manifestPath = generateRuntimeManifest(port);
  sideloadManifest(manifestPath);

  console.log(`Starting local HTTPS server in background at https://${host}:${port} ...`);
  const pid = startServer(port);
  const ready = await waitForPort(port, 8000);

  if (!ready) {
    stopRunningProcess(pid);
    exitWithError(
      `Local server failed to start. See log: ${logFile}`
    );
  }

  const state = {
    pid,
    port,
    host,
    manifestPath,
    startedAt: new Date().toISOString(),
  };
  saveState(state);

  console.log("");
  console.log("Local Word Copilot runtime is ready.");
  console.log(`- URL: https://${host}:${port}`);
  console.log(`- Stop: ${instructionPrefix()} stop`);
  console.log(`- Status: ${instructionPrefix()} status`);
  console.log(`- Log: ${logFile}`);
  if (process.platform === "darwin") {
    console.log("Restart Word completely (Cmd+Q, then reopen) before opening the add-in.");
  } else {
    console.log("If this is the first Windows load, open Word -> My Add-ins -> SHARED FOLDER -> Word Copilot -> Add.");
  }
}

function stopRuntime() {
  ensureSupportedPlatform();
  const state = loadState();
  if (!state) {
    console.log("Local Word Copilot runtime is not running.");
    return;
  }

  const stopped = stopRunningProcess(state.pid);
  removeState();

  if (stopped) {
    console.log(`Stopped local Word Copilot runtime on https://${host}:${state.port}.`);
  } else {
    console.log("Removed stale runtime state.");
  }
}

function statusRuntime() {
  ensureSupportedPlatform();
  const state = loadState();
  printStatus(state, Boolean(state && isProcessRunning(state.pid)));
}

async function main() {
  const command = process.argv[2] || "start";

  if (command === "start") {
    await startRuntime();
    return;
  }

  if (command === "stop") {
    stopRuntime();
    return;
  }

  if (command === "status") {
    statusRuntime();
    return;
  }

  exitWithError("Usage: node scripts/local-runtime.js [start|stop|status]");
}

main().catch((error) => {
  exitWithError(error && error.message ? error.message : String(error));
});
