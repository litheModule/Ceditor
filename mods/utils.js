define("Cedtory/mods/utils", function(require, exports, module) {

	var art = require("Cedtory/mods/artDialog");
	var $ = require("Cedtory/mods/$");
	var filter = require("Cedtory/mods/filter");

	exports.filter = filter;
	exports.extend = $.extend;
	exports.$ = $;

	exports.delHtmlTag = function(str) {
		return str.replace(/<[^>]+>/gi, "");
	};

	exports.getStrLeng = function(str) {
        return str.getByteLength();
	};

	exports.serialiseObject = function(obj) {
		var pairs = [];
		for (var prop in obj) {
			if (!obj.hasOwnProperty(prop)) {
				continue;
			}
			if (Object.prototype.toString.call(obj[prop]) == '[object Object]') {
				pairs.push(exports.serialiseObject(obj[prop]));
				continue;
			}
			pairs.push(prop + '=' + obj[prop]);
		}
		return pairs.join('&');
	};
    exports.trim = function(str){
        return str.replace(/(^\s*)|(\s*$)/g, "");
    };
	exports.param = function(str) {
		var params = {};
		str.replace(/([^?=&]+)(=([^&]*))?/g, function($0, $1, $2, $3) {
			params[$1] = $3;
		});
		return params;
	};





	function each(o, cb, s) {
		if (undefined === o) return 0;
		var l, n;
		s = s || o;
		if (undefined === o.length) {
			for (n in o) {
				if (o.hasOwnProperty(n)) {
					if (false === cb.call(s, o[n], n, o)) {
						return 0;
					}
				}
			}
		} else {
			for (n = 0, l = o.length; n < l; n++) {
				if (false === cb.call(s, o[n], n, o)) {
					return 0;
				}
			}
		}
		return 1;
	}

	function grep(a, f) {
		var o = [];
		each(a, function(v) {
			if (!f || f(v)) {
				o.push(v);
			}
		});

		return o;
	}

	exports.each = each;
	exports.grep = grep;

	exports.art = art;
    var count = 0.9999;
	exports.getUnique = function() {
		var unique = Math.floor((1 + count) * 0x10000).toString(16).substring(1);
        count = count - 0.0001;
		return unique;
	};
    
	
	exports.isArray = Array.isArray || function(obj) {
		return Object.prototype.toString.call(obj) === "[object Array]";
	};

	
	exports.is = function(o, t){
		if (!t) {
			return o !== undefined;
		}

		if (t == 'array' && isArray(o)) {
			return true;
		}

		return typeof(o) == t;
	};
});

