const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");

const r = (location) => path.resolve(__dirname, location);

/** @type {webpack.Configuration} */
module.exports = {
    mode: "development",
    devtool: "source-map",

    entry: "./src/main.ts",
    output: {
        path: r("dist"),
        filename: "[contenthash].[name].js",
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    target: "web",
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
                            transpileOnly: true,
                            configFile: r("tsconfig.web.json"),
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: (resourcePath, context) => {
                                // publicPath is the relative path of the resource to the context
                                // e.g. for ./css/admin/main.css the publicPath will be ../../
                                // while for ./css/main.css the publicPath will be ../
                                return path.relative(path.dirname(resourcePath), context) + "/";
                            },
                        },
                    },
                    "css-loader",
                ],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: "[contenthash].[name].css",
            chunkFilename: "[id].css",
        }),
        new HtmlWebpackPlugin({ template: "index.html" }),
    ],
};
