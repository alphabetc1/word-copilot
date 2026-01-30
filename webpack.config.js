const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const isDev = process.env.NODE_ENV !== "production";

module.exports = {
  entry: {
    taskpane: "./src/taskpane/index.tsx",
    commands: "./src/commands/commands.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
    clean: true,
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
          from: "manifest.xml",
          to: "manifest.xml",
        },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 3000,
    https: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    hot: true,
  },
  devtool: isDev ? "source-map" : false,
  mode: isDev ? "development" : "production",
};
