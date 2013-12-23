
define("Cedtory/editor/core/DeleteKey",function(require){
    
    var Env = require("Cedtory/editor/core/Env");
    var $   = require("Cedtory/mods/$");
    var VK  = require("Cedtory/editor/core/VK");
    var TreeWalker = require("Cedtory/editor/core/TreeWalker");
    var Class = require("Cedtory/mods/class");
    var utils = require("Cedtory/mods/utils");
    var logger = require("Cedtory/editor/core/logger");
    
    var grep = utils.grep;
    var each = utils.each;


    return function(editor) {
        var BACKSPACE = VK.BACKSPACE,
            DELETE    = VK.DELETE,
            options = editor.options,
            dom = editor.dom;
        function handleEvtKey(evt) {
            var rng = editor.getRange();

            var keyCode = evt.keyCode,

                start = rng.startContainer,
                startOffset = rng.startOffset,
                end = rng.endContainer,
                endOffset = rng.endOffset,

                prevNode,
                nextNode,
                deleteNode,
                    
                root;
            
            var reg = /br/i;
            var walker = new TreeWalker(start, editor.getRoot(), function(n){
                if (1 === n.nodeType && reg.test(n.nodeName)) {
                    return false
                }
                
            });


            if (BACKSPACE === keyCode) {
                prevNode = walker.prev();
               
                if (0 === startOffset && rng.collapsed && !prevNode) {
                    return;
                }
                if (startOffset !== 0 && prevNode) {
                    return false;
                }
            } else if (DELETE === keyCode) {
                nextNode = walker.next();
                var len = 1===nextNode.nodeType? nextNode.childNodes.length :nextNode.nodeValue.length;
                if (startOffset !== len && nextNode) {
                    return false;
                }
            }
           
            deleteNode = prevNode || nextNode;
            if (deleteNode && 1 === deleteNode.nodeType
                && 'false' === dom.attr(deleteNode, 'contenteditable')) {
                dom.remove(deleteNode);
                editor.trigger('contentChange', editor)
                return;
            }

            editor.trigger('delete',start);
            

            return false;
        }

        $(editor.getRoot()).on('keydown', function(evt){
            var keyCode = evt.keyCode;
            
            if (BACKSPACE !== keyCode && DELETE !== keyCode) {
                return;
            }
            
            if (false !== handleEvtKey(evt)) {
                logger.log('keyCode:', keyCode, "-----输入被阻止了");
                evt.preventDefault();
            }
        });
    };
});
