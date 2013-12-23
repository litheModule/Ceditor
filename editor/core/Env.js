


define("Cedtory/editor/core/Env", function() {
	var nav = navigator, userAgent = nav.userAgent;
	var opera, webkit, ie, gecko, mac, iDevice, mobile;

	opera = window.opera && window.opera.buildNumber;
	webkit = /WebKit/.test(userAgent);
	ie = !webkit && !opera && (/MSIE/gi).test(userAgent) && (/Explorer/gi).test(nav.appName);
	ie = ie && /MSIE (\w+)\./.exec(userAgent)[1];
	gecko = !webkit && /Gecko/.test(userAgent);
	mac = userAgent.indexOf('Mac') != -1;
	iDevice = /(iPad|iPhone)/.test(userAgent);
	mobile  = /mobile|htc/ig.test(userAgent);



	var contentEditable = !iDevice || userAgent.match(/AppleWebKit\/(\d*)/)[1] >= 534;

	return {
		
		opera: opera,

		
		webkit: webkit,

		
		ie: ie,

		
		gecko: gecko,

		
		mac: mac,

		
		iOS: iDevice,
		
		mobile: mobile,

		
		contentEditable: contentEditable,

		
		transparentSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAA

		
		caretAfter: ie != 8,

		
		range: window.getSelection && "Range" in window,

		
		documentMode: ie ? (document.documentMode || 7) : 10
	};
});
