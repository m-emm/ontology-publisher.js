var webpackConfig = require('./webpack.config.test.js');

var webpack = require('webpack');
var DebugWebpackPlugin = require('debug-webpack-plugin');


var util = require('util');
const path = require('path');

var debugPluginConf = new DebugWebpackPlugin({

	// Defaults to ['webpack:*'] which can be VERY noisy, so try to be
	// specific
	scope : [ 'webpack:compiler:*', // include compiler logs
	'webpack:plugin:*' // include a specific plugin's logs
	],

	// Inspect the arguments passed to an event
	// These are triggered on emits
	listeners : {
		'webpack:compiler:emit' : function(thing) {
			// console.log(util.inspect(thing,{depth:1}));
			console.log('***************** ' + path.resolve('/_karma_webpack_/'));
			// Read some data out of the compiler
		}
	},
	// Defaults to the compiler's setting
	debug : true
});

webpackConfig.entry = {};
webpackConfig.plugins = [new webpack.ProvidePlugin({
    _: require.resolve('lodash'),
    $rdf : require.resolve('./src/rdf_seed.js')
})
// , debugPluginConf
];


module.exports = function (config) {
  config.set({
    basePath: './src',
    frameworks: ['jasmine'],
    files: [
      'test.js',
      '**/*.spec.js'
    ],
    preprocessors: {
    	 './config/karma-test-shim.js': ['webpack', 'sourcemap'],
      'test.js': ['webpack'],
      '**/*.spec.js': ['webpack']
    },
    browsers: ['Chrome'],
    webpack: webpackConfig,
    singleRun: true
  });
};