
define("Cedtory/editor/core/DOMUtils", function(require, exports, module) {
	var utils = require("Cedtory/mods/utils");
	var $ = require("Cedtory/mods/$");
	var Env = require("Cedtory/editor/core/Env");
	var Evt = require("Cedtory/mods/events");
    var rangy = require("Cedtory/editor/core/rangy");

	var undef, counter = 1;

	var each = utils.each;
	var grep = utils.grep;
	var extend = utils.extend;
	var is = utils.is;

	function split(items, delim) {
		return items ? items.split(delim || ' ') : [];
	}

	function createHashTable(items) {
		if (!items.length) {
			return {};
		} else {
			var table = {};
			each(items, function(item) {
				if ('string' === typeof item) {
					table[item] = {};
				}
			});
			return table;
		}
	}


	var blockContent = split("address blockquote div dl fieldset form h1 h2 h3 h4 h5 h6 hr menu ol p pre table ul");


	var phrasingContent = split("a abbr b bdo br button cite code del dfn em embed i iframe img input ins kbd " + "label map noscript object q s samp script select small span strong sub sup " + "textarea u var #text #comment");

	var blockElementsMap = createHashTable(blockContent);

	var isIE = Env.ie;

	function DOMUtils(doc, settings) {
		var self = this;
		settings = extend(settings || {},
		{
			root: doc.body
		});;

		self.doc = doc;

		self.win = window;

		self.root = settings.root;

		self.counter = 0;
		self.stdMode = ! isIE || doc.documentMode >= 8;
		self.boxModel = ! isIE || doc.compatMode == "CSS1Compat" || self.stdMode;

		self.isBlock = function(node) {
			if (!node) {
				return false;
			}

			var type = node.nodeType;

			if (type) {
				return !! (type === 1 && blockElementsMap[node.nodeName.toLowerCase()]);
			}

			return !! blockElementsMap[node];
		}
	}
	DOMUtils.prototype = {
		addClass: function(el, clz) {
			if (!this.hasClass(el, clz)) {
				el.className += (' ' + clz);
			}
		},
		hasClass: function(el, clz) {
			var hasClass = false;
			each(el.className.split(' '), function(name) {
				if (name === clz) {
					hasClass = true;
					return false;
				}
			});
			return hasClass;
		},
		removeClass: function(el, clz) {
			if (this.hasClass(el, clz)) {
				var clzs = el.className.split(' '),
				tmp,
				after = [];
				while (tmp = clzs.shift()) {
					if (tmp != clz) {
						after.push(tmp);
					}
				}
				el.className = after.join(' ');
			}
		},
		
		append: function(pn, child) {
			return pn.appendChild(child);
		},
		
		create: function(name, attrs, html) {
			var el = document.createElement(name);
			var self = this;
			each(attrs, function(val, attr) {
				self.attr(el, attr, val);
			});
			if ('string' === typeof html) {
				el.innerHTML = html;
			}
			return el;
		},
		createRng: function() {
			return rangy.createRange();
		},
		contains: function(o, t) {
		
			return o.contains(t);
		},
		getParent: function(node, selector) {
			return this.getParents(node, null, selector, false);
		},
		
		getParents: function(node, end, selector, collect) {
			var self = this;
			var parents = [];
			var root = self.getRoot();
			end = end || root;
			selector = selector || function() {
				return ! 0
			};
			while (node && node !== root) {
				node = node.parentNode;
				if (selector(node)) {
					parents.push(node);
					if (!1 === collect) {
						return node;
					}
				}

				if (end && self.matchNode(node, end)) {
					break;
				}
			}
			return parents;
		},
		getRoot: function() {
			return this.root || this.doc.body;
		},

		getText: function(node) {
			if (1 === node.nodeType) {
                if($(node).find('figure').length) return "figure";
				return node.textContent || node.innerText || "";
			} else {
				return node.nodeValue;
			}
		},
	
	
	
	
	
	
	
	
	
	
	
	
	
	
		getUnique: function(prefix) {
			return (!prefix ? 'lwb_': prefix) + (counter++);
		},
       
        parseHTMLToFrag: function(html, filter) {
            var frag = this.doc.createDocumentFragment(),
                el = document.createElement('div'),
                filter = filter || function(){},
                node;

            el.innerHTML = html;
            while (node = el.firstChild) {
                if (false !== filter(node)) {
                    frag.appendChild(node);
                }
            }
            return frag;
        },
        insertHTML: function(html, referenceEl, where) {
            var frag = this.doc.createDocumentFragment();

        },
		
		insertBefore: function(newElement, referenceElement) {
			var parentElement = referenceElement.parentNode;
			return parentElement.insertBefore(newElement, referenceElement);
		},
		
		insertAfter: function(newElement, referenceElement) {
			var parent, nextSibling;

			parent = referenceElement.parentNode;
			nextSibling = referenceElement.nextSibling;

			if (nextSibling) {
				parent.insertBefore(newElement, nextSibling);
			} else {
				parent.appendChild(newElement);
			}
			return newElement;
		},
		isBlank: function(node) {
			var txt = this.getText(node);
			return /^\s*$/g.test(txt);
		},
		matchTag: function(node, tagName) {
			if (node && node.nodeName.toLowerCase() === tagName.toLowerCase()) {
				return true;
			} else {
				return false;
			}
		},
		matchNode: function(node1, node2) {
			if ('string' === typeof node2) {
				return this.matchTag(node1, node2);
			} else {
			
				return this.matchTag(node1, node2.nodeName);
			}
		},
		
		remove: function(node, keep_children) {
			var child, parent = node.parentNode;

			if (!parent) {
				return null;
			}

			if (keep_children) {
				while ((child = node.firstChild)) {
				
				
					if (child.nodeType !== 3 || child.nodeValue) {
						parent.insertBefore(child, node);
					} else {
						node.removeChild(child);
					}
				}
			}

			return parent.removeChild(node);
		},
		relaceNode: function(newNode, oldNode) {
			if (oldNode.replaceNode) {
				return oldNode.replaceNode(newNode);
			} else {
				newNode = this.insertBefore(newNode, oldNode);
				each(grep(oldNode.childNodes), function(n) {
					newNode.appendChild(n);
				});
				this.remove(oldNode);
				return newNode;
			}

		},
		
		attr: function(node, name, val) {
			if (!node) return;
			if (1 !== node.nodeType) {
				return
			}
			if (undef === val) {
				return node.getAttribute(name);
			} else {
				node.setAttribute(name, val);
				return val;
			}
		},
		setAttrs: function(elm, attrs) {
			var self = this;
			return this.run(elm, function(elm) {
				each(attrs, function(value, name) {
					self.attr(elm, name, value);
				});
			});
		},
		
		clone: function(node, deep) {
			if (undef === deep) {
				deep = false;
			}
			return node.cloneNode(deep);
		},
		
		scrollIntoView: function(node, bottomHeight) {
			if (!node) return;
			if (3 === node.nodeType) {
				node = node.parentNode;
			}
            var bottomHeight = bottomHeight || 0,
                clientRect = node.getBoundingClientRect(),
                top = clientRect.top,
                winHeight = window.innerHeight,
                doc = document, 
                docEl = doc.documentElement,
                currentScrollHeight = docEl.scrollTop + doc.body.scrollTop,
                lineHeight;
               
                if(document.all){
                    lineHeight = parseInt(node.currentStyle['lineHeight'], 10);
                }else{
                    lineHeight = parseInt(window.getComputedStyle(node).getPropertyValue('line-height'), 10);
                }
                var firstLineBottom = top + lineHeight + bottomHeight,
                scrollHeigth = currentScrollHeight + firstLineBottom - winHeight;

            if (firstLineBottom < winHeight) {
                return;
            }
           
            
            if (Env.webkit) {
                doc.body.scrollTop = scrollHeigth;
            } else {
                docEl.scrollTop = scrollHeigth;
            }
		
		
		
		
		},
		
		getViewPort: function(win) {
			var doc, rootElm;

			win = ! win ? this.win: win;
			doc = win.document;
			rootElm = this.boxModel ? doc.documentElement: doc.body;

		
			return {
				x: win.pageXOffset || rootElm.scrollLeft,
				y: win.pageYOffset || rootElm.scrollTop,
				w: win.innerWidth || rootElm.clientWidth,
				h: win.innerHeight || rootElm.clientHeight
			};
		},

		
		run: function(elm, func, scope) {
			var self = this,
			result;

			if (typeof(elm) === 'string') {
				elm = self.get(elm);
			}

			if (!elm) {
				return false;
			}

			scope = scope || this;
			if (!elm.nodeType && (elm.length || elm.length === 0)) {
				result = [];

				each(elm, function(elm, i) {
					if (elm) {
						if (typeof(elm) == 'string') {
							elm = self.get(elm);
						}

						result.push(func.call(scope, elm, i));
					}
				});

				return result;
			}

			return func.call(scope, elm);
		},

		
		add: function(parentElm, name, attrs, html, create) {
			var self = this;

			return this.run(parentElm, function(parentElm) {
				var newElm;

				newElm = is(name, 'string') ? self.doc.createElement(name) : name;
				self.setAttrs(newElm, attrs);

				if (html) {
					if (html.nodeType) {
						newElm.appendChild(html);
					} else {
						self.setHTML(newElm, html);
					}
				}

				return ! create ? parentElm.appendChild(newElm) : newElm;
			});
		},
		
		get: function(elm) {
			var name;

			if (elm && this.doc && typeof(elm) == 'string') {
				name = elm;
				elm = this.doc.getElementById(elm);

			
				if (elm && elm.id !== name) {
					return this.doc.getElementsByName(name)[1];
				}
			}

			return elm;
		},
		encode: function(text) {
		
			var baseEntities = {
				'\"': '&quot;',
			
				"'": '&#39;',
				'<': '&lt;',
				'>': '&gt;',
				'&': '&amp;'
			},
			rawCharsRegExp = /[<>&\"\']/g;

			return ('' + text).replace(rawCharsRegExp, function(chr) {
				return baseEntities[chr] || chr;
			});

		},
		
		bind: function(target, name, func, scope) {
			return Evt.on(target, name, func, scope || this);
		},
		unbind: function(target) {
		
		},
		
		setHTML: function(element, html) {
			var self = this;

			return self.run(element, function(element) {
				if (isIE) {
				
					while (element.firstChild) {
						element.removeChild(element.firstChild);
					}

					try {
					
					
						element.innerHTML = '<br />' + html;
						element.removeChild(element.firstChild);
					} catch(ex) {
					
					
					
					
						var newElement = self.create('div');
						newElement.innerHTML = '<br />' + html;

					
						each(grep(newElement.childNodes), function(node, i) {
						
							if (i && element.canHaveHTML) {
								element.appendChild(node);
							}
						});
					}
				} else {
					element.innerHTML = html;
				}

				return html;
			});
		},
		
		nodeIndex: function(node, normalized) {
			var idx = 0, lastNodeType, lastNode, nodeType;

			if (node) {
				for (lastNodeType = node.nodeType, node = node.previousSibling, lastNode = node; node; node = node.previousSibling) {
					nodeType = node.nodeType;

				
					if (normalized && nodeType == 3) {
						if (nodeType == lastNodeType || ! node.nodeValue.length) {
							continue;
						}
					}
					idx++;
					lastNodeType = nodeType;
				}
			}

			return idx;
		}
	}

	DOMUtils.DOM = new DOMUtils(document);

	module.exports = DOMUtils;

});

