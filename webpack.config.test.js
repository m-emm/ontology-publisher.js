var webpackConfiguration = require('./webpack.config')();
var _ = require('lodash');
var util = require('util');

const ttlPattern = '/\\.ttl$/';


// console.log('xxxxxxxx before: ' + util.inspect( webpackConfiguration.module.loaders));
_.remove(webpackConfiguration.module.loaders,function(elem){ 
	//if(elem.test && elem.test.toString)
		//console.log('***** ' + elem.test.toString() + '  ' + (elem.test.toString() == ttlPattern) );
	return elem.test && elem.test.toString() == ttlPattern});

webpackConfiguration.module.loaders.push({test: require.resolve('jquery'), loader: 'expose?$!expose?jQuery'});
webpackConfiguration.module.loaders.push({
	test : /\.ttl$/,
	loaders : [
			'raw-loader' ]
});


// console.log('xxxxxxxx after: ' + util.inspect( webpackConfiguration.module.loaders));

module.exports = webpackConfiguration;