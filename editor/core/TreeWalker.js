
define("Cedtory/editor/core/TreeWalker", function(require){
    
    return function(start, root, filterFn){
        var self = this;
        self.startNode = start;
        self.rootNode = root;
        var node = start;
        
        filterFn = filterFn || function(node){return !!node;}
        
        function findSibling(node, start_name, sibling_name, shallow) {
            var sibling, parent, tmpNode, FALSE = false;
            
            if (node) {
                tmpNode = node[start_name];
                if (!shallow && tmpNode && FALSE !== filterFn(tmpNode)) {
                    return tmpNode;
                }
                
                if (node !== root) {
                    sibling = node[sibling_name];
                    if (sibling && FALSE !== filterFn(sibling)) {
                        return sibling;
                    }
                    
                    while((parent = node.parentNode) && parent != root) {
                       
                        while (sibling = parent[sibling_name]) {
                            if (sibling && FALSE !== filterFn(sibling)) {
                                return sibling;
                            } else {
                                parent = sibling;
                            }
                        }
                       
                        node = parent;
                    }
                }
            }
        }
        
        self.current = function() {
            return node;
        }
        
        self.next = function(shallow) {
            node = findSibling(node, 'firstChild', 'nextSibling', shallow);
            return node;
        }
        
        self.prev = function(shallow) {
            node = findSibling(node, 'lastChild', 'previousSibling', shallow);
            return node;
        }
        
    };
});
