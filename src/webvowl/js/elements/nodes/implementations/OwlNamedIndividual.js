var RoundNode = require("../RoundNode");
var drawTools = require("../../drawTools")();

module.exports = (function () {

	var o = function (graph) {
		var that = this;
		RoundNode.apply(this, arguments);
		this.draw = function (parentElement, additionalCssClasses) {
			var cssClasses = that.collectCssClasses();

			that.nodeElement(parentElement);

			if (additionalCssClasses instanceof Array) {
				cssClasses = cssClasses.concat(additionalCssClasses);
			}
			drawTools.appendPolygonClass(parentElement, that.actualRadius(), 6, cssClasses, that.labelForCurrentLanguage(), that.backgroundColor());

			that.postDrawActions(parentElement);
		};
		
		// Functions
		this.setHoverHighlighting = function (enable) {
			that.nodeElement().selectAll("polygon").classed("hovered", enable);
		};
		
		this.toggleFocus = function () {
			that.focused(!that.focused());
			that.nodeElement().select("polygon").classed("focused", that.focused());
			graph.resetSearchHighlight();
			graph.options().searchMenu().clearText();

		};
		
		this.styleClass("namedindividual").type("owl:NamedIndividual");
		

		
	};
	o.prototype = Object.create(RoundNode.prototype);
	o.prototype.constructor = o;

	return o;
}());
