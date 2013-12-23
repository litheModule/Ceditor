
define("Cedtory/Cedtory", function(require, exports, module) {
	var qwery     = require("Cedtory/mods/qwery");
    var $         = require("Cedtory/mods/$");
    var DOMUtils  = require("Cedtory/editor/core/DOMUtils");
	var cusEvt    = require("Cedtory/mods/custom-events");
	var Evt       = require("Cedtory/mods/events");
    var domchange = require("Cedtory/mods/domchange");
    var Env       = require("Cedtory/editor/core/Env");
    
    var plugs     = require("Cedtory/editor/core/plugs");
	var utils     = require("Cedtory/mods/utils");
	var Class     = require("Cedtory/mods/class");
    
    var EnterKey  = require("Cedtory/editor/core/EnterKey");
    var SpaceKey  = require("Cedtory/editor/core/SpaceKey");
    var DeleteKey  = require("Cedtory/editor/core/DeleteKey");
    var VK = require("Cedtory/editor/core/VK");

    var rangy = require("Cedtory/editor/core/rangy");
    rangy.config.preferTextRange = true;
    rangy.init();
    try {
       document.execCommand("MultipleSelection", true, true);
    } catch (ex) {}
    
    var TreeWalker = require("Cedtory/editor/core/TreeWalker");
    
   
    

	var getUnique = utils.getUnique;
	var extend    = utils.extend;
    var each      = utils.each;
    var grep      = utils.grep;
    var trim      = utils.trim;

    function isWhiteSpaceNode(node) {
        return node && node.nodeType === 3 && /^([\t \r\n]+|)$/.test(node.nodeValue);
    }
    
    function blankHtml(){
        return '<p name="' + getUnique() + '"><br  data-lwb-bogus="1"></p>';
    }
    
    function emptyHtml(text) {
        return '<p node-type="empty" name="' + getUnique() + '">' + text + '</p>';
    }
    
    function findContainer(node, mark, end) {
        var walker = new TreeWalker(node, mark.common);
        var inc = !end ? 'next' : 'prev';
        var container;
        while(container = walker[inc]()) {
            if (3 === container.nodeType) {
                break;
            }
        }
        return container;
    }
    
    function addMark(sel, dom){
        var rng = sel.getRangeAt(0);
        var cloneRng = rng.cloneRange(),
            prefix = dom.getUnique(),
            markers = [],
            markersLen,
            walker,
            commonAncestor,
            start,
            end,
            tmp,
            marker,
            newRng,
            normalizeNode;
            
        commonAncestor = rng.commonAncestorContainer;
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
        
       
        normalizeNode = commonAncestor;
        if (1 !== commonAncestor.nodeType) {
            normalizeNode = normalizeNode.parentNode;
        }
        commonAncestor.normalize();
        walker = new TreeWalker(start, commonAncestor);
        while(tmp = walker.current()){
            if (tmp === end) {
                break;
            }
            
            if (3 === tmp.nodeType) {
                marker = dom.create('font', {
                    'face':Editor.TMP_ID
                });
                dom.insertBefore(marker, tmp);
                dom.append(marker, tmp);
                markers.push(marker);
            }
            walker.next();
        }
       
        if (markersLen = markers.length) {
            dom.insertBefore(start, markers[0].firstChild);
            dom.insertAfter(end, markers[markersLen-1].lastChild);
        }
        return {
            start: start,
            end: end,
            common: commonAncestor
        }
    }
    
    function removeMark(mark, dom) {
        if (mark) {
            var startPn = mark.start.parentNode,
                endPn = mark.end.parentNode;
            dom.remove(mark.start);
            dom.remove(mark.end);
            if (startPn === endPn && 0 === startPn.childNodes.length) {
                dom.remove(startPn);
            }
        }
    }
	
    var Editor = Class.create({
	
		Statics: {
		
			STATE: {
				CREATING: 1,
				CREATED: 2,
				EDITING: 3,
				SHOWSOURCE: 4
			},
            TMP_ID: 'lwb-tmp-node'
		},

        _oldRng : null,

		defaults: {
			emptyTxt: "正文(必选)",
            diffLeft: 0,
            diffTop: -5,
            focus_clz: 'lwb-active',
            empty_clz: 'lwb-default-value',
            force_p_newlines : false,
            forced_root_block : 'p',
            keep_styles: true
		},
        
	
		initialize: function(cfg) {
            var self = this;
            self.doc = cfg.doc || document;
            self.dom = new DOMUtils(document, {root: cfg.root});
			self._state = Editor.STATE.CREATING;
			self._plugs = {};
		
			self.op = {};
			self.trigger('start', this);
            self.options = extend(cfg['options'] || {}, this.defaults);
			self.initElement(cfg.root)
                .initDefaultText(cfg)
                .initEvents()
                .initPlugs(cfg.plugs);
            
           
            
            setTimeout(function(){
                self.trigger('init', self, self.root);
            });
		},
		initElement: function(root) {
            
			this.root = root;
			$(this.root).attr('contentEditable', true);

			return this;
		},
		initDefaultText: function(cfg) {
            var self = this;
			var text = cfg.emptyTxt || self.defaults.emptyTxt;
            self.emptyHtml = emptyHtml(text);
            self.setContent(self.emptyHtml);
            self.dom.addClass(self.root, self.options.empty_clz);
			return self;
		},
		initPlugs: function(plugsConf) {
			var conf, job, events, args, plugcase;
			for (var i = 0; i < plugsConf.length; i++) {
			
				conf = plugsConf[i];
				args = conf['options'] || {};
                
				job = plugs.get(conf.name).call(this, args);
			
				this._plugs[conf.name] = job;
			}
			this.trigger('initPlugsEnd', this);
			return this;
		},
		initEvents: function() {
            var self = this;
            var dom  = self.dom;
            var eventType = Env.mobile?"touchstart":"click";
            var lastTouchTime = + new Date;
            self.enterKey = new EnterKey(self);
            self.spaceKey = new SpaceKey(self);
            self.deleteKey = new DeleteKey(self);
		
            function clearEmptyText(evt) {
                var content = self.getPlainText();
                if (trim(content) === '') {
                    var sel = self.getSelection();
                    var rng = self.getRange();
                    content = blankHtml();
                    self.setContent(content);
				
				
					setTimeout(function(){
                        try{
						var node = self.root.firstChild;
						rng.setStart(node, 0);
						rng.setEnd(node, 0);
						if (!rng.collapsed) {
							rng.collapse();
						}
						sel.removeAllRanges();
						sel.addRange(rng);
                        }catch(e){}
					});
                }
                self.dom.addClass(self.root, self.options.focus_clz);
                if (!self.isFocus) {
                    self.isFocus = true;
                    return self.trigger('focus', self);
                }
            }

            function simulateBlur(t, evt){
                var isInEditor = dom.contains(self.root, t);
                if (!isInEditor && dom.isBlank(self.root)) {
                    dom.removeClass(self.root, self.options.focus_clz);
                    dom.addClass(self.root, self.options.empty_clz);
                    self.setContent(self.emptyHtml);
                }
                if (!isInEditor && self.isFocus) {
                    self.isFocus = false;
                    self.trigger('blur', self);
                }
            } 


           
            Evt.on(self.root, 'paste', function(evt){
                return self.trigger('paste', self, evt);
            });

            if (Env.mobile) {
                Evt.on(self.root, 'click', function(evt) {
                    var current = +new Date, result;
                    
                    if (300 < current - lastTouchTime) {
                        result = clearEmptyText(evt)
                    }
                    lastTouchTime = current;
                    return result;
                });
            }
           
            Evt.on(self.root, eventType + ' keyup', function(evt) {
                if (evt.type == 'keyup' && evt.keyCode !== VK.TAB) {
                    return;
                }
                if (Env.mobile) {
                    lastTouchTime = +new Date;
                }
                return clearEmptyText(evt);
			});
           
            Evt.on(self.root, 'mouseleave', '.content p,.content figure,.content blockquote', function(evt) {
               
                var target = evt.currentTarget;
                evt.pageY = evt.pageY || window.event.clientY + document.documentElement.scrollTop + document.body.scrollTop;
                if (evt.pageY) {
                    var mouseY,
                        offset,
                        targetBottom,
                        mouseBottom,
                        marginBottom;
                   
                    mouseY = evt.pageY;
                    offset = $(target).offset();
                    targetBottom = offset.top + offset.height;

                   
                    if (mouseY > offset.top) {
                        mouseBottom = targetBottom - mouseY;
                    } else {
                       
                        target = target.previousSibling;
                        mouseBottom = offset.top - mouseY;
                    }
                    if (!target) {
                        return;
                    }
                   
                    marginBottom = parseInt($(target).css('margin-bottom'), 10);

                    if (mouseBottom >= -marginBottom && marginBottom > mouseBottom) {
                       
                        self.trigger('paragraphgapenter', target, self);
                    }
                }
                
			});
           
            Evt.on(self.root, 'mouseenter', '.content p,.content figure,.content blockquote', function(evt) {
               
                var target = evt.currentTarget;
                evt.pageY = evt.pageY || window.event.clientY + document.documentElement.scrollTop + document.body.scrollTop;
                if (evt.pageY) {
                   
                    self.trigger('paragraphgapleave', target, self);
                }
			});
            
            domchange(self.root,function(){
                self.trigger('contentChange',self);
            });

            eventType = Env.mobile ? "touchend" : "mouseup";

            if (Env.mobile) {
               
                Evt.on(self.doc.body, 'click', function(evt) {
                    var current = +new Date, result;
                    if (300 < current - lastTouchTime) {
                        result = simulateBlur(evt.target, evt)
                    }
                    lastTouchTime = current;
                    return result;
                });
            }
            Evt.on(self.doc.body, eventType + ' keyup', function(evt){
                var t = evt.target;
                simulateBlur(t, evt)
            });
           
            Evt.on(self.root, eventType+' keyup', function(evt){
                var current = +new Date;
                if ( Env.mobile && ((current-lastTouchTime) < 300) ) {
                    lastTouchTime = current;
                }
               
                setTimeout(function(){
                    var rng = self.getRange();
                   
                    if (!self._oldRng || self._oldRng !== rng) {
                        self.trigger('selectionChange', self, rng);
                    }
                    self._oldRng = rng;
                });
            });

            Evt.on(self.root, 'click mousedown mouseup keydown keyup touchstart touchmove touchend', function(evt){
                return self.trigger(evt.type, evt);
            });

			return self;
		},
        insertBeforeHtml:function(html,relatedNode){
            var node = $(html).insertBefore(relatedNode);
            this.trigger('contentChange', this);
            return node;
        },
        insertHtml: function(html, relatedNode){
            var node = $(html).insertAfter(relatedNode);
            this.trigger('contentChange', this);
            return node;
        },
		
       
        apply: function(tagName, vars){
            var self = this;
            
            var _sel = self.getSelection(),
                dom  = self.dom,
                doc = this.getDoc(),
                oldRng, walker,
                tmpPn, node,
                mark,
                _selection = [];
                
            var isBlockTag = dom.isBlock(tagName);

            vars = vars || {};

            if (this.hasSelection()) {
                mark = addMark(_sel, dom);
                
               
                var tmpFonts = qwery('font[@face="'+Editor.TMP_ID+'"]'),
                    tmpNode, startContainer, startOffset, endContainer, endOffset;
                
               
                each(grep(tmpFonts), function(font, index){
                    var childCount;

                    function getChildCount(node) {
                        var count = 0;
                        each(grep(node.childNodes), function(n){
                            if (isWhiteSpaceNode(n)) {
                                count++;
                            }
                        });
                        return count;
                    }

                    function mergeSiblings(prev, next) {
                        function compareElements(obj1, obj2) {
                            if (obj1 && obj2 && obj1.nodeType === 1 
                            && obj1.nodeName.toLowerCase() === obj2.nodeName.toLowerCase()) {
                                return true;
                            }
                            return false
                        }
                        if (prev && next) {
                            if (compareElements(prev, next)) {
                               
                                each(grep(next.childNodes), function(node) {
                                    prev.appendChild(node);
                                });
                                dom.remove(next);
                                return prev;
                            }
                        }
                        
                        return next;
                    }

                    
                    
                    function getNonWhiteSpaceSibling(node, next, inc) {
                        if (node) {
                            next = next ? 'nextSibling' : 'previousSibling';

                            for (node = inc ? node : node[next]; node; node = node[next]) {
                                if (node.nodeType == 1 
                                    || !isWhiteSpaceNode(node)) {
                                    return node;
                                }
                            }
                        }
                    }
                   
                   
                   
                    if (isBlockTag){
                        each(grep(dom.getParents(font, vars.replaceTag)), function(pn, index){
                            if (dom.isBlock(pn) && vars.matchNode 
                                && vars.matchNode(pn)) {
                                var placeNode = dom.create(tagName, {className:vars.css});
                                dom.relaceNode(placeNode, pn);
                                return 1;
                            }
                        });
                        var fontPn = font.parentNode;
                        each(grep(font.childNodes), function(n){
                            dom.insertBefore(n, font);
                        });
                        dom.remove(font);
                    } else {
                        tmpPn = font.parentNode;
                        if (!dom.matchNode(tmpPn, tagName)) {
                            node = dom.create(tagName, {className:vars.css});
                            each(grep(font.childNodes), function(child){
                               
                                node.appendChild(child);
                            });
                            $(font).replaceWith(node);
                            _selection.push(node);
                        } else {
                            _selection.push(font.firstChild, font.lastChild);
                            dom.remove(font, 1);
                        }

                       
                        if (node && dom.matchNode(node.parentNode, tagName)) {
                            dom.remove(node, 1);
                            node = 0;
                            return true;
                        }

                       
                        if (node) {
                            node = mergeSiblings(getNonWhiteSpaceSibling(node), node);
                            node = mergeSiblings(node, getNonWhiteSpaceSibling(node, true));
                        }
                    }
                
                });
                
                startContainer = findContainer(mark.start, mark);
                endContainer = findContainer(mark.end, mark, true);
                rng = self.getRange();
                if (3 === endContainer.nodeType) {
                    endOffset = endContainer.nodeValue.toString().length;
                } else {
                    endOffset = endContainer.childNodes.length;
                }
                
               
                if (startContainer && endContainer) {
                    rng.setStart(startContainer, 0);
                    rng.setEnd(endContainer, endOffset);
                    self.setRng(rng);
                }
                removeMark(mark, dom);
            } else {
               
                doc.execCommand('insertimg', false, Editor.TMP_ID);
                var tmpImgs = qwery('img[@src="'+ Editor.TMP_ID +'"]'),
                    img;
                for (var i = 0; i < tmpImgs.length; i++) {
                    node = dom.create(tagName, {className:css})
                    img = tmpImgs[i];
                    tmpPn = img.parentNode;
                    tmpPn.replaceChild(node, img);
                }
            }
            this.trigger('contentChange', this);

            this.trigger('selectionChange', this, this.getRange());
        },
       
        remove: function(tagName, vars){
            var self = this;

            var _sel = self.getSelection(),
                doc  = self.getDoc(),
                dom  = self.dom,
                mark, rng,
                tmpPn, node;
                
            var isBlockTag = dom.isBlock(tagName);
            
           
            if (this.hasSelection()) {
                
                mark = addMark(_sel, dom);
               
                var tmpFonts = qwery('font[@face="'+ Editor.TMP_ID +'"]'),
                    font, startContainer, startOffset, endContainer, endOffset;
               
                each(grep(tmpFonts), function(font, index){
                    
                    function getRelNode(node) {
                        while(tagName.toLowerCase() == node.nodeName.toLowerCase()){
                            if (node == self.root) {
                                node = null;
                                break;
                            }
                            node = node.parentNode;
                        }
                        return node;
                    }
                    

                   
                    function getSiblings(node, next, inc) {
                        var siblings = [];
                        if (node) {
                            next = next ? 'nextSibling' : 'previousSibling';
                            var type;
                            for (node = inc ? node : node[next]; node; node = node[next]) {
                                type = node.nodeType;
                                if ((node.nodeValue && type === 3) 
                                     || 1 === type) {
                                   
                                    siblings.push(node);
                                }
                            }
                        }
                        return siblings
                    }
                    
                    if (isBlockTag){
                        
                        each(grep(dom.getParents(font, vars.replaceTag)), function(pn, index){
                            if (!startContainer) {
                                startContainer = font.firstChild;
                                startOffset = 0;
                            }
                            if (dom.isBlock(pn) && vars.matchNode 
                                && vars.matchNode(pn)) {
                                var placeNode = dom.create(tagName, {className:vars.css});
                                dom.relaceNode(placeNode, pn);
                                return 1;
                            }
                        });
                        var fontPn = font.parentNode;
                        each(grep(font.childNodes), function(n){
                            dom.insertBefore(n, font);
                        });
                        dom.remove(font);
                    } else {
                        var targetNode = getRelNode(font);
                        if (!targetNode) {
                            tmpPn = font.parentNode;
                            each(grep(font.childNodes), function(node){
                                tmpPn.appendChild(node);
                            });
                            tmpPn.remove(font);
                        } else {
                            var tmpNode = font;
                            each(grep(dom.getParents(tmpNode, tagName)), function(node){
                               
                                node.normalize();
                               
                                var prevSiblings = getSiblings(tmpNode);
                                
                                if (prevSiblings.length) {
                                    var prevNode = dom.clone(node);
                                    each(prevSiblings, function(s){
                                        var last = prevNode.lastChild;
                                        if (last) {
                                            dom.insertBefore(s, last);
                                        } else {
                                            dom.append(prevNode, s);
                                        }
                                        
                                    });
                                    dom.insertBefore(prevNode, node);
                                }
                               
                                if (dom.matchNode(node, tagName)) {
                                    tmpNode = dom.insertBefore(tmpNode, node);
                                    var pn = font.parentNode;
                                    
                                    each(grep(font.childNodes), function(n){
                                        dom.insertBefore(n, font);
                                    });
                                    
                                    dom.remove(font);
                                    if (!node.childNodes.length){
                                        dom.remove(node);
                                    }
                                } else if (prevSiblings.length && node.nextSibling) {
                                    var nextNode = dom.clone(node);
                                    nextNode.appendChild(tmpNode);
                                    tmpNode = dom.insertBefore(nextNode, node);
                                } else {
                                    tmpNode = node;
                                }
                                
                            });
                        }
                    }
                });
                
                
                startContainer = findContainer(mark.start, mark);
                endContainer = findContainer(mark.end, mark, true);
                rng = self.getRange();
                if (3 === endContainer.nodeType) {
                    endOffset = endContainer.nodeValue.toString().length;
                } else {
                    endOffset = endContainer.childNodes.length;
                }
                
               
                if (startContainer && endContainer) {
                    rng.setStart(startContainer, 0);
                    rng.setEnd(endContainer, endOffset);
                    self.setRng(rng);
                }
                removeMark(mark, dom);
                
                this.trigger('contentChange', this);

                this.trigger('selectionChange', this, this.getRange());
            }
        },
        focus: function(){
            this.root.focus();
        },
        getDoc: function(){
            return document;
        },
        getWin: function(){
            return window;
        },
       
        getRange: function(){
            return this.getSelection().getRangeAt(0);
        },
        getSelection: function() {
            return rangy.getSelection();
        },
        getRoot: function(){
            return this.root;
        },
       
        createRange: function(){
            return rangy.createRange();
        },
        hasSelection: function(){
            var sel = this.getSelection();
            var range = this.getRange();
            var hasSel = false;
            if (!sel || !range) {
                return hasSel;
            }
            
           
            if (parseInt(Env.ie, 10) < 9 || Env.opera) {
                if (range.text) {
                    hasSel = true;
                }
                if (range.html) {
                    hasSel = true;
                }
            } else {
                if (Env.webkit) {
                    if (sel + '' !== '') {
                        hasSel = true;
                    }
                } else {
                    if (sel && (sel.toString() !== '') && (sel !== undefined)) {
                        hasSel = true;
                    }
                }
            }
            return hasSel;

        },
        
        mergeNodes: function(selectionNodes){

        },
        setDefault: function () {
            
        },
        setContent: function(html){
            this.root.innerHTML = html;
        },
       
        setRng: function(rng) {
            var selection = this.getSelection();
            selection.removeAllRanges();
            selection.addRange(rng);
        },
       
        insertContent: function(html, plainText) {
           
           
           
            var self = this
                ,dom  = self.dom
                ,doc = self.getDoc()
                ,sel = self.getSelection()
                ,rng = self.getRange()
                ,wrapBlock
                ,walker
                ,frag
                ,node
                ,mark
                ,hasBlock
                ,isBlank
                ,lastNode
                ,nextSibling
                ,isLastBr
                ,preChild
                ,count = 0
                ,isBlock 
                ,cloneRng 
                ,parents
                ,current
                ,nextFrag
                ,endContainer
                ,rootBlock;

            function parseHtmlFilter(node) {
                if ( !hasBlock && dom.isBlock(node)) {
                    hasBlock = !0;
                }
                if (dom.isBlank(node)) {
                    dom.remove(node);
                    return false;
                }
                
               
                var html
                    ,regex = /(&nbsp;|\u3000| )+/g;
                if (1 === node.nodeType) {
                    html = node.innerHTML;
                    node.innerHTML = html.replace(regex," ");
                } else {
                    html = node.nodeValue.replace(/(\s|\u3000)+/g, " ");
                    node.nodeValue = html;
                }
            }
           
            rng.deleteContents();
           
            mark = dom.create('span', {
                id: '__lwb_tmp', 
                 'data-lwb-type': 'bookmark',
                 style: 'display:none'
            });
           
           
            frag = dom.parseHTMLToFrag(html, parseHtmlFilter);

           
            if (hasBlock) {
                rng.insertNode(mark);
                parents = dom.getParents(mark, self.getRoot());
                rootBlock = parents[parents.length - 2] || parents[parents.length - 1];

                walker = new TreeWalker(mark, rootBlock);
                walker.next(true);
                current = walker.current();
                if (current) {
                   
                    cloneRng = rng.cloneRange();
                    cloneRng.setStartBefore(current);
                    cloneRng.setEndAfter(rootBlock);
                    nextFrag = cloneRng.extractContents();
                    dom.insertAfter(nextFrag, rootBlock);
                    nextSibling = rootBlock.nextSibling;
                    if (dom.isBlank(nextSibling)) {
                        dom.setHTML(nextSibling, '<br data-lwb-bogus="1"/>')
                    }
                }
                preChild = rootBlock;

                var tmpNode;
               
                while (node = frag.firstChild) {
                    if (count) {
                       
                       
                       
                        if (3 === node.nodeType) {
                            tmpNode = dom.create('p', {
                                name : utils.getUnique()
                            });
                            dom.append(tmpNode, node);
                            dom.insertAfter(tmpNode, preChild);
                            node = tmpNode;
                        } else {
                            dom.insertAfter(node, preChild);
                        }
                        preChild = node;
                        
                    } else {
                       
                       
                        isLastBr = preChild.lastChild && 'br' === preChild.lastChild.nodeName.toLowerCase();
                        while (node.firstChild) {
                            if (!isLastBr) {
                                dom.append(preChild, node.firstChild);
                            } else {
                                dom.insertBefore(node.firstChild, preChild.lastChild);
                            }
                        }
                        if (1 === node.nodeType) {
                            dom.remove(node);
                        } else if(3 === node.nodeType) {
                            dom.append(preChild, node);
                        }
                    }
                    count++;
                }
                lastNode = preChild;
                if (count > 1 && nextSibling) {
                    if (3 === preChild.nodeType) {
                        dom.insertBefore(preChild, nextSibling.firstChild);
                    } else {
                        while (node = preChild.lastChild) {
                            dom.insertBefore(node, nextSibling.firstChild);
                            lastNode = node;
                        }
                        dom.remove(preChild);
                    }
                }
            } else {
                rng.insertNode(mark);
                dom.insertBefore(frag, mark);
                lastNode = mark.previousSibling;
            }
            try {
                dom.remove(mark);
            }catch(e){}
            
           
            if (lastNode) {
                rng = rng.cloneRange();
                rng.setStartAfter(lastNode);
                rng.collapse(true);
                sel.removeAllRanges();
                sel.addRange(rng);
                dom.scrollIntoView(lastNode);
            }
            
            self.trigger('contentChange', self);
        },
        setPoint: function(node, rng, start) {
            var walker = new TreeWalker(node, node);

            do {
               
                if (node.nodeType == 3 && trim(node.nodeValue).length !== 0) {
                    if (start) {
                        rng.setStart(node, 0);
                    } else {
                        rng.setEnd(node, node.nodeValue.length);
                    }

                    return;
                }

               
                if (node.nodeName == 'BR') {
                    if (start) {
                        rng.setStartBefore(node);
                    } else {
                        rng.setEndBefore(node);
                    }

                    return;
                }
            } while ((node = (start ? walker.next() : walker.prev())));
        },
       
        select: function(node, content){
            var t = this, dom = t.dom, rng = dom.createRng(), idx;


			if (node) {
			
				
			
                
				idx = dom.nodeIndex(node);
				rng.setStart(node.parentNode, idx);
				rng.setEnd(node.parentNode, idx + 1);

			
				if (content) {
					t.setPoint(node, rng, 1);
					t.setPoint(node, rng);
				}

				t.setRng(rng);
			}

			return node;
        },
       
       
        setCursor: function(node) {
            var t = this, dom = t.dom, rng = dom.createRng(), idx;

            if (node) {
                rng.setStart(node, 0);
                rng.setEnd(node, 0);
                t.setPoint(node,rng, 1);
                t.setRng(rng);
            }
            return node;

        },
       
        getPlainText: function() {
            var self = this
                ,root = self.root;
            var text = self.dom.getText(root);
            if (self.options.emptyTxt === text) {
                return '';
            } else {
                return text;
            }
        },
       
        getContent: function(tagList){
            var self = this;
            var html = self.root.innerHTML;
            
            var text = utils.trim(self.getPlainText());

            if (!text) {
                return '';
            }
           
            var args = {content:html};
            self.trigger('PreGetContent', args);
            var content = utils.filter(args.content,extend({
                'p':['name','class'],
                'strong':['class'],
                'em':['class'],
                'a':['href','class'],
                'img':['src','class'],
                'blockquote':['class'],
                'figure':['class'],
                'input':['value','type','class'],
                'textarea':['value','placeholder','class'],
                'figcaption':['class']
            },tagList || {}), true);
           
           
            self.trigger('GetContent', self);
            return content;
        }
	});

	cusEvt.mixTo(Editor);

    return Editor;
});

