import path from "node:path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import type webpack from "webpack";
import "webpack-dev-server";

const config: webpack.Configuration = {
	mode: "development",
	entry: ["./src/index.ts", "./src/styles.css"],
	output: {
		filename: "bundle.js",
		path: path.resolve(process.cwd(), "dist"),
		clean: true,
		library: "WarhammerCalc",
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
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "./src/index.html",
			filename: "index.html",
		}),
	],
	devServer: {
		port: 3000,
		hot: true,
		open: true,
	},
	devtool: "source-map",
};

export default config;
