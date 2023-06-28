const path = require("path")
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: './src/bundle.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, "dist")
    },
    module: {
        rules: [
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