//@ts-check

"use strict";

const path = require("path");
const webpack = require("webpack");

// Webpack Documentation: https://webpack.js.org/concepts/

/**
 * Config that is used to bundle the extension part of the codebase.
 * @type {import('webpack').Configuration}
 */
const extensionConfig = {
    name: "extension",
    target: "node",
    mode: "none", // Leave source code as close as possible. Only set to production during distribution.

    entry: "./src/extension.ts",
    output: {
        filename: "extension.js",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "commonjs2",
    },
    devtool: "nosources-source-map",
    externals: {
        // the vscode-module is created on-the-fly and must be excluded.
        vscode: "commonjs vscode",
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            onlyCompileBundledFiles: true,
                            compilerOptions: {
                                outDir: "dist",
                                declaration: true,
                                declarationMap: true,
                            },
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ["css-loader"],
            },
            {
                test: /\.(ttf)$/,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [new webpack.WatchIgnorePlugin({
        paths: [/\.d\.ts$/]
    })],
};

/**
 * Config that is used to bundle the webview part of the codebase. In contrast
 * to the extension, the webview runs in an iframe inside VS Code. Therefore,
 * it has to target the web as the name suggests. Otherwise the produced code
 * contains `module.exports` (commonJS Modules) calls which are only defined in Node.
 * @type {import('webpack').Configuration}
 */
const webviewConfig = {
    name: "webview",
    target: "web",
    mode: "none", // Leave source code as close as possible. Only set to production during distribution.

    entry: "./src-webview/main.ts",

    output: {
        filename: "webview.js",
        path: path.resolve(__dirname, "pack"),
    },
    devtool: "eval-source-map",

    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(ttf)$/,
                type: 'asset/resource',
            },
            {
                test: /node_modules[\\/]antlr4[\\/].*\.mjs$/,
                resolve: {
                    fullySpecified: false
                }
            }
        ],
    },
    plugins: [new webpack.WatchIgnorePlugin({
        paths: [/\.d\.ts$/]
    })],
};

module.exports = (env = {}) => {
    const staging = env.instrumentedOutput;
    extensionConfig.plugins.push(new webpack.DefinePlugin({ KLIGHD_INSTRUMENTED: Boolean(staging) }));
    if (typeof staging === "string") {
        extensionConfig.output.path = path.join(staging, "dist");
        webviewConfig.output.path = path.join(staging, "pack");
        // The VSIX compresses both bundles. Skip the memory-intensive minifier for this build.
        extensionConfig.optimization = { minimize: false };
        webviewConfig.optimization = { minimize: false };
        webviewConfig.plugins.push(new webpack.NormalModuleReplacementPlugin(
            /^\.\/instrumentation$/,
            path.resolve(__dirname, "../../packages/klighd-instrumentation/lib/vscode-webview.js")
        ));
    }
    return [extensionConfig, webviewConfig];
};
