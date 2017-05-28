var webpack = require('webpack');
var webpackConfiguration = require('./webpack.config')();

webpackConfiguration.externals = {lodash: '_'};
webpackConfiguration.plugins.push(new webpack.SourceMapDevToolPlugin(
  '[file].map', null,
  '[absolute-resource-path]', '[absolute-resource-path]'
));

module.exports = webpackConfiguration;

