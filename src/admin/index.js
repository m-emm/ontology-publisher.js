require('./index.html');
require('../webvowl/css/vowl.css');

var rdfutil = require('../rdfutils');

module.exports = function($routeParams, $location, $timeout, $interval, owlservice, $scope, storageservice,settingsservice) {

	var vm = this;
	vm.save = save;
	vm.loadFromStorage = loadFromStorage;
	vm.renameView = renameView;
	vm.isBeingRenamed = isBeingRenamed;
	vm.storeRenameView = storeRenameView;
	vm.isOntologyLoaded = isOntologyLoaded;
	vm.couldBeReloaded = couldBeReloaded;
	vm.reloadFromFile = reloadFromFile;
	vm.newView = newView;
	vm.removeView = removeView;
	vm.noViews = noViews;
	vm.editable = editable;
	vm.setEditability = setEditability;
	vm.setDefaultView = setDefaultView;
	vm.removeOntology = removeOntology; 
	vm.editableFlag = settingsservice.editable();
	vm.prepareDownload = prepareDownload;
	vm.loadDoc = loadDoc;
	
	vm.ontologies = [];
	vm.showRenameDialog = false;
	
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		// Great success! All the File APIs are supported.
	} else {
		alert('The File APIs are not fully supported in this browser.');
	}

	$scope.$watch(
	// This function returns the value being watched. It is called for each turn
	// of the $digest loop
	function() {
		return vm.fileData
	},
	// This is the change listener, called when the value returned from the
	// above function changes
	function(newValue, oldValue) {
		setOntologyData();
	});
	
	
	$scope.$watch(
			// This function returns the value being watched. It is called for each turn
			// of the $digest loop
			function() {
				return vm.editableFlag
			},
			// This is the change listener, called when the value returned from the
			// above function changes
			function(newValue, oldValue) {
				setEditability(newValue);
			});
	

	getOntologies();
	if (vm.ontologies && vm.ontologies.length > 0) {
		if (!owlservice.ontologyLoaded()) {
			loadFromStorage({name:vm.ontologies[0].name});
		} else {
			updateLoadedOntology();
		}
	}

	function getFileContent() {
		if (vm.fileData) {			
			return decodeFileText(vm.fileData);
		}
	}
	
	function decodeFileText(data) {		
		var byteString;
		if (data.split(',')[0].indexOf('base64') >= 0)
			byteString = atob(data.split(',')[1]);
		else
			byteString = unescape(data.split(',')[1]);
		return byteString;
	}

	function setOntologyData() {
		if (vm.fileData) {
			vm.ontologyText = getFileContent();
			owlservice.setOntologyText(null, vm.ontologyText);
		} else {
			if (owlservice.ontologyText()) {
				vm.ontologyText = owlservice.ontologyText();
			} else {
				vm.ontologyText = 'Nothing here!\n\nCome back later!';
			}

		}
	}

	function getOntologies() {
		vm.ontologies = storageservice.getOntologiesList();
	}

	function getViews() {
		vm.views = storageservice.getViewsObject(vm.ontologyName);
	}

	function updateOntology(name, text,id) {
		owlservice.setOntologyText(name, text,id);
		updateLoadedOntology();
	}

	function updateLoadedOntology() {
		vm.ontologyName = owlservice.getName();
		vm.ontologyText = owlservice.ontologyText();
		vm.ontologyObject = vm.ontologyObject|| {};
		vm.ontologyObject.id = owlservice.getId();
		
		vm.ontologies.forEach(function(element) {
			if (vm.ontologyName === element.name) {
				element.loaded = true;
			} else {
				element.loaded = false;
			}
		});
		getViews();
	}

	function isOntologyLoaded(ontology) {
		return vm.ontologyObject.id == ontology.id;
	}

	function couldBeReloaded(ontology) {
		if (ontology.id !== vm.ontologyObject.id) {
			return false;
		}
		if (vm.fileData) {
			return true;
		}
		return false;
	}

	function save() {
		var ontologyObject = {};
		if (vm.ontologyName) {
			ontologyObject.name = vm.ontologyName;
			ontologyObject.ontologyText = vm.ontologyText;
			storageservice.storeOntology(ontologyObject);
			updateOntology(vm.ontologyName, vm.ontologyText,ontologyObject.id);
		}
		getOntologies();

	}

	function reloadFromFile(ontology) {
		vm.ontologyObject = vm.ontologyObject || {};
		if (ontology.id && ontology.id === vm.ontologyObject.id && vm.fileData) {			 
			vm.ontologyObject.ontologyText = getFileContent();
			updateOntology(vm.ontologyObject.name, vm.ontologyObject.ontologyText,vm.ontologyObject.id);
			vm.fileData = null;
			storageservice.storeOntology(vm.ontologyObject);			
		}
	}
	
	function removeOntology(ontology){
		storageservice.removeOntology(ontology);
		getOntologies();
		
	}

	function loadFromStorage(ontology) {
		if (ontology.name) {
			var ontologyObject = storageservice.loadOntology(ontology.name);
			if (ontologyObject.ontologyText) {
				updateOntology(ontology.name, ontologyObject.ontologyText,ontologyObject.id);
				vm.ontologyObject = ontologyObject;
			}
		}
	}

	function renameView(view) {
		if (!vm.renaming) {
			vm.renaming = true;
			vm.viewRename = view.name;
			vm.viewBeingRenamed = view;
		}
	}

	function isBeingRenamed(view) {
		if (!vm.renaming || !vm.viewBeingRenamed) {
			return false;
		}
		return vm.viewBeingRenamed.id === view.id;
	}

	function storeRenameView() {
		if (vm.renaming) {
			vm.viewBeingRenamed.name = vm.viewRename;
			storageservice.storeView(vm.viewBeingRenamed);
			getViews();
			vm.renaming = false;
		}
	}

	function noViews() {
		if (!vm.views) {
			return true;
		}
		return Object.keys(vm.views).length === 0 && vm.views.constructor === Object;
	}

	function newView() {
		setEditability(true);
		$location.path('/graph/' + vm.ontologyName + '/___NEW_VIEW___');
	}	

	function setDefaultView(view) {
		for ( var k in vm.views) {
			if (vm.views.hasOwnProperty(k)) {
				var element = vm.views[k];
				if(element.id === view.id) {
					element.default = true;
				} else {
					element.default = false;
				}
				storageservice.storeView(element);
			}
		}
	}
	
	function editable() {
		return settingsservice.editable();
	}
	
	function setEditability(editable) {
		return settingsservice.setEditability(editable);
	}
	
	function prepareDownload() {
		vm.databaseData = 'data:' + "text/json;charset=utf-8," + encodeURIComponent(storageservice.getDatabaseText());
		vm.dataReady = true;
	}
	
	function loadDoc() {
		if(vm.docFileData) {
			var docFileText = decodeFileText(vm.docFileData);
			storageservice.replaceDatabase(docFileText);
		}
	}
	
	function removeView(view) {
		storageservice.removeView(view);
		getViews();
	}
	
	

}