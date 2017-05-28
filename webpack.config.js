
var path = require('path');
var fs = require('fs-extra');
var webpack = require('webpack');
var WebpackShellPlugin = require('webpack-shell-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var IndexHtmlPlugin = require('indexhtml-webpack-plugin');
var cssExtractPlugin = new ExtractTextPlugin('styles/[contenthash:16].css');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var DebugWebpackPlugin = require('debug-webpack-plugin');
var path = require('path');

var codeFolderPath = 'src';
var version = require('./version.json');

var webpackConfiguration = {
	context : __dirname,
	entry : {
		app : [ './' + codeFolderPath + '/index.js' ]
	},
	output : {
		path : path.join(__dirname, 'static/'),
		filename : 'ontology-publisher.js'
	},
	module : {
		loaders : [
				{
					test : /^index\.html$/,
					loader : 'html'
				},
				{
					test : /\.css$/,
					loader : cssExtractPlugin.extract('style', 'css', {publicPath: '/' })
				},
				{
					test : /\.js$/,
					loader : 'babel-loader'
				},
				{
					test : /\.json$/,
					loader : 'json-loader'
				},
				{
					test : /\.html$/,
					loaders : [
//							"file-loader?context=src&name=[path][name].[ext]"
'raw-loader'
//							,"extract-loader"
//							, 'html' 
							]
				},
				{
					test : /\.ttl$/,
					loaders : [ 'raw-loader'
//							"file-loader?context=src&name=[path][name].[ext]"
//							,"extract-loader",'raw-loader' 
							]
				},
				{
					test : /\.png$/,
					loaders : [ 'file-loader']
				}, {
					test : /(\.(?:eot|woff|woff2|ttf|svg))/,
					loader : 'file-loader?name=font/[name].[ext]'
				}
				
				]
	},
	plugins : [ 
	        	
	           new webpack.ProvidePlugin({
	               _: require.resolve('lodash'),
	               $rdf : require.resolve('./src/rdf_seed.js')
	           }),
	           
	            cssExtractPlugin, new ExtractTextPlugin("[name].css")

	, new DebugWebpackPlugin({

		// Defaults to ['webpack:*'] which can be VERY noisy, so try to be
		// specific
		scope : [ 'webpack:compiler:*', // include compiler logs
		'webpack:plugin:*' // include a specific plugin's logs
		],

		// Inspect the arguments passed to an event
		// These are triggered on emits
		listeners : {
			'webpack:compiler:run' : function(compiler) {
				// Read some data out of the compiler
			}
		},
		// Defaults to the compiler's setting
		debug : true
	}), new HtmlWebpackPlugin({
		inject : false,
		template : require('path').join(__dirname, './src/roottemplate.ejs') // require('html-webpack-template'),
		,
		title : "Ontology Browser and Visualizer",
		hash : true,
		version : 'Version ' + version.gitCommit + ' built ' + new Date() + ' on ' + version.buildHost
	}),new webpack.ProvidePlugin({
		d3: "d3"
	})],
	resolve : {
		alias : {
			xmlhttprequest : __dirname + '/' + codeFolderPath
					+ '/xmlhttprequest_shim.js'
             ,resources: path.resolve(__dirname, './src/resources')
		}
	}
};

module.exports = function(onBuildEndScripts) {

	return webpackConfiguration;
};
