var http = require('http')
   ,express = require('express')
   ,util=require('util');

var port = 43210;


var app = express();
var staticAssets = express.static('static');

var staticAssets = [
{ source:'static', target:'/' }                                      
                     ];

staticAssets.forEach(function(element) {
	console.log("Adding " + element.source + " under " + element.target);
	app.use(element.target,express.static(element.source));	
});


app.listen(port,function(){
	console.log("app listening on " + port );	
});







