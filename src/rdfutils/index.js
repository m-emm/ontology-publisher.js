var util = require('util');
var _ = require('lodash');
var R = require('ramda');

var rdf_type = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
var rdf_subProperty = 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf';
var rdf_range = 'http://www.w3.org/2000/01/rdf-schema#range';
var rdf_domain = 'http://www.w3.org/2000/01/rdf-schema#domain';
var rdf_subClassOf = 'http://www.w3.org/2000/01/rdf-schema#subClassOf';
var owl_class = 'http://www.w3.org/2002/07/owl#Class';
var owl_transitive = 'http://www.w3.org/2002/07/owl#TransitiveProperty';
var owl_inverse = 'http://www.w3.org/2002/07/owl#inverseOf';
var owl_symmetric = 'http://www.w3.org/2002/07/owl#SymmetricProperty';
var owl_reflexive = 'http://www.w3.org/2002/07/owl#ReflexiveProperty';
var owl_objectProperty = 'http://www.w3.org/2002/07/owl#ObjectProperty';
var owl_equivalentClass = 'http://www.w3.org/2002/07/owl#equivalentClass';
var owl_namedIndividual = 'http://www.w3.org/2002/07/owl#NamedIndividual';
var owl_disjointWith ="http://www.w3.org/2002/07/owl#disjointWith";

function isSymmetric(store, subject) {
	return store.holds(subject, store.sym(rdf_type), store.sym(owl_symmetric));
}

function isReflexive(store, subject) {
	return store.holds(subject, store.sym(rdf_type), store.sym(owl_reflexive));
}


function getInverses(store, subject) {
	var statements = store.match(subject, store.sym(owl_inverse), undefined);
	var statements2 = store.match(undefined, store.sym(owl_inverse), subject);
	var retval = statements.map(function(elem) {
		return elem.object.value
	}).concat(statements2.map(function(elem) {
		return elem.subject.value
	}));
	if (isSymmetric(store, subject)) {
		retval.push(subject.value);
	}
	return retval;
}

function removeBrackets(text) {
	var retval = _.trimEnd(text, '>')
	if (retval.substr(0, 1) == '<') {
		retval = retval.substr(1);
	}
	return retval;
}

function getStatementObject(store, subject, predicate) {
	var statement = store.anyStatementMatching(subject, predicate, undefined);
	if (!statement || !statement.object || !statement.object.value)
		return null;
	return statement.object.value;
}

function getAnnotation(store, entity, annotation) {
	return getStatementObject(store, store.sym(removeBrackets(entity)), store.sym(annotation));
}

function getReadableRepresentation(store, entity) {
	var retval = {};
	var entityName = removeBrackets(entity);
	if (entity.value) {
		entityName = entity.value;
	}
	retval.name = entityName;
	retval.shortName = _.trimEnd(entityName.split('#')[1], '>')
	for ( var key in annotations) {
		var value = getAnnotation(store, entityName, annotations[key]);
		if (value) {
			retval[key] = value;
		}
	}
	return retval;
}

function topClass(store) {
	var currentClass = store.any(undefined, store.sym(rdf_type), store.sym(owl_class));
	while (true) {
		var statements = store.match(currentClass, store.sym(rdf_subClassOf), undefined);
		if (!statements || statements.length == 0)
			break;
		currentClass = statements[0].object;
	}
	return currentClass.value;
}

function subClasses(store, targetNode) {
	var statements = store.match(undefined, store.sym(rdf_subClassOf), targetNode);
	return R.map(R.path(['subject','value']),statements);
}

function recurseInheritanceTree(store, currentClass, done) {
	var retval = {
		iri : currentClass
	};
	var subClassList = subClasses(store, store.sym(currentClass));
	if (!subClassList || subClassList.length == 0 || done[currentClass]) {
		return retval;
	}
	// inheritance loop guard
	done[currentClass] = true;

	var subtreeConstruct = [];
	subClassList.forEach(function(element) {
		var subtree = recurseInheritanceTree(store, element, done);
		subtreeConstruct.push(subtree);
	});
	retval.subclasses = subtreeConstruct;
	return retval;
}

var annotations = {
	comment : 'http://www.w3.org/2000/01/rdf-schema#comment',
	label : 'http://www.w3.org/2000/01/rdf-schema#label',
	seeAlso : 'http://www.w3.org/2000/01/rdf-schema#seeAlso'
};

