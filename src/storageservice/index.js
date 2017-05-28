var _ = require('lodash');

module.exports = function() {
	var service = this;

	var ontologiesKey = "__ONTOLOGIES__";
	var viewsKey = "__VIEWS__";

	service.views = {};
	service.ontologies = {};

	function guid() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16)
					.substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4()
				+ s4() + s4();
	}

	function storeOntology(ontology) {
		if (typeof (Storage) !== "undefined") {
			if (ontology.id) {
				var ontologyRecord = ontologyById(ontology.id);
				if(ontologyRecord) {
					localStorage.setItem(ontology.id, JSON.stringify(ontology));
				}
			} else {
				if (ontology.name) {
					var ontologiesText = localStorage.getItem(ontologiesKey);
					var ontologies = JSON.parse(ontologiesText) || [];
					var newId = guid();
					ontologies.push({
						id : newId,
						name : ontology.name
					});
					ontology.id = newId;
					localStorage.setItem(ontologiesKey, JSON
							.stringify(ontologies));
					localStorage.setItem(ontology.id, JSON.stringify(ontology));
					return JSON.parse(JSON.stringify(ontology));
				}
			}
		} else {
			// Sorry! No Web Storage support..
		}
	}

	function ontologyRecordByName(name) {
		var ontologiesList = getOntologiesList();
		return ontologiesList.find(function(element) {
			return element.name === name;
		});
	}

	function ontologyById(id) {
		var ontologyText = localStorage.getItem(id);
		if (ontologyText) {
			var ontologyObject = JSON.parse(ontologyText);
			return ontologyObject;
		}
	}

	function loadOntology(name) {
		if (typeof (Storage) !== "undefined") {
			var ontologiesList = getOntologiesList();
			var found = ontologyRecordByName(name);
			if (found) {
				return ontologyById(found.id);
			}
		}
	}
	
	function removeOntology(ontology){
		if(ontology.id) {
			
			var ontologiesList = getOntologiesList();
			var found = ontologiesList.find(function(element) {
				return element.id === ontology.id;
			});
			if(found) {
				ontologiesList = ontologiesList.filter(function(element) {
					return element.id !== ontology.id;
				});
				localStorage.setItem(ontologiesKey, JSON
						.stringify(ontologiesList));
			}
			
			var ontologyRecord = ontologyById(ontology.id);
			if(ontologyRecord) {
				localStorage.removeItem(ontology.id);
				var viewsText = localStorage.getItem(viewsKey);
				if (viewsText) {
					var views = JSON.parse(viewsText);
					if(views.hasOwnProperty(ontology.id)) {
					  views[ontology.id].delete;
					  localStorage.setItem(viewsKey, JSON.stringify(views));
					}
				}				
			}
		}
	}

	function getOntologiesList() {
		var ontologiesText = localStorage.getItem(ontologiesKey);
		var ontologies = JSON.parse(ontologiesText) || [];
		return ontologies;
	}
	
	function store(key,data) {
		localStorage.setItem(key, JSON.stringify(data));
	}
	
	function retrieve(key) {
		var text = localStorage.getItem(key);
		if(text) {
			return JSON.parse(text);
		}		
	}
	
	function replaceSubkey(key,subkey,newData) {
		var toUpdate = retrieve(key);
		toUpdate[subkey] = newData;
		store(key,toUpdate);		
	}

	function storeView(view) {
		if (view.name && view.ontologyName || view.ontologyId) {
			if (!view.id) {
				view.id = guid();
			}

			var ontology;
			if (view.ontologyId) {
				ontology = ontologyById(view.ontologyId);
			} else {
				ontology = loadOntology(view.ontologyName);
			}
			view.ontologyId = ontology.id;
			var viewsText = localStorage.getItem(viewsKey);
			var views;
			if (viewsText) {
				views = JSON.parse(viewsText);
			} else {
				views = {};
			}
			var ontologySlot = views[view.ontologyId];
			if (!ontologySlot) {
				ontologySlot = views[view.ontologyId] = {};
			}
			view.saveDate = new Date();
			ontologySlot[view.id] = view;
			localStorage.setItem(viewsKey, JSON.stringify(views));
			return JSON.parse(JSON.stringify(view));
		}
	}

	function getViewsObject(ontologyName) {
		var ontoRec = ontologyRecordByName(ontologyName);
		var viewsText = localStorage.getItem(viewsKey);
		var retval = {};
		if (viewsText) {
			var views = JSON.parse(viewsText);
			var ontologySlot = views[ontoRec.id];
			if (ontologySlot) {
				retval = ontologySlot;
			}
		}
		return retval;
	}

	function getView(ontologyName, viewName) {
		var ontoRec = ontologyRecordByName(ontologyName);
		var viewsObject = getViewsObject(ontologyName);
		if (viewsObject) {
			for ( var k in viewsObject) {
				if (!viewsObject.hasOwnProperty(k))
					continue;
				var view = viewsObject[k];
				if (view.name === viewName) {
					return view;
				}
			}
		}
	}
	
	function getDatabaseText() {
		var retval = {};
		var viewsText = localStorage.getItem(viewsKey);		
		if (viewsText) {
			var views = JSON.parse(viewsText);
			retval[viewsKey] = views;
		}
		var ontologiesList = getOntologiesList();
		retval[ontologiesKey] = ontologiesList;		
		ontologiesList.forEach(function(element) {
			var ontologyRecord = ontologyById(element.id);
			retval[ontologyRecord.id] = ontologyRecord;
		});
		return JSON.stringify(retval);		
	}
	
	function replaceDatabase(databaseJson) {
		deleteDatabase();
		var databaseObject = JSON.parse(databaseJson);
		if(databaseObject[ontologiesKey] && databaseObject[viewsKey]) {
			store(ontologiesKey,databaseObject[ontologiesKey]);
			store(viewsKey,databaseObject[viewsKey]);
			databaseObject[ontologiesKey].forEach(function(element){
				var curOntology = databaseObject[element.id];
				if(curOntology) {
					store(element.id,curOntology);
				}
			});			
		}
	}
	
	function removeView(view) {
		if (view.id &&  view.ontologyId) {
			var views = retrieve(viewsKey);			
			if(views) {
				var ontologySlot = views[view.ontologyId];
				if(ontologySlot.hasOwnProperty(view.id)) {
					delete ontologySlot[view.id];
					replaceSubkey(viewsKey,view.ontologyId,ontologySlot);
				}				
			}			
		}
	}
	
	function deleteDatabase() {
		var ontolgiesList = getOntologiesList();
		ontolgiesList.forEach(function(element){
			removeOntology(element);	
		});		
	}
	
	function getDatabaseStatistics(databaseJson) {		
		var retval = {valid: false};
		return retval;		
	}

	var retval = {
		storeOntology : storeOntology,
		getOntologiesList : getOntologiesList,
		loadOntology : loadOntology,
		removeOntology:removeOntology,
		storeView : storeView,
		getViewsObject : getViewsObject,
		getView : getView,
		removeView:removeView,
		getDatabaseText:getDatabaseText,
		replaceDatabase:replaceDatabase,
		getDatabaseStatistics:getDatabaseStatistics
	};
	return retval;

}
