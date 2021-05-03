const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

/** @type {webpack.Configuration} */
module.exports = {
  mode: "development",
  devtool: "inline-source-map",

  entry: "./src/main.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.bundle.js",
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  target: 'web',
  node: {
    net: 'mock',
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{
          loader: 'ts-loader',
          options: {
              configFile: path.resolve(__dirname, 'tsconfig.web.json')
          }
      }]
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: "index.html" })],
};
