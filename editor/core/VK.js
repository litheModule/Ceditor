


define("Cedtory/editor/core/VK", function(require) {
    var Env = require("Cedtory/editor/core/Env");
	return {
		BACKSPACE: 8,
		DELETE: 46,
		DOWN: 40,
		ENTER: 13,
		LEFT: 37,
		RIGHT: 39,
		SPACEBAR: 32,
		TAB: 9,
		UP: 38,

		modifierPressed: function(e) {
			return e.shiftKey || e.ctrlKey || e.altKey;
		},

		metaKeyPressed: function(e) {
		
			return (Env.mac ? e.ctrlKey || e.metaKey : e.ctrlKey) && !e.altKey;
		}
	};
});
