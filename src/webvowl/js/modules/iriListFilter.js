var elementTools = require("../util/elementTools")();


module.exports = function () {

	var filter = {},
		nodes,
		properties,
		enabled = false,
		filteredNodes,
		filteredProperties,
		iriList = {};


	/**
	 * If enabled, all nodes with iri in the list given are filtered
	 * @param untouchedNodes
	 * @param untouchedProperties
	 */
	filter.filter = function (untouchedNodes, untouchedProperties) {
		nodes = untouchedNodes;
		properties = untouchedProperties;

		if (this.enabled()) {
			removePropertiesOfFilteredNodes();
			removeNodes();
		}

		filteredNodes = nodes;
		filteredProperties = properties;
	};

	function removeNodes() {		
		nodes = nodes.filter(matchesIri);
	}

	function matchesIri(node) {
		var match = iriList[node.iri()];
		if(match) {
			var type = node.type() || 'NULLTYPE';
			if(match[type]) return false;
		}	
		return true;
	}

	function removePropertiesOfFilteredNodes() {
		var nodeMap = {};
		nodes.forEach(function(e){
			if(!matchesIri(e)) {
				nodeMap[e.id()] = true;
			}
		});
		properties = properties.filter(function(e){
			if(nodeMap[e.domain().id()]) {
				return false;
			}
			if(nodeMap[e.range().id()]) {
				return false;
			}
			return true;		
		});
		properties = properties.filter(matchesIri);				
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
	
	filter.setIriList = function(_iriList) {
		iriList = {};
		_iriList.forEach(function(element) {
			var slot = iriList[element.iri] || {};
			var type = element.type || 'NULLTYPE';
			slot[type] = element;
			iriList[element.iri] = slot;			 
		});
	}
	return filter;
};
