define("Cedtory/mods/ender",function(require,exports,module){


var ender = (function (context) {

 
 

  context['global'] = context

 
 
 

  var modules = {}
    , old = context['$']
    , oldEnder = context['ender']
    , oldProvide = context['provide']

  function provide (name, what) {
    return (modules['$' + name] = what)
  }

  context['provide'] = provide

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  
  function Ender(s, r) {
    var elements
      , i

    this.selector = s
   
    if (typeof s == 'undefined') {
      elements = []
      this.selector = ''
    } else if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      elements = ender._select(s, r)
    } else {
      elements = isFinite(s.length) ? s : [s]
    }
    this.length = elements.length
    for (i = this.length; i--;) this[i] = elements[i]
  }

  
  Ender.prototype['forEach'] = function (fn, opt_scope) {
    var i, l
   
   
    for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(opt_scope || this[i], this[i], i, this)
   
    return this
  }

  Ender.prototype.$ = ender

 
  Ender.prototype.splice = function () { throw new Error('Not implemented') }

  function ender(s, r) {
    return new Ender(s, r)
  }

  ender['_VERSION'] = '0.4.5'

  ender.fn = Ender.prototype

  ender.ender = function (o, chain) {
    aug(chain ? Ender.prototype : ender, o)
  }

  ender._select = function (s, r) {
    if (typeof s == 'string') return (r || document).querySelectorAll(s)
    if (s.nodeName) return [s]
    return s
  }

  return ender;
}(window));

return ender;

});