function getCommentAnnotation(store, entity) {
	return getAnnotation(store, entity, 'http://www.w3.org/2000/01/rdf-schema#comment');
}
function getLabelAnnotation(store, entity) {
	return getAnnotation(store, entity, 'http://www.w3.org/2000/01/rdf-schema#label');
}
function getSeeAlsoAnnotation(store, entity) {
	return getAnnotation(store, entity, 'http://www.w3.org/2000/01/rdf-schema#seeAlso');
}

function isIndividual(store, subject) {
	return store.holds(subject, store.sym(rdf_type), store.sym(owl_namedIndividual));
}

function isClass(store, subject) {
	return store.holds(subject, store.sym(rdf_type), store.sym(owl_class));
}

function isTransitive(store, subject) {
	return store.holds(subject, store.sym(rdf_type), store.sym(owl_transitive));
}

function getInverseProperties(store, subject) {
	var retval = [];
	var allProperties = store.match(undefined, store.sym(rdf_type), store.sym(owl_objectProperty));

	allProperties.forEach(function(elem) {
		var property = elem.subject.value;
		var inverses = getInverses(store, store.sym(property));

		if (inverses.length > 0) {
			var targeted = store.match(undefined, store.sym(property), subject);
			targeted.forEach(function(targetStatement) {
				inverses.forEach(function(inverseRelation) {
					retval.push({
						subject : subject,
						relation : inverseRelation,
						target : targetStatement.subject.value
					});
				});
			});
		}

	})
	return retval;
}

function getTransitiveTargets(store, start, relation) {
	var types = {};
	types[start.toNT()] = true;
	var result = store.transitiveClosure(types, relation);

	return _.toPairs(result).map(function(elem) {
		return elem[0]
	}).map(function(elem) {
		return _.trim(elem, '>').substring(1);
	});
}

function findEquivalentClasses(store, targetNode) {
	var equivalentMatchesForward = store.match(undefined, store.sym(owl_equivalentClass), targetNode);

	var equivalentMatchesNames = equivalentMatchesForward.map(function(elem) {
		return elem.subject.value.toString();
	});

	var equivalentMatchesBackward = store.match(targetNode, store.sym(owl_equivalentClass), undefined);

	var equivalentMatchesBackwardNames = equivalentMatchesBackward.map(function(elem) {
		return elem.object.value.toString()
	});

	var namesUnion = _.union(equivalentMatchesNames, equivalentMatchesBackwardNames);
	_.remove(namesUnion, function(elem) {
		return elem.toString() == targetNode.value.toString();
	});

	var inferredClasses = [];
	namesUnion.forEach(function(elem) {
		inferredClasses.push(store.sym(elem));
	});

	return inferredClasses;
}

function findMembers(store, targetNode, includeEquivalent) {

	var classes = [ targetNode ];
	if (includeEquivalent) {
			var equivalentMatchesForward = store.match(undefined, store.sym(owl_equivalentClass), targetNode);

		var equivalentMatchesNames = equivalentMatchesForward.map(function(elem) {
			return elem.subject.value.toString();
		});

		var equivalentMatchesBackward = store.match(targetNode, store.sym(owl_equivalentClass), undefined);

		var equivalentMatchesBackwardNames = equivalentMatchesBackward.map(function(elem) {
			return elem.object.value.toString()
		});

		var namesUnion = _.union(equivalentMatchesNames, equivalentMatchesBackwardNames);

		var inferredClasses = [];
		namesUnion.forEach(function(elem) {
			inferredClasses.push(store.sym(elem));
		});

		classes = _.union(classes, inferredClasses);

	}

	var retvalRaw = [];
	classes.forEach(function(elem) {
		var members = store.findMembersNT(elem);
		return retvalRaw.push(members);
	});

	var retvalPairs = _.flatten(retvalRaw.map(_.toPairs));

	var retval = _.map(retvalPairs, function(element) {
		return [ _.trimEnd(element[0], '>').substr(1), element[1], _.trimEnd(element[0].split('#')[1], '>') ];
	});
	return retval;

}

function shortName(uri) {
	return _.trimEnd(uri.split('#')[1], '>');
}

function properties(store) {
	var statements = store.match(undefined, store.sym(rdf_type), store.sym(owl_objectProperty));
	return _.map(statements, function(statement) {
		return statement.subject.value;
	});
}

