const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const fs = require("fs");

const isDev = process.env.NODE_ENV !== "production";

/**
 * Resolve Office Add-in dev certs for HTTPS devServer.
 * `office-addin-dev-certs install` places them under ~/.office-addin-dev-certs.
 * Falls back to webpack-dev-server's built-in self-signed cert when not found.
 */
function getHttpsConfig() {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const certDir = path.join(home, ".office-addin-dev-certs");
  const keyPath = path.join(certDir, "localhost.key");
  const certPath = path.join(certDir, "localhost.crt");
  const caPath = path.join(certDir, "ca.crt");

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const httpsOpts = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    if (fs.existsSync(caPath)) {
      httpsOpts.ca = fs.readFileSync(caPath);
    }
    return httpsOpts;
  }
  // Fallback: let webpack-dev-server generate a self-signed cert
  return true;
}

module.exports = {
  entry: {
    taskpane: "./src/taskpane/index.tsx",
    commands: "./src/commands/commands.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
    clean: true,
    // Ensure compatibility with older WebViews (IE11/EdgeHTML on Windows)
    environment: {
      arrowFunction: false,
      const: false,
      destructuring: false,
      forOf: false,
      module: false,
      optionalChaining: false,
      templateLiteral: false,
    },
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@helpers": path.resolve(__dirname, "src/helpers"),
      "@types": path.resolve(__dirname, "src/types"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/site/index.html",
      filename: "index.html",
      inject: false,
    }),
    new HtmlWebpackPlugin({
      template: "./src/site/en.html",
      filename: "en.html",
      inject: false,
    }),
    new HtmlWebpackPlugin({
      template: "./src/taskpane/index.html",
      filename: "taskpane.html",
      chunks: ["taskpane"],
    }),
    new HtmlWebpackPlugin({
      template: "./src/commands/commands.html",
      filename: "commands.html",
      chunks: ["commands"],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "assets",
          to: "assets",
          noErrorOnMissing: true,
        },
        {
          from: "word-copilot-local.xml",
          to: "word-copilot-local.xml",
        },
        {
          from: "scripts/install-sideload-mac.sh",
          to: "scripts/install-sideload-mac.sh",
        },
        {
          from: "scripts/install-sideload-windows.ps1",
          to: "scripts/install-sideload-windows.ps1",
        },
        {
          from: "scripts/install-sideload-windows.cmd",
          to: "scripts/install-sideload-windows.cmd",
        },
        {
          from: "scripts/local-https-server.js",
          to: "scripts/local-https-server.js",
        },
        {
          from: "scripts/local-runtime.js",
          to: "scripts/local-runtime.js",
        },
        {
          from: "scripts/start-local-mac.sh",
          to: "scripts/start-local-mac.sh",
        },
        {
          from: "scripts/start-local-windows.ps1",
          to: "scripts/start-local-windows.ps1",
        },
        {
          from: "scripts/start-local-windows.cmd",
          to: "scripts/start-local-windows.cmd",
        },
        {
          from: "README.md",
          to: "README.md",
        },
        {
          from: "README.en.md",
          to: "README.en.md",
        },
        {
          from: "CHANGELOG.md",
          to: "CHANGELOG.md",
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 3000,
    https: getHttpsConfig(),
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    hot: true,
  },
  devtool: isDev ? "source-map" : false,
  mode: isDev ? "development" : "production",
};
