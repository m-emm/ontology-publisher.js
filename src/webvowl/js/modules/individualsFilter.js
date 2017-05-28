var elementTools = require("../util/elementTools")();


module.exports = function () {

	var filter = {},
		nodes,
		properties,
		enabled = false,
		filteredNodes,
		filteredProperties;


	/**
	 * If enabled, all individuals are filtered.
	 * @param untouchedNodes
	 * @param untouchedProperties
	 */
	filter.filter = function (untouchedNodes, untouchedProperties) {
		nodes = untouchedNodes;
		properties = untouchedProperties;

		if (this.enabled()) {
			removePropertiesOfIndividuals();
			removeIndividuals();
		}

		filteredNodes = nodes;
		filteredProperties = properties;
	};

	function removeIndividuals() {		
		nodes = nodes.filter(isIndividual);
	}

	function isIndividual(node) {
		return node.type() !== "owl:NamedIndividual";
	}

	function removePropertiesOfIndividuals() {
		var individualIdMap = {};
		nodes.forEach(function(e){
			if(e.type() =="owl:NamedIndividual" ) {
				individualIdMap[e.id()] = true;
			}
		});
		properties = properties.filter(function(e){
			if(individualIdMap[e.domain().id()]) {
				return false;
			}
			if(individualIdMap[e.range().id()]) {
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
