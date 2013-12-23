define("Cedtory/mods/domchange", function(require, exports, module) {

	var Event = require("Cedtory/mods/events");

	var cache = {},
	T, cbs = [];

	function interval() {
		for (var i in cbs) cbs[i]();
	}

	function add(cb) {
		cbs.push(cb);
	}

	var domChange = function(node, cb) {
		if (!T) {
			T = setInterval(function() {
				interval();
			},
			350);
		}
		cache[node] = node.innerHTML;
		add(function() {
			var html = node.innerHTML;
			if (cache[node] != html) {
				cache[node] = node.innerHTML;
				cb();
			}
		});
	};

	module.exports = domChange;
});

