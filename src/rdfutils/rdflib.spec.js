require('../testutils');

import ontology from './test_family.ttl'; // in the test setup, this will
											// resolve to the text
							        // contents of the ontology

import _ from 'lodash';

import rdfutils from './';

var util = require('util');
var R = require('ramda');

const testRelation = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#isChildOf';
const inverseTestRelation = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#isParentOf';
const testTransitiveRelation = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#livesWith';
const livesWith = testTransitiveRelation;
const testSymmetricRelation = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#isSpouseOf';

const manClass = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Man';
const ginny = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Ginny';
const bert = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Bert';
const gram = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Gram';

const barky = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Barky';

const angela = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Angela';

const rootClass = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#TestFamilyConcept';
 

let store;

function filterByString(arr,string) {
	return _.filter(arr,function(elem){return elem.toString() == string; });
}

describe('ontology', function () {
	
	
	 beforeEach(function() {
		  store = $rdf.graph();
		  var url = 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family';
		    var mimeType = 'text/turtle';
		    try {
		    $rdf.parse(ontology,store,url,mimeType);
		    } catch(err) {
		    	console.log('*** Parse err:' +err);
		    	throw err;
		    }
	    });
	 
	 it('should find the inverse of relation', function () {
		    
		    var targetNode = $rdf.sym(testRelation);
			
			var result = rdfutils.getInverses(store,targetNode);
			
	        expect(result.length).toBe(1);
	        expect(result[0].toString()).toBe(inverseTestRelation);
	        
	        var result2 = rdfutils.getInverses(store,store.sym(inverseTestRelation));
	        expect(result2.length).toBe(1);
	        expect(result2[0].toString()).toBe(testRelation);

			console.log('Result: '+util.inspect(result));						
		    

	    });
	 
	 it('should be able to tell transitive relations from non-transitive ones', function () {
		    
		    var transitiveNode = $rdf.sym(testTransitiveRelation);
		    var nonTransitiveNode = $rdf.sym(testRelation);
			
			expect(rdfutils.isTransitive(store,transitiveNode)).toBe(true);
			expect(rdfutils.isTransitive(store,nonTransitiveNode)).toBe(false);
								    

	    });
	 
	 it('should be able to follow transitive relations', function () {
		    
		    var transitiveNode = $rdf.sym(livesWith);  
		    var startNode =  $rdf.sym(ginny);		    
		    
		    var result = rdfutils.getTransitiveTargets(store,startNode,transitiveNode);
		    console.log('Transitive closure: ' + util.inspect(result));
		    console.log(_.filter(result,function(elem) { return elem.toString() == 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Bert';}))
		    
		    expect(filterByString(result,'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Bert').length).toBe(1); 		    
		    expect(_.filter(result,function(elem) { return elem.toString() == 'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Angela';}).length).toBe(1); 
	    });
	 
	 it('should be able to find inverse properties', function () {
		    
		    var startNode =  $rdf.sym('https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Angela');// $rdf.sym('https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Man');//
		    
		    var result = rdfutils.getInverseProperties(store,startNode);
		    console.log('Inverse relations: ' + util.inspect(result));

	    });
	 
	 
	 it('should be able to find members of a class', function () {
		    
		    var startNode =  $rdf.sym('https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Person');		    
		    
		    var result = rdfutils.findMembers(store,startNode).map(function(elem){return elem[0];});
		    
		    expect(filterByString(result,ginny).length).toBe(1);
		    console.log('Members: ' + util.inspect(result));

	    });
	 
	 it('should be able to find an equivalent class', function () {
		    var residence =  $rdf.sym('https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Residence');		    
		    var house =  $rdf.sym('https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#House');
		    var resEquiv = rdfutils.findEquivalentClasses(store,residence);
		    console.log('equivalent to residence: ' + util.inspect(resEquiv));
		    var houseEqiv = rdfutils.findEquivalentClasses(store,house);
		    console.log('equivalent to house: ' + util.inspect(houseEqiv));
		    expect(resEquiv[0].value.toString()).toBe(house.value.toString());
		    expect(houseEqiv[0].value.toString()).toBe(residence.value.toString());

	 });

	 
	 it('should be able to find members of an equivalent class', function () {
		    
		    var startNode =  $rdf.sym('https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#Residence');		    
		    
		    var result = rdfutils.findMembers(store,startNode,true);
		    
		    console.log('Members of equiv: ' + util.inspect(result));

	    });
	 
	 it('should find the root class', function () {		    		    
		    var result = rdfutils.topClass(store);
		    expect(result).toBe(rootClass);		    
	    });
	 
	 it('should determine the inheritance tree', function () {		    		    
		    var result = rdfutils.inheritanceTree(store);
		    console.log(util.inspect(result,{depth:null}));
		    var result2 = rdfutils.inheritanceTree(store,'https://github.com/m-emm/ontology-publisher.js/ontologies/test/family#FemalePerson');
		    console.log(util.inspect(result2,{depth:null}));

	    });	 
	 
	 function holdsEdge(edge) {
		 var extractStatement  = R.props(['subject', 'object']);
		 var checker = R.compose(R.equals(edge),extractStatement);
		 return checker;
	 }
	 
	 function hasEdges(mustHold,result) {
		 var checkerArray = R.map(R.any,R.map(holdsEdge,mustHold)); 
		 var allResults = R.ap(checkerArray,[result]);
		 return allResults;
	 }
	 
	 it('should determine transitively closed property edges', function () {		    		    
		 var result = rdfutils.propertyEdges(store,testTransitiveRelation,{transitiveClosure:true,inferSymmetric:true});	
		 
		 var extractStatement  = R.props(['subject', 'object']);
		 
		 var mustHold = [[bert,barky],[barky,bert],[barky,angela],[angela,barky],[angela,ginny]];		 
		 expect(R.all(R.identity,hasEdges(mustHold,result))).toBe(true);
		 		 
		 var mustNotHold = [[barky,gram],[bert,gram],[ginny,gram]];
		 expect(R.any(R.identity,hasEdges(mustNotHold,result))).toBe(false);
		 
		 
	 });
	 
	 it('should infer inverse property edges', function () {		    		    
		    var result = rdfutils.propertyEdges(store,testRelation,{transitiveClosure:true,inferSymmetric:true,inferInverses:true});
		    var mustHold = [[bert,gram]];
		    expect(R.all(R.identity,hasEdges(mustHold,result))).toBe(true);

		    var result2 = rdfutils.propertyEdges(store,inverseTestRelation,{transitiveClosure:true,inferSymmetric:true,inferInverses:true});
		    var mustHold2 = [[bert,ginny],[angela,ginny],[gram,bert]];
		    expect(R.all(R.identity,hasEdges(mustHold2,result2))).toBe(true);

		    var mustNotHold2 = [[gram,ginny],[angela,gram],[bert,gram]];
		    expect(R.any(R.identity,hasEdges(mustNotHold2,result2))).toBe(false);
		    
	    });
	 
	 it('should infer symmetric property edges', function () {		    		    
		    var result = rdfutils.propertyEdges(store,testSymmetricRelation,{transitiveClosure:true,inferSymmetric:true,inferInverses:true});		    
		    var mustHold = [[bert,angela],[angela,bert]];
		    expect(R.all(R.identity,hasEdges(mustHold,result))).toBe(true);
	    });	 


});