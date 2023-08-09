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
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: '',
                    publicPath: '..',
                    postTransformPublicPath: (p) => `__webpack_public_path__ + ${p}`,
                }
            },
        ],
    },
    plugins: [new webpack.WatchIgnorePlugin({
        paths: [/\.*\.d\.ts$/]
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
    target: "web",
    mode: "none", // Leave source code as close as possible. Only set to production during distribution.

    entry: "./src-webview/main.ts",

    output: {
        filename: "webview.js",
        path: path.resolve(__dirname, "dist"),
    },
    devtool: "nosources-source-map",

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
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: '',
                    publicPath: '..',
                    postTransformPublicPath: (p) => `__webpack_public_path__ + ${p}`,
                }
            },
        ],
    },
    plugins: [new webpack.WatchIgnorePlugin({
        paths: [new RegExp(/\.d\.ts$/)]
      })],
};

/**@type {import('webpack').Configuration}*/
const graphPropertiesWebview = {
    target: 'web',
    mode: "none", // Leave source code as close as possible. Only set to production during distribution.


    entry: path.resolve(__dirname, 'src-graph-properties-view/graph-properties.ts'), //** ehem. TODO */
    output: {
		filename: 'graph-properties-webview.js',
        path: path.resolve(__dirname, "dist"),
    },
    devtool: "nosources-source-map",

    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['ts-loader']
            },
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre'
            },
            {
                test: /\.css$/,
                exclude: /\.useable\.css$/,
                use: ['style-loader', 'css-loader']
            },
        ]
    }
};

module.exports = [extensionConfig, webviewConfig, graphPropertiesWebview];
