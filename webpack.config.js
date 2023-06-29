const path = require("path")
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: './src/bundle.js',
    mode: process.env.WEBPACK_MODE === 'production' ? 'production' : 'development',
    devtool: 'source-map',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, "dist")
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                include: /node_modules/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                         presets: ["@babel/preset-env"],
                         targets: [">0.25%"],
                         plugins: [
                            [
                                "prismjs",
                                {
                                    languages: [
                                    "applescript",
                                    "bash",
                                    "javascript",
                                    "lua",
                                    "markup",
                                    "php",
                                    "ruby",
                                    "vim",
                                    "yaml"
                                ],
                                plugins: [],
                                css: true,
                            }],
                        ],
                    },
                },
            },
            {
                test: /\.s[ac]ss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: "src/assets/images",
                    to: "img"
                }
            ]
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, "dist"),
        },
        compress: true,
        port: 8001,
        devMiddleware: {
            writeToDisk: true,
        },
        client: {
            overlay: false,
        },
    }
};