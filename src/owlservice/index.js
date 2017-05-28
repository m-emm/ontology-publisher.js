var rdfutils = require('../rdfutils');

module.exports = function() {
	var service = this;
	service.store = $rdf.graph();


	
	function setOntologyText(name,text,id) {
		service.id = id;
		service.name = name;
		service.loaded = true;
		var mimeType = 'text/turtle';
		var rootUri = /^ *<([^>]+)>/m.exec(text)[1];
		service.store = $rdf.graph();
		service.rootUri  = rootUri;
		service.ontologyText = text;
		try {
			$rdf.parse(text, service.store, rootUri, mimeType);
			service.isLoaded = true;
		} catch (err) {
			console.log(err);
			throw err;
		}
	}

	function getObjectInfo(uri) {

		var retval = {};

		retval.fullUri = service.rootUri + '#' + uri;

		var targetNode = $rdf.sym(retval.fullUri);

		retval.isIndividual = rdfutils.isIndividual(service.store, targetNode);
		
		if(retval.isIndividual){
			retval.typesOfIndividual = rdfutils.typesOfIndividual(service.store,targetNode.value);
			retval.typesOfIndividual = _.map(retval.typesOfIndividual, function(element) {
				return rdfutils.getReadableRepresentation(service.store, element);
			});			
		}		
		retval.isClass = rdfutils.isClass(service.store, targetNode);
		retval.representation = rdfutils.getReadableRepresentation(service.store, targetNode);
		
		retval.supertypes = rdfutils.pathToTop(service.store,targetNode.value);
		retval.supertypes = _.map(retval.supertypes, function(element) {
			return rdfutils.getReadableRepresentation(service.store, element);
		});
		_.remove(retval.supertypes, function(element) {
			return (element.name === targetNode.value);
		});

		if (retval.isClass) {
			retval.equivalents = rdfutils.findEquivalentClasses(service.store, targetNode);
			retval.equivalents = _.map(retval.equivalents, function(element) {
				return {
					full : element.value,
					short : element.value.split('#')[1]
				};
			});
		}

		retval.members = rdfutils.findMembers(service.store, targetNode, true);		

		retval.subtypes = _.toPairs(service.store.findSubClassesNT(targetNode));
		retval.subtypes = _.map(retval.subtypes, function(element) {
			return rdfutils.getReadableRepresentation(service.store, element[0]);
		});
		_.remove(retval.subtypes, function(element) {
			return (element.name === targetNode.value);
		});
		retval.subtypes = _.sortBy(retval.subtypes, 'shortName');

		retval.comment = getStatementObject(targetNode, service.store.sym('http://www.w3.org/2000/01/rdf-schema#comment'));// service.store.anyStatementMatching(targetNode,service.store.sym('http://www.w3.org/2000/01/rdf-schema#comment'),undefined).object.value;
		retval.label = getStatementObject(targetNode, service.store.sym('http://www.w3.org/2000/01/rdf-schema#label'))
				|| uri;

		retval.localProperties = _.filter(service.store.match(service.store.sym(retval.fullUri), undefined, undefined),
				function(elem) {
					return elem.predicate.value.indexOf(service.rootUri + '#') >= 0;
				}).map(function(elem) {
			var retval = {
				predicate : elem.predicate.value,
				object : elem.object.value,
				shortPredicate : shortName(elem.predicate.value),
				short : shortName(elem.object.value)
			};
			return retval;
		});

		var inversePropertiesRaw = rdfutils.getInverseProperties(service.store, service.store.sym(retval.fullUri));
		retval.inverseProperties = [];
		inversePropertiesRaw.forEach(function(elem) {
			retval.inverseProperties.push({
				inferred : true,
				object : elem.target,
				predicate : elem.relation,
				shortPredicate : shortName(elem.relation),
				short : shortName(elem.target)
			});
		});

		retval.inverseAndlocalProperties = retval.localProperties.concat(retval.inverseProperties);

		retval.inferredProperties = [];

		retval.inverseAndlocalProperties.forEach(function(elem) {
			if (rdfutils.isTransitive(service.store, service.store.sym(elem.predicate))) {
				var inferredProperties = rdfutils.getTransitiveTargets(service.store, service.store.sym(retval.fullUri),
						service.store.sym(elem.predicate));
				inferredProperties.forEach(function(inner) {
					if (elem.object !== inner && retval.fullUri != inner) {
						retval.inferredProperties.push({
							predicate : elem.predicate,
							object : inner,
							shortPredicate : shortName(elem.predicate),
							short : shortName(inner),
							inferred : true
						});
					}
				});
			}
		});

		retval.allProperties = retval.localProperties.concat(retval.inferredProperties).concat(retval.inverseProperties);
		retval.allProperties = _.uniqBy(retval.allProperties, function(elem) {
			return '' + elem.predicate + elem.object;
		});

		return retval;
	}

	function getStatementObject(subject, predicate) {
		var statement = service.store.anyStatementMatching(subject, predicate, undefined);
		if (!statement || !statement.object || !statement.object.value)
			return null;
		return statement.object.value;
	}

	function shortName(uri) {
		return rdfutils.shortName(uri);
	}
	
	function ontologyText() {
		return service.ontologyText;
	}
	
	function getTurtleText() {
		return store.serialize(service.rootUri,"text/turtle");
	}
	
	function getStore() {
		return service.store;
	}
	
	function getRootUri() {
		return service.rootUri;
	}
	
	function getName() {
		return service.name;
	}
	
	function getId() {
		return service.id;
	}

	
	function ontologyLoaded() {
		return service.isLoaded;
	}

	var retval = {
		store : getStore ,
		getStatementObject : getStatementObject,
		shortName : shortName,
		getObjectInfo:getObjectInfo,
		rootUri : getRootUri,
		setOntologyText:setOntologyText,
		ontologyText:ontologyText,
		getTurtleText:getTurtleText,
		getName:getName,
		ontologyLoaded : ontologyLoaded,
		getId:getId
	};
	return retval;

}
