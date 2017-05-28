
var objectviewTemplate =  require('./objectview/index.html');
var graphTemplate =  require('./graph/index.html');
var adminTemplate =  require('./admin/index.html');


export default	function config($routeProvider) {
		$routeProvider.
		when('/objectview/:ontologyName', {
			template: objectviewTemplate		
		}).when('/objectview/:ontologyName/:uri', {
			template: objectviewTemplate
		}).when('/graph/:ontologyName/:view', {
			template: graphTemplate
		}).when('/graph/:ontologyName', {
			template: graphTemplate
		}).when('/admin', {
			template: adminTemplate
		}).when('/graph', {
			template: graphTemplate
		}).when('/objectview', {
			template: objectviewTemplate		
		}).otherwise({
			redirectTo : '/graph'
		});

	}