function classes(store) {
	var statements = store.match(undefined, store.sym(rdf_type), store.sym(owl_class));
	return _.map(statements, function(statement) {
		return statement.subject.value;
	});
}
function individuals(store) {
	var statements = store.match(undefined, store.sym(rdf_type), store.sym(owl_namedIndividual));
	return _.map(statements, function(statement) {
		return statement.subject.value;
	});
}
function range(store, property) {
	var statement = store.anyStatementMatching(store.sym(property), store.sym(rdf_range), undefined);
	if (!statement || !statement.object || !statement.object.value)
		return null;
	return statement.object.value;
}
function domain(store, property) {
	var statement = store.anyStatementMatching(store.sym(property), store.sym(rdf_domain), undefined);
	if (!statement || !statement.object || !statement.object.value)
		return null;
	return statement.object.value;
}
function allSubClasses(store, targetNode) {
	var subtypes = _.toPairs(store.findSubClassesNT(targetNode));
	subtypes = _.map(subtypes, function(element) {
		return getReadableRepresentation(store, element[0]).name;
	});
	_.remove(subtypes, function(element) {
		return (element === targetNode.value);
	});
	return subtypes;
}

function superClasses(store, targetNode) {
	var statements = store.match(targetNode, store.sym(rdf_subClassOf), undefined);
	return _.map(statements, function(statement) {
		return statement.object.value;
	});
}
function individualsOfClass(store, targetName) {
	var statements = store.match(undefined, store.sym(rdf_type), store.sym(targetName));
	var retval = [];
	statements.forEach(function(element) {
		if (store.holds(element.subject, store.sym(rdf_type), store.sym(owl_namedIndividual))) {
			retval.push(element.subject.value);
		}
	});
	return retval;
}
function typesOfIndividual(store, targetName) {
	var statements = store.match(store.sym(targetName), store.sym(rdf_type), undefined);
	var retval = [];
	statements.forEach(function(element) {
		if (store.holds(element.object, store.sym(rdf_type), store.sym(owl_class))) {
			if (element.object.value !== targetName) {
				retval.push(element.object.value);
			}
		}
	});
	return retval;
}




function propertyEdges(store, property,options) {
	options = options || {};
	var statements = store.match(undefined, store.sym(property), undefined);
	var retval = [];
	var nodes = {};
	var edgekeys = {};
	var propertyIsSymmetric = isSymmetric(store,store.sym(property));
	var propertyIsReflexive = isReflexive(store,store.sym(property));
	
	
	statements.forEach(function(element) {
		if(options.transitiveClosure) {
			nodes[element.subject.value] = true;
			nodes[element.object.value] = true;
		}
		retval.push({
			subject : element.subject.value,
			object : element.object.value
		});
		if(options.inferSymmetric && propertyIsSymmetric && element.subject.value !== element.object.value) {
			retval.push({
				subject : element.object.value,
			    object : element.subject.value,
			    inferred : true
			});
			edgekeys[element.object.value +element.subject.value ] = true;
		}
		
		edgekeys[element.subject.value +element.object.value ] = true;
	});
	
	
	if(options.inferInverses) {
		var inverses = R.map(R.bind(store.sym,store),getInverses(store, store.sym(property)));		
		var inverseStatements  = R.unnest(R.map(R.curry(R.bind(store.match,store))(undefined,R.__,undefined,undefined),inverses));
		inverseStatements.forEach(function(element) {
			if(options.transitiveClosure) {
				nodes[element.object.value] = true;
				nodes[element.subject.value] = true;
			}
			if(! edgekeys[element.object.value +element.subject.value ]) {
				retval.push({
					subject : element.object.value,
					object : element.subject.value,
					inferred: true
				});
			}
			if(options.inferSymmetric && propertyIsSymmetric && element.subject.value !== element.object.value) {
				if(! edgekeys[element.subject.value +element.object.value ]) {
				retval.push({
					subject : element.subject.value,
				    object : element.object.value,
				    inferred : true
				});
				edgekeys[element.subject.value +element.object.value ] = true;
				}
			}
			
			edgekeys[element.object.value +element.subject.value ] = true;
		});
		
		
	}

	
	
	if(isTransitive(store,store.sym(property))) {
	if(options.transitiveClosure) {
		var numNodes = R.keys(nodes).length;
		var graphMatrix = R.compose(R.map(R.repeat(false)),R.apply(R.repeat),R.repeat(R.__,2))(numNodes);
		var nodesIndex = R.map((x) => Number(x),R.invertObj(R.keys(nodes)));
		var edgesIndex = R.map(R.apply(R.__,[nodesIndex]),R.map(R.props,R.map(R.props(['subject','object']),retval)));
		
		var adjacencyList = R.repeat([],numNodes);
		adjacencyList = R.reduce((acc,value) => R.adjust((x) => R.append(Number(value[1]),x),Number(value[0]),acc),adjacencyList ,edgesIndex);
				
		function graphMatrixValue(i,j) {
			return graphMatrix[i][j];
		}

		function DepthFirstSearch(s,v) {
			graphMatrix[s][v] = true;			
			R.forEach(R.when(R.complement(R.curry(graphMatrixValue)(s)),R.curry(DepthFirstSearch)(s)),adjacencyList[v]);			
		}
				
		R.map(R.apply(DepthFirstSearch),R.map(R.repeat(R.__,2),R.values(nodesIndex)));
		
		
		var trueEntries = R.map(R.compose(R.map(Number),R.prop('true'),R.invert),graphMatrix)
		var mapIndexed = R.addIndex(R.map);
		var newEdgesRaw = R.unnest(mapIndexed((val,idx) => R.xprod([idx],val) ,trueEntries));
		var removeSelfReference = R.reject((x) => x[0] === x[1]);
		var newEdges = propertyIsReflexive ? newEdgesRaw : removeSelfReference(newEdgesRaw);
		
		var newEdgesIriBased = R.map(R.props(R.__,R.keys(nodes)),R.sortBy(R.prop(0),newEdges));
		
		var newEdgesObjects = R.map(R.zipObj(['subject','object']),newEdgesIriBased);		
		var retvalWithoutInfer = R.map(R.zipObj(['subject','object']),R.map(R.props(['subject','object']),retval));
		var addedEdges = R.differenceWith(R.equals,newEdgesObjects,retvalWithoutInfer);		
		var addedEdgesWithInfer = R.map(R.merge({inferred:true}),addedEdges);		
		retval = R.concat(retval,addedEdgesWithInfer);		
		
	}
	}
	
	
	return retval;
}

