define("Cedtory/mods/filter", function(require, exports, module) {

	var $ = require("Cedtory/mods/$");
	var xss = require("Cedtory/mods/xss");

	function closeHTML(str) {
		var arrTags = ["span", "font", "b", "u", "i", "h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "ul", "table", "div"];
		for (var i = 0; i < arrTags.length; i++) {
			var intOpen = 0;
			var intClose = 0;
			var re = new RegExp("\\<" + arrTags[i] + "( [^\\<\\>]+|)\\>", "ig");
			var arrMatch = str.match(re);
			if (arrMatch !== null) intOpen = arrMatch.length;
			re = new RegExp("\\<\\/" + arrTags[i] + "\\>", "ig");
			arrMatch = str.match(re);
			if (arrMatch !== null) intClose = arrMatch.length;
			for (var j = 0; j < intOpen - intClose; j++) {
				str += "</" + arrTags[i] + ">";
			}
		}
		return str;
	}

	function filter(html, tagWhiteList, flgP) {
		tagWhiteList = tagWhiteList || {
			'p': [],
			'strong': [],
			'em': [],
			'a': ['href'],
			'blockquote': []
		};
		html = closeHTML(html);
		html = xss(html, {
			whiteList: tagWhiteList,
			onIgnoreTag: function(tag,html,options) {
				return '';
			}
		});
        
		if (!flgP) {
			var eles = $('<div>' + html + '</div>')[0];
			nodes = eles.childNodes;
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i],
				type = node.nodeType,
				tag = node.tagName;
				if (type === 3 || (type === 1 && tag.toLowerCase() !== 'p')) {
					node.parentNode.insertBefore(document.createElement('p'), node);
					node.previousSibling.appendChild(node);
				}
			}
			return $(eles).html();
		} else {
            return html;
		}
	}

	module.exports = filter;
});

