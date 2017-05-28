module.exports = function() {
	var service = this;
	
	service.editable = false;
	
	function setEditability(editable) {
		service.editable = editable;
	}
	
	function editable() {
		return service.editable;
	}
	
	var retval = {
			setEditability : setEditability,
			editable : editable
	
	};
	return retval;
}