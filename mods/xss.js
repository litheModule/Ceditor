define("Cedtory/mods/xss",function(require,exports,module){



var defaultWhiteList = {
  h1:     [],
  h2:     [],
  h3:     [],
  h4:     [],
  h5:     [],
  h6:     [],
  hr:     [],
  span:   [],
  strong: [],
  b:      [],
  i:      [],
  br:     [],
  p:      [],
  pre:    [],
  code:   [],
  a:      ['target', 'href', 'title'],
  img:    ['src', 'alt', 'title', 'width', 'height'],
  div:    [],
  table:  ['width', 'border'],
  tr:     ['rowspan'],
  td:     ['width', 'colspan'],
  th:     ['width', 'colspan'],
  tbody:  [],
  ul:     [],
  li:     [],
  ol:     [],
  dl:     [],
  dt:     [],
  em:     [],
  cite:   [],
  section:[],
  header: [],
  footer: [],
  blockquote: [],
  audio:  ['autoplay', 'controls', 'loop', 'preload', 'src'],
  video:  ['autoplay', 'controls', 'loop', 'preload', 'src', 'height', 'width']
};

var REGEXP_LT = /</g;
var REGEXP_GT = />/g;
var REGEXP_QUOTE = /"/g;
var REGEXP_ATTR_NAME = /[^a-zA-Z0-9_:\.\-]/img;
var REGEXP_ATTR_VALUE = /&#([a-zA-Z0-9]*);?/img;
var REGEXP_DEFAULT_ON_TAG_ATTR_1 = /\/\*|\*
var REGEXP_DEFAULT_ON_TAG_ATTR_2 = /^[\s"'`]*((j\s*a\s*v\s*a|v\s*b|l\s*i\s*v\s*e)\s*s\s*c\s*r\s*i\s*p\s*t\s*|m\s*o\s*c\s*h\s*a):/ig;
var REGEXP_DEFAULT_ON_TAG_ATTR_3 = /\/\*|\*
var REGEXP_DEFAULT_ON_TAG_ATTR_4 = /((j\s*a\s*v\s*a|v\s*b|l\s*i\s*v\s*e)\s*s\s*c\s*r\s*i\s*p\s*t\s*|m\s*o\s*c\s*h\s*a):/ig;



function defaultOnTagAttr (tag, attr, value) {
  if (attr === 'href' || attr === 'src') {
    REGEXP_DEFAULT_ON_TAG_ATTR_1.lastIndex = 0;
    if (REGEXP_DEFAULT_ON_TAG_ATTR_1.test(value)) {
      return '#';
    }
    REGEXP_DEFAULT_ON_TAG_ATTR_2.lastIndex = 0;
    if (REGEXP_DEFAULT_ON_TAG_ATTR_2.test(value)) {
      return '#';
    }
  } else if (attr === 'style') {
    REGEXP_DEFAULT_ON_TAG_ATTR_3.lastIndex = 0;
    if (REGEXP_DEFAULT_ON_TAG_ATTR_3.test(value)) {
      return '#';
    }
    REGEXP_DEFAULT_ON_TAG_ATTR_4.lastIndex = 0;
    if (REGEXP_DEFAULT_ON_TAG_ATTR_4.test(value)) {
      return '';
    }
  }
}


function defaultOnIgnoreTag (tag, html, options) {
  return noTag(html);
}



function noTag (text) {
  return text.replace(REGEXP_LT, '&lt;').replace(REGEXP_GT, '&gt;');
}


function replaceUnicode (str, code) {
  return String.fromCharCode(parseInt(code));
}


function FilterXSS (options) {
  'use strict';

  this.options = options = options || {};
  this.whiteList = options.whiteList || exports.whiteList;
  this.onTagAttr = options.onTagAttr || exports.onTagAttr;
  this.onIgnoreTag = options.onIgnoreTag || exports.onIgnoreTag;
}


FilterXSS.prototype.filterAttributes = function (tagName, attrs) {
  'use strict';

  tagName = tagName.toLowerCase();
  var me = this;
  var whites = this.whiteList[tagName];
  var lastPos = 0;
  var _attrs = '';
  var tmpName = false;
  var hasSprit = false;

  var addAttr = function (name, value) {
    name =  name.trim();
    if (!hasSprit && name === '/') {
      hasSprit = true;
      return;
    };
    name = name.replace(REGEXP_ATTR_NAME, '').toLowerCase();
    if (name.length < 1) return;
    if (whites.indexOf(name) !== -1) {
      if (value) {
        value = value.trim().replace(REGEXP_QUOTE, '&quote;');
       
        value = value.replace(REGEXP_ATTR_VALUE, replaceUnicode);
        var _value = '';
        for (var i = 0, len = value.length; i < len; i++) {
          _value += value.charCodeAt(i) < 32 ? ' ' : value.charAt(i);
        }
        value = _value.trim();
        var newValue = me.onTagAttr(tagName, name, value);
        if (typeof newValue !== 'undefined') {
          value = newValue;
        }
      }
      _attrs += name + (value ? '="' + value + '"' : '') + ' ';
    }
  };

  for (var i = 0, len = attrs.length; i < len; i++) {
    var c = attrs.charAt(i);
    if (tmpName === false && c === '=') {
      tmpName = attrs.slice(lastPos, i);
      lastPos = i + 1;
      continue;
    }
    if (tmpName !== false) {
      if (i === lastPos && (c === '"' || c === "'")) {
        var j = attrs.indexOf(c, i + 1);
        if (j === -1) {
          break;
        } else {
          var v = attrs.slice(lastPos + 1, j).trim();
          addAttr(tmpName, v);
          tmpName = false;
          i = j;
          lastPos = i + 1;
          continue;
        }
      }
    }
    if (c === ' ') {
      var v = attrs.slice(lastPos, i).trim();
      if (tmpName === false) {
        addAttr(v);
      } else {
        addAttr(tmpName, v);
      }
      tmpName = false;
      lastPos = i + 1;
      continue;
    }
  }

  if (lastPos < attrs.length) {
    if (tmpName === false) {
      addAttr(attrs.slice(lastPos));
    } else {
      addAttr(tmpName, attrs.slice(lastPos));
    }
  }
  if (hasSprit) _attrs += '/';
  
  return _attrs.trim();
};


FilterXSS.prototype.addNewTag = function (tag, currentPos, targetPos) {
  'use strict';

  var rethtml = '';
  var spos = tag.slice(0, 2) === '</' ? 2 : 1;
    
  var i = tag.indexOf(' ');
  if (i === -1) {
    var tagName = tag.slice(spos, tag.length - 1).trim();
  } else {
    var tagName = tag.slice(spos, i + 1).trim();
  }
  tagName = tagName.toLowerCase();
  if (tagName in this.whiteList) {
   
    if (i === -1) {
      rethtml += tag.slice(0, spos) + tagName + '>';
    } else {
      var attrs = this.filterAttributes(tagName, tag.slice(i + 1, tag.length - 1).trim());
      rethtml += tag.slice(0, spos) + tagName + (attrs.length > 0 ? ' ' + attrs : '') + '>';
    }
  } else {
   
    var options = {
      isClosing:        (spos === 2),
      position:         targetPos,
      originalPosition: currentPos - tag.length + 1
    };
    var tagHtml = this.onIgnoreTag(tagName, tag, options);
    if (typeof tagHtml === 'undefined') {
      tagHtml = noTag(tag);
    }
    rethtml += tagHtml;
  }

  return rethtml;
};


FilterXSS.prototype.process = function (html) {
  'use strict';

  var rethtml = '';
  var lastPos = 0;
  var tagStart = false;
  var quoteStart = false;
  var currentPos = 0;

 
  for (var currentPos = 0, len = html.length; currentPos < len; currentPos++) {
    var c = html.charAt(currentPos);
    if (tagStart === false) {
      if (c === '<') {
        tagStart = currentPos;
        continue;
      }
    } else {
      if (quoteStart === false) {
        if (c === '<') {
          rethtml += noTag(html.slice(lastPos, currentPos));
          tagStart = currentPos;
          lastPos = currentPos;
          continue;
        }
        if (c === '>') {
          rethtml += noTag(html.slice(lastPos, tagStart));
          rethtml += this.addNewTag(html.slice(tagStart, currentPos + 1), currentPos, rethtml.length);
          lastPos = currentPos + 1;
          tagStart = false;
          continue;
        }
        if (c === '"' || c === "'") {
          quoteStart = c;
          continue;
        }
      } else {
        if (c === quoteStart) {
          quoteStart = false;
          continue;
        }
      }
    }
  }
  if (lastPos < html.length) {
    rethtml += noTag(html.substr(lastPos));
  }

  return rethtml;
};


function filterXSS (html, options) {
  var xss = new FilterXSS(options);
  return xss.process(html);
};

exports = module.exports = filterXSS;

exports.FilterXSS = FilterXSS;
exports.whiteList = defaultWhiteList;
exports.onTagAttr = defaultOnTagAttr;
exports.onIgnoreTag = defaultOnIgnoreTag;

utils = {};

utils.tagFilter = function (tags, next) {
  if (typeof(next) !== 'function') {
    next = function () {};
  }
  var hidden = [];
  var posStart = false;
  return {
    onIgnoreTag: function (tag, html, options) {
      if (tags.indexOf(tag) !== -1) {
        var ret = '[removed]';
        if (posStart !== false && options.isClosing) {
          var end = options.position + ret.length;
          hidden.push([posStart, end]);
          posStart = false;
        } else {
          posStart = options.position;
        }
        return ret;
      } else {
        return next(tag, html, options);
      }
    },
    filter: function (html) {
      var rethtml = '';
      var lastPos = 0;
      hidden.forEach(function (pos) {
        rethtml += html.slice(lastPos, pos[0]);
        lastPos = pos[1];
      });
      rethtml += html.slice(lastPos);
      return rethtml;
    }
  };
};

exports.utils = utils;
});
