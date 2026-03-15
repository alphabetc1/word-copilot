#!/usr/bin/env node
/**
 * Minimal HTTPS static file server for local Office sideload usage.
 * It serves the built `dist/` directory on https://localhost:3000.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "localhost";
const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const certDir = path.join(os.homedir(), ".office-addin-dev-certs");
const keyPath = path.join(certDir, "localhost.key");
const certPath = path.join(certDir, "localhost.crt");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  fail(`Build output not found: ${distDir}\nRun: npm run build`);
}

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  fail(
    `Dev certificates not found in ${certDir}\nRun: npm run dev:certs`
  );
}

function resolveRequestPath(urlPath) {
  const pathname = decodeURIComponent((urlPath || "/").split("?")[0]);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const absolutePath = path.resolve(distDir, `.${requested}`);

  if (!absolutePath.startsWith(distDir)) {
    return null;
  }
  return absolutePath;
}

const server = https.createServer(
  {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  },
  (req, res) => {
    const absolutePath = resolveRequestPath(req.url);
    if (!absolutePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(absolutePath, (statErr, stats) => {
      if (statErr) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const filePath = stats.isDirectory()
        ? path.join(absolutePath, "index.html")
        : absolutePath;

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": mimeTypes[ext] || "application/octet-stream",
          "Cache-Control": "no-cache",
        });
        res.end(content);
      });
    });
  }
);

server.listen(PORT, HOST, () => {
  console.log(`Local Word Copilot server running at https://${HOST}:${PORT}`);
  console.log("Keep this terminal open while using the add-in.");
});

