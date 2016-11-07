"use strict";
var Utilities = (function(){

	function getWebSocketUrl(){
		var url = window.location.href;
		return url.replace("http://", "ws://");
	}

	return {
		getWebSocketUrl
	};

})();
