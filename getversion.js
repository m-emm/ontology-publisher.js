var git = require('git-rev');
 
var jsonfile = require('jsonfile');
const os = require('os');

git.long(function (str) {
	jsonfile.writeFileSync('./version.json', { gitCommit: str, buildHost: os.hostname() });
	console.log('wrote ' +  str + ' to version.js')

})