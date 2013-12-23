
define("Cedtory/editor/core/EnterKey", function(require, exports, module){
    var Env = require("Cedtory/editor/core/Env");
    var $   = require("Cedtory/mods/$");
    var VK  = require("Cedtory/editor/core/VK");
    var TreeWalker = require("Cedtory/editor/core/TreeWalker");
    var Class = require("Cedtory/mods/class");
    var utils = require("Cedtory/mods/utils");
    var logger = require("Cedtory/editor/core/logger");
    var rangy = require("Cedtory/editor/core/rangy");
    
    var grep = utils.grep;
    var each = utils.each;
    
return function(editor){

    function handleEvtKey(evt, editor){
        var dom  = editor.dom,
            doc  = editor.doc,
            rng  = editor.getRange(),
            root = editor.getRoot(),
            options = editor.options,
            offset,
            container,
            newBlock,
            newBlockName,
            selection,
            tmpRng;
            
        function createNewBlock(name) {
            
            var node = container, block, clonedNode, caretNode;

            block = name || parentBlockName == "TABLE" ? dom.create(name || newBlockName) : parentBlock.cloneNode(false);
            caretNode = block;
            dom.attr(block, 'name', utils.getUnique());
           
            if (options.keep_styles !== false) {
                do {
                    if (/^(SPAN|STRONG|B|EM|I|FONT|STRIKE|U)$/.test(node.nodeName)) {
                       
                        if (node.id == '_lwb_caret') {
                            continue;
                        }

                        clonedNode = node.cloneNode(false);
                        dom.attr(clonedNode, 'id', '');

                        if (block.hasChildNodes()) {
                            clonedNode.appendChild(block.firstChild);
                            block.appendChild(clonedNode);
                        } else {
                            caretNode = clonedNode;
                            block.appendChild(clonedNode);
                        }
                    }
                } while ((node = node.parentNode));
            }

           
            if (!Env.ie) {
                caretNode.innerHTML = '<br data-lwb-bogus="1">';
            }

            return block;
        }
        
       
        function moveToCaretPosition(root){
            var walker, node, rng, lastNode = root, tempElm;

            rng = dom.createRng();

            if (root.hasChildNodes()) {
                walker = new TreeWalker(root, root);

                while ((node = walker.current())) {
                    if (node.nodeType == 3) {
                        rng.setStart(node, 0);
                        rng.setEnd(node, 0);
                        break;
                    }

                    if (nonEmptyElementsMap[node.nodeName.toLowerCase()]) {
                        rng.setStartBefore(node);
                        rng.setEndBefore(node);
                        break;
                    }

                    lastNode = node;
                    node = walker.next();
                }

                if (!node) {
                    rng.setStart(lastNode, 0);
                    rng.setEnd(lastNode, 0);
                }
            } else {
                if (root.nodeName == 'BR') {
                    if (root.nextSibling && dom.isBlock(root.nextSibling)) {
                       
                        if (!documentMode || documentMode < 9) {
                            tempElm = dom.create('br');
                            root.parentNode.insertBefore(tempElm, root);
                        }

                        rng.setStartBefore(root);
                        rng.setEndBefore(root);
                    } else {
                        rng.setStartAfter(root);
                        rng.setEndAfter(root);
                    }
                } else {
                    rng.setStart(root, 0);
                    rng.setEnd(root, 0);
                }
            }

            selection.setRng(rng);

           
            dom.remove(tempElm);
            selection.scrollIntoView(root, 20);
        }
        
       
        function wrapSelfWithBlock(node){
            var newBlock = dom.create(newBlockName);
            dom.insertBefore(newBlock, node);
            dom.append(newBlock, node);
            return newBlock;
        }
        
       
        function isStartOrEndOfParagraph(node, root, start) {
            
            var type = node.nodeType,
                nodeValue  = node.nodeValue,
                nodeLength = nodeValue ? nodeValue.length : node.childNodes.length,
                tmpNode,
                walker;
            
            if (3 === type && (start ? offset > 0 : offset < nodeLength)) {
                return false;
            }
            
           
            if (1 === type && node === root) {
                if (!node.hasChildNodes()) {
                    return !start;
                }
                logger.log('childNodes:', node.childNodes);
                logger.log('offset:', offset);
                node = node.childNodes[offset ? offset-1 : 0];
            }
            
            walker = new TreeWalker(node, root, function(n){
                logger.log('filter',n)
                if (n && /^br$/i.test(n.nodeName)) {
                    return false;
                }
                return true;
            });
            
            if (3 === node.nodeType) {
                if (start && offset === 0) {
                    walker.prev();
                } else if (!start && offset) {
                    walker.next();
                }
            }
            
            while (tmpNode = walker.current()) {
                logger.log('tmpNode:',tmpNode);
                if (!dom.isBlank(tmpNode)) {
                    return false;
                }
                
                if (start) {
                    walker.prev();
                } else {
                    walker.next();
                }
            }
            
            return true;
        }
        
       
        function moveCursorToPosition(node) {
            tmpRng = rangy.createRange();
            var selectionNode = node.firstChild;
            tmpRng.setStart(node, 0);
            tmpRng.setEnd(node, 0);
            selection = editor.getSelection();
            selection.removeAllRanges();
            selection.addRange(tmpRng);
        }
        
        function getCommonAncestorContainer(start, end) {
            var parents, commonAncestor;
            
            parents = dom.getParents(start, root);
            each(parents, function(n){
                if (dom.contains(n, end)){
                    commonAncestor = n;
                    return false;
                }
            });
            if (!commonAncestor) {
                commonAncestor = root;
            }
            
            return commonAncestor;
        }
        
       
        function deleteSelectionContent(rng) {
            var cloneRng = rng.cloneRange(),
                prefix = dom.getUnique(),
                commonAncestor,
                start,
                end,
                tmp,
                newRng,
                walker;
            
            start = dom.create('span', {
                id : prefix+'_start', 
                'data-lwb-type': 'bookmark',
                style: 'display:none'
            });
            rng.insertNode(start);
            cloneRng.collapse(false);
            end = dom.create('span', {
                id: prefix+'_end', 
                'data-lwb-type': 'bookmark',
                style: 'display:none'
            });
            cloneRng.insertNode(end);
            
            commonAncestor = getCommonAncestorContainer(start, end);
            walker = new TreeWalker(start, commonAncestor);
            walker.next()
            while(tmp = walker.current()) {
                if (tmp === end) {
                    break;
                }
                walker.next();
                if (!dom.contains(tmp, end))
                    dom.remove(tmp);
            }
            
            newRng = dom.createRng();
            var prev = start.prevousSibling;
            var next = end.nextSibling;
            var offset = 0;
            var startContainer
            if (next) {
                startContainer = next;
            } else if (prev) {
                startContainer = prev;
                if (3 === prev.nodeType) {
                    offset = prev.nodeValue.length;
                } else {
                    offset = prev.childNodes.length;
                }
            } else {
                startContainer = start.parentNode;
            }
            
            newRng.setStart(startContainer, offset);
            newRng.setEnd(startContainer, offset);
            var sel = editor.getSelection();
            sel.removeAllRanges();
            sel.addRange(newRng);
            
            dom.remove(start);
            dom.remove(end);
        }
        
       
        function trimLeadingLineBreaks(node) {
            do {
                if (node.nodeType === 3) {
                    node.nodeValue = node.nodeValue.replace(/^[\r\n]+/, '');
                }

                node = node.firstChild;
            } while (node);
        }
        
       
        if (evt.isDefaultPrevented()) {
            return;
        }
        
        if (!rng.collapsed) {
           
        } else {
            container = rng.startContainer;
            offset    = rng.startOffset;
            logger.log(container);
            if (container === root) {
                container = container.childNodes[0];
            }
            logger.log(container);
            var pathNodes = grep(dom.getParents(container, root));
            pathNodes.unshift(container);
            var tmp, rootBlock, blankLine;
            
            for (var i = pathNodes.length-1; i>=0; i--) {
                tmp = pathNodes[i];
                if (tmp.parentNode === root) {
                    rootBlock = tmp;
                    blankLine = dom.isBlank(tmp);
                    break;
                }
            }
            
            if (blankLine) {
                return;
            }
            
           
            newBlockName = (options.force_p_newlines ? 'p' : '') || options.forced_root_block;
            if (!dom.isBlock(container) && container.parentNode === root) {
                rootBlock = wrapSelfWithBlock(container);
            }

           
            if (!newBlockName && dom.isBlock(rootBlock)) {
                newBlockName = rootBlock.nodeName.toUpperCase();
            }
            
            if (isStartOrEndOfParagraph(container, rootBlock)) {
                newBlock = createNewBlock(newBlockName);
                dom.insertAfter(newBlock, rootBlock);
                moveCursorToPosition(newBlock);
            } else if (isStartOrEndOfParagraph(container, rootBlock, true)) {
                newBlock = createNewBlock(newBlockName);
                dom.insertBefore(newBlock, rootBlock);
                moveCursorToPosition(rootBlock);
            } else {
                tmpRng = rng.cloneRange();
                tmpRng.setEndAfter(rootBlock);
                fragment = tmpRng.extractContents();
                trimLeadingLineBreaks(fragment);
                newBlock = fragment.firstChild;
				dom.insertAfter(fragment, rootBlock);
                dom.attr(newBlock, 'name', utils.getUnique());
                moveCursorToPosition(newBlock);
            }
            if (newBlock) {
                dom.scrollIntoView(newBlock, 20);
            }
        }
    }
    
    $(editor.getRoot()).on('keydown', function(evt){
        if (VK.ENTER === evt.keyCode
            && false !== handleEvtKey(evt, editor)) {
            logger.log("输入被阻止了");
            evt.preventDefault();
        }
    });
};
});
