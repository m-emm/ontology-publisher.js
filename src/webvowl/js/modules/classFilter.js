var elementTools = require("../util/elementTools")();


module.exports = function () {

	var filter = {},
		nodes,
		properties,
		enabled = false,
		filteredNodes,
		filteredProperties;


	/**
	 * If enabled, all classes are filtered.
	 * @param untouchedNodes
	 * @param untouchedProperties
	 */
	filter.filter = function (untouchedNodes, untouchedProperties) {
		nodes = untouchedNodes;
		properties = untouchedProperties;

		if (this.enabled()) {
			removePropertiesOfClasses();
			removeClasses();
		}

		filteredNodes = nodes;
		filteredProperties = properties;
	};

	function removeClasses() {		
		nodes = nodes.filter(isClass);
	}

	function isClass(node) {
		return node.type() !== "owl:Class";
	}

	function removePropertiesOfClasses() {
		var classIdMap = {};
		nodes.forEach(function(e){
			if(e.type() =="owl:Class" ) {
				classIdMap[e.id()] = true;
			}
		});
		properties = properties.filter(function(e){
			if(classIdMap[e.domain().id()]) {
				return false;
			}
			if(classIdMap[e.range().id()]) {
				return false;
			}
			return true;			
		});
		
	}

	filter.enabled = function (p) {
		if (!arguments.length) return enabled;
		enabled = p;
		return filter;
	};


	// Functions a filter must have
	filter.filteredNodes = function () {
		return filteredNodes;
	};

	filter.filteredProperties = function () {
		return filteredProperties;
	};


	return filter;
};
