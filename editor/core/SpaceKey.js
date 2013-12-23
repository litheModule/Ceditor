
define("Cedtory/editor/core/SpaceKey", function(require, exports, module){
    var Env = require("Cedtory/editor/core/Env");
    var $   = require("Cedtory/mods/$");
    var VK  = require("Cedtory/editor/core/VK");
    var Class = require("Cedtory/mods/class");
    var utils = require("Cedtory/mods/utils");
    var TreeWalker = require("Cedtory/editor/core/TreeWalker");
    
    var grep = utils.grep;
    
    
    var SPACEBAR = VK.SPACEBAR;
    
    function handleEvtKey(evt, editor){
        var keyCode = evt.keyCode;
        
        function isPrevOrNextSpace(next) {
        
            function isSpaceChar(c) {
                if (' ' === c || '　' === c) {
                    return true;
                }
                return false;
            }
            function justifySpace(textNode) {
                if (3 !== textNode.nodeType) {
                    return;
                }
                var value = textNode.nodeValue;
                
                var c = value.charAt(offset);
                
                if (isSpaceChar(c)) {
                    return 'next';
                }
                if (offset > 0 && isSpaceChar( value.charAt(offset-1) ) ) {
                    return 'prev';
                }
            }
            
            function findRoot(node) {
                var tmp, 
                    options = editor.options,
                    lineBlockName = options.force_p_newlines ? 'p' : '' || options.forced_root_block,
                    editorRoot = editor.getRoot();
                while (tmp = node.parentNode) {
                    
                    if (tmp.nodeName.toUpperCase() == lineBlockName.toUpperCase()
                        || tmp === editorRoot) {
                        return tmp;
                    }
                    node = tmp;
                }
            }

            function moveCursorToNext(node) {
                var tmpOffset = offset + 1;
                if (!next && tmpOffset <= node.nodeValue.length) {
                    var cRng = rng.cloneRange();
                    cRng.setStart(rng.startContainer, tmpOffset);
                    cRng.setEnd(rng.startContainer, tmpOffset);
                    editor.setRng(cRng);
                }
            }
            var rng = editor.getRange();
            if (!rng.collapsed) {
                return false
            }
            var node   = rng.startContainer;
            var offset = rng.startOffset;
            var type   = node.nodeType;
            var last   = (3===type && offset === node.nodeValue.length);
            var spacePosition;
           
            
            if (3 !== type || last) {
                var walker = new TreeWalker(node, findRoot(node)),
                inc = next ? 'next' : 'prev';
                
                do {
                    node = walker[inc]();
                    if (node && '' !== node.nodeValue && 3 == node.nodeType) {
                        if (last && next) {
                            offset = 0;
                        } else if (last) {
                            offset = node.nodeValue.length;
                        }
                        break;
                    }
                } while(walker.current())
            }
           
            if (node) {
                spacePosition = justifySpace(node)
                if (spacePosition) {
                   
                    return true;
                }
            }
        }
        
        if (keyCode === SPACEBAR && 
            (isPrevOrNextSpace() || isPrevOrNextSpace(true))) {
            return false;
        }
    };
    
	function isPasteTag (evt) {
		var tagName = evt.target.nodeName.toLowerCase();
		return tagName === 'input' || tagName === 'textarea';
	};

    var SpaceKey = Class.create({
        initialize: function(editor){
            $(editor.getRoot()).on('keydown', function(evt){
				
				if (isPasteTag(evt)) {
					return;
				}
                if (false === handleEvtKey(evt, editor)) {
                    evt.preventDefault();
                }
            });
        }
    });
    return SpaceKey;
});