function disjointWithClasses(store,targetClassName) {
		var statements = store.match(undefined, store.sym(owl_disjointWith), store.sym(targetClassName));
		var backwardStatements = store.match( store.sym(targetClassName), store.sym(owl_disjointWith),undefined);
		var retval = [];	
		statements.forEach(function(element) {
			retval.push(element.subject.value);
		});
		backwardStatements.forEach(function(element) {
			retval.push(element.object.value);
		});				
		return retval;
	}

function pathToTop(store, targetIri) {
	var retval = [];
	var currentClass = store.sym(targetIri);
	while (true) {
		var statements = store.match(currentClass, store.sym(rdf_subClassOf), undefined);
		if (!statements || statements.length == 0) {
			statements = store.match(currentClass, store.sym(rdf_type), undefined);
		}
		if (!statements || statements.length == 0)
			break;
		currentClass = statements[0].object;
		if ((owl_class !== currentClass.value) && (owl_namedIndividual !== currentClass.value)) {
			retval.push(currentClass.value);
		}
	}
	return retval;
}

function inheritanceTree(store, _rootClass) {
	var rootClass = _rootClass || topClass(store);
	return recurseInheritanceTree(store, rootClass, {});
}

module.exports = {

	getCommentAnnotation : getCommentAnnotation,
	getLabelAnnotation : getLabelAnnotation,
	getSeeAlsoAnnotation : getSeeAlsoAnnotation,

	getReadableRepresentation : getReadableRepresentation,

	isIndividual : isIndividual,

	isClass : isClass,

	isTransitive : isTransitive,
	isSymmetric : isSymmetric,

	getInverses : getInverses,

	getInverseProperties : getInverseProperties,

	getTransitiveTargets : getTransitiveTargets,

	findEquivalentClasses : findEquivalentClasses,

	findMembers : findMembers,

	shortName : shortName,

	properties : properties,

	classes : classes,
	individuals : individuals,
	range : range,
	domain : domain,
	allSubClasses : allSubClasses,
	subClasses : subClasses,
	superClasses : superClasses,
	individualsOfClass : individualsOfClass,
	typesOfIndividual : typesOfIndividual,

	propertyEdges : propertyEdges,

	removeBrackets : removeBrackets,

	topClass : topClass,

	pathToTop : pathToTop,

	inheritanceTree : inheritanceTree,
	disjointWithClasses:disjointWithClasses

}