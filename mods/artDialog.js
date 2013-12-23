define("Cedtory/mods/artDialog", function(require, exports, module) {
	var $ = require("Cedtory/mods/$");
	var Env = require("Cedtory/editor/core/Env");
	var mask = $('<div class="popMask"><a class="cancel" href="#" node-action="close"></a></div>');
	var ie6 = parseInt(Env.ie, 10) === 6;
	var hasMask;
	var GlobalDialog;
	var CustomDialog;
	var cbs = [];
	var substitute = function(str, o, regexp) {
		return str.replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name) {
			if (match.charAt(0) === '\\') {
				return match.slice(1);
			}
			return (o[name] === undefined) ? '': o[name];
		});
	};

	var Dialog_template = '<div class="con">\
    <div class="info">\
    <strong>{title}</strong>\
    <p>{content}</p>\
    </div>\
    <div class="btn"><a href="javascript:;" node-action="close">{btnText}</a></div>\
    </div>';

	function hiddenScroll() {
		$('html,body').css('overflow', 'hidden');
	}

	function showScroll() {
		$('html,body').css('overflow', '');
	}

	function initGlobal() {
		GlobalDialog = $('<div class="popWin" style="z-index:10002;"></div>');
		$('body').prepend(GlobalDialog);
		GlobalDialog.on('click', '[node-action=close]', close);
	}

	$(window).on('resize', function() {
		setGlobalPostion();
	});

	function initMask() {
		$('body').prepend(mask);
		mask.on('click', '[node-action=close]', close);
		mask.css({
			position: ie6 ? 'absolute': 'fixed',
			height: ie6 ? document.body.offsetHeight : '100%',
			top: 0,
			left: 0,
			'z-index': 10001
		});
		hasMask = true;
	}

	function setGlobalPostion() {
		var W = document.body.clientWidth;
		var H = (document.documentElement.scrollTop || document.body.scrollTop) + 230;
		var style = {
			'position':'absolute',
			'top': H,
			'left': (W - 462) / 2
		};
		if (GlobalDialog) GlobalDialog.css(style);
	}

	var alert = function(title, content, btnText, cb) {
		cbs = [];
		if (!GlobalDialog) initGlobal();
		if (CustomDialog) {
			CustomDialog.hide();
		}
		var tpl = substitute(Dialog_template, {
			title: title,
			content: content,
			btnText: btnText || '确&nbsp;定'
		});
		cbs.push(cb);
		setGlobalPostion();
		hiddenScroll();
		GlobalDialog.html(tpl).show();
		if (!hasMask) initMask();
		mask.show();
		mask.find('[node-action=close]').show();
		return GlobalDialog;
	};

	var custom = function(html, cb) {
		cbs = [];
		cbs.push(cb);
		if (!GlobalDialog) initGlobal();
		if (CustomDialog) {
			CustomDialog.hide();
		}
		setGlobalPostion();
		hiddenScroll();
		var layer = $('<div class="con"><div class="info"></div></div>').find('.info').append(html);
		GlobalDialog.html(layer).show();
		if (!hasMask) initMask();
		mask.show();
		mask.find('[node-action=close]').hide();
		return GlobalDialog;
	};

	var dialog = function(html, cb) {
		cbs = [];
		cbs.push(cb);
		if (GlobalDialog) GlobalDialog.hide();
		if (CustomDialog) CustomDialog.remove();
		CustomDialog = $(html);
		$('.cwbEditor').prepend(CustomDialog);
		CustomDialog.on('click', '[node-action=close]', close);
		hiddenScroll();
		CustomDialog.show();
		if (!hasMask) initMask();
		mask.show();
		mask.find('[node-action=close]').hide();
		return CustomDialog;
	};

	function close(e) {
		if (GlobalDialog) GlobalDialog.hide();
		if (CustomDialog) CustomDialog.hide();
		if (mask) mask.hide();
		showScroll();
		e.preventDefault();
		var cb = cbs.shift();
		if (cb) cb();
	}

	module.exports = {
		alert: alert,
		dialog: dialog,
		custom: custom
	};
});

