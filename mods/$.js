define("Cedtory/mods/$", function(require, exports, module) {

	var $ = require("Cedtory/mods/qwery");
	var dom = require("Cedtory/mods/dom");
	var events = require("Cedtory/mods/events");
	var ender = require("Cedtory/mods/ender");

	ender.extend = function(b, a) {
		var prop;
		if (b === undefined) {
			return a;
		}
		for (prop in a) {
			if (a.hasOwnProperty(prop) && b.hasOwnProperty(prop) === false) {
				b[prop] = a[prop];
			}
		}
		return b;
	};

	var q = function() {
		return $;
	} ();

	ender.pseudos = q.pseudos;

	ender._select = function(s, r) {
	
	
	
	
		return (ender._select = (function() {
			var b = dom;
			if (typeof ender.create == 'function') return function(s, r) {
				return (/^\s*</).test(s) ? ender.create(s, r) : q(s, r);
			};
			try {
				return function(s, r) {
					return (/^\s*</).test(s) ? dom.create(s, r) : q(s, r);
				};
			} catch(e) {}
			return q;
		})())(s, r);
	};

	var integrate = function(method, type, method2) {
		var _args = type ? [type] : [];
		return function() {
			for (var i = 0, l = this.length; i < l; i++) {
				if (!arguments.length && method == 'on' && type) method = 'fire';
				events[method].apply(this, [this[i]].concat(_args, Array.prototype.slice.call(arguments, 0)));
			}
			return this;
		};
	},
	add = integrate('add'),
	on = integrate('on'),
	one = integrate('one'),
	off = integrate('off'),
	fire = integrate('fire'),
	clone = integrate('clone'),
	hover = function(enter, leave, i) {
		for (i = this.length; i--;) {
			events.on.call(this, this[i], 'mouseenter', enter);
			events.on.call(this, this[i], 'mouseleave', leave);
		}
		return this;
	},
	methods = {
		on: on,
		addListener: on,
		bind: on,
		listen: on,
		delegate: add,
	
		one: one,
		off: off,
		unbind: off,
		unlisten: off,
		removeListener: off,
		undelegate: off,
		emit: fire,
		trigger: fire,
		cloneEvents: clone,
		hover: hover
	},
	shortcuts = ('blur change click dblclick error focus focusin focusout keydown keypress ' + 'keyup load mousedown mouseenter mouseleave mouseout mouseover mouseup ' + 'mousemove resize scroll select submit unload').split(' ');

	for (var i = shortcuts.length; i--;) {
		methods[shortcuts[i]] = integrate('on', shortcuts[i]);
	}

	events.setSelectorEngine(q);
	methods = ender.extend({
		find: function(s) {
			var r = [],
			i,
			l,
			j,
			k,
			els;
			for (i = 0, l = this.length; i < l; i++) {
				els = q(s, this[i]);
				for (j = 0, k = els.length; j < k; j++) r.push(els[j]);
			}
			return ender(q.uniq(r));
		},
		and: function(s) {
			var plus = ender(s);
			for (var i = this.length, j = 0, l = this.length + plus.length; i < l; i++, j++) {
				this[i] = plus[j];
			}
			this.length += plus.length;
			return this;
		},
		is: function(s, r) {
			var i, l;
			for (i = 0, l = this.length; i < l; i++) {
				if (q.is(this[i], s, r)) {
					return true;
				}
			}
			return false;
		}
	},
	methods);
	ender.ender(methods, true);
	dom.setQueryEngine(ender);
	ender.ender(dom);
	ender.ender(dom(), true);
	ender.ender({
		create: function(node) {
			return ender(dom.create(node));
		}
	});
	ender.id = function(id) {
		return ender([document.getElementById(id)]);
	};
	function indexOf(ar, val) {
		for (var i = 0; i < ar.length; i++) if (ar[i] === val) return i;
		return - 1;
	}

	function uniq(ar) {
		var r = [],
		i = 0,
		j = 0,
		k,
		item,
		inIt;
		for (; item = ar[i]; ++i) {
			inIt = false;
			for (k = 0; k < r.length; ++k) {
				if (r[k] === item) {
					inIt = true;
					break;
				}
			}
			if (!inIt) r[j++] = item;
		}
		return r;
	}
	ender.ender({
		parents: function(selector, closest) {
			if (!this.length) return this
			if (!selector) selector = '*'
			var collection = $(selector),
			j,
			k,
			p,
			r = []
			for (j = 0, k = this.length; j < k; j++) {
				p = this[j]
				while (p = p.parentNode) {
					if (~indexOf(collection, p)) {
						r.push(p)
						if (closest) break;
					}
				}
			}
			return ender(uniq(r))
		},
		parent: function() {
			return ender(uniq(dom(this).parent()))
		},
		closest: function(selector) {
			return this.parents(selector, true)
		},
		first: function() {
			return ender(this.length ? this[0] : this)
		},
		last: function() {
			return ender(this.length ? this[this.length - 1] : [])
		},
		next: function() {
			return ender(dom(this).next())
		},
		previous: function() {
			return ender(dom(this).previous())
		},
		related: function(t) {
			return ender(dom(this).related(t))
		},
		appendTo: function(t) {
			return dom(this.selector).appendTo(t, this)
		},
		prependTo: function(t) {
			return dom(this.selector).prependTo(t, this)
		},
		insertAfter: function(t) {
			return dom(this.selector).insertAfter(t, this)
		},
		insertBefore: function(t) {
			return dom(this.selector).insertBefore(t, this)
		},
		clone: function() {
			return ender(dom(this).clone(this))
		},
    allPrevious:function(){
			var i, l, p, r = []
			for (i = 0, l = this.length; i < l; i++) {
				p = this[i]
				while (p = p.previousSibling) p.nodeType == 1 && r.push(p)
			}
			return ender(r);
    },
    allNext:function(){
			var i, l, p, r = []
			for (i = 0, l = this.length; i < l; i++) {
				p = this[i]
				while (p = p.nextSibling) p.nodeType == 1 && r.push(p)
			}
			return ender(r);
    },
		siblings: function() {
			var i, l, p, r = []
			for (i = 0, l = this.length; i < l; i++) {
				p = this[i]
				while (p = p.previousSibling) p.nodeType == 1 && r.push(p)
				p = this[i]
				while (p = p.nextSibling) p.nodeType == 1 && r.push(p)
			}
			return ender(r)
		},
		children: function() {
			var i, l, el, r = []
			for (i = 0, l = this.length; i < l; i++) {
				if (! (el = dom.firstChild(this[i]))) continue;
				r.push(el)
				while (el = el.nextSibling) el.nodeType == 1 && r.push(el)
			}
			return ender(uniq(r))
		},
		height: function(v) {
			return dimension.call(this, 'height', v)
		},
		width: function(v) {
			return dimension.call(this, 'width', v)
		}
	},
	true);
	
	function dimension(type, opt_v) {
		return typeof opt_v == 'undefined' ? dom(this).dim()[type] : this.css(type, opt_v)
	}

    module.exports = ender;

});

