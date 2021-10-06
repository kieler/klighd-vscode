const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");

const r = (location) => path.resolve(__dirname, location);

/** @type {webpack.Configuration} */
module.exports = {
    target: "web",
    mode: "none", // Leave source code as close as possible. Only set to production during distribution.

    entry: "./src/main.ts",
    output: {
        path: r("dist"),
        filename: "[contenthash].[name].js",
    },
    devtool: "nosources-source-map",

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },

    node: {
        net: "mock",
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
                            configFile: r("tsconfig.web.json"),
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.(otf|ttf|woff)$/i,
                loader: "file-loader",
                options: {
                    name: "[path][name].[ext]",
                }
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: "[contenthash].[name].css",
            chunkFilename: "[id].css",
        }),
        new HtmlWebpackPlugin({ template: "index.html", cache: false }),
    ],
};
