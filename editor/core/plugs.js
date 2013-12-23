
define("Cedtory/editor/core/plugs", function(require, exports, module) {

	var Class = require("Cedtory/mods/class");
	
	var plugs = Class.create({
		
		add: function(pluginName, func) {
			if (!this._pluginObj) {
				this._pluginObj = {};
			}
			this._pluginObj[pluginName] = func;
		},
		
		get: function(pluginName) {
			return this._pluginObj[pluginName];
		}
	});

	return new plugs();
});

