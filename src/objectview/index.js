
import rdfutils from '../rdfutils';

require('./index.html');


export default function($routeParams,$location,$timeout,owlservice,storageservice) {
	var vm = this;
	
	if ($routeParams.ontologyName) {
		vm.ontologyName = $routeParams.ontologyName;
	}
	vm.uri = $routeParams.uri;	

	if (!vm.ontologyName) {
		if(owlservice.ontologyLoaded() &&  owlservice.getName()) {
			var newPath = '/objectview/' + owlservice.getName();
			$location.path(newPath);
			return;
		}
		var ontologies = storageservice.getOntologiesList();
		if (ontologies.length > 0) {
			var suffix = '';
			if(vm.uri) {
				suffix = '/'+vm.uri;
			}
			$location.path('/objectview/' + ontologies[0].name + suffix);
		}
	}
	if (vm.ontologyName && ( vm.ontologyName !== owlservice.getName())) {
		var ontologyObject = storageservice.loadOntology(vm.ontologyName);
		if (ontologyObject && ontologyObject.ontologyText) {
			owlservice.setOntologyText(vm.ontologyName, ontologyObject.ontologyText);
		}
	}
	    
    	if(!vm.uri && owlservice.ontologyLoaded() && vm.ontologyName) {
    		
    		var topClass = rdfutils.topClass(owlservice.store());
    		var aClass = topClass.split('#')[1];
    		$location.path('/objectview/' + vm.ontologyName +'/'+ aClass);
    		
    	}	else {
    		var objectInfo = owlservice.getObjectInfo(vm.uri);
        	Object.assign(vm,objectInfo);	
    	}	
    	
    	
	        
	    
		
	function getStatementObject(subject,predicate) {
		var statement = vm.store.anyStatementMatching(subject,predicate,undefined);
		if(!statement || !statement.object || !statement.object.value ) return null;
		return statement.object.value;
	}
	
	function shortName(uri) {
		return _.trimEnd(uri.split('#')[1],'>');
	}
	
	
	

	    
}

