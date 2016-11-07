const Dropbox = (function(){

	const defaults = {
		appKey : "" //required
	};

	function create(options){
		var dropbox = {};
		dropbox.options = Object.assign({}, defaults, options);
		bind(dropbox);
		dropbox.init();
		return dropbox;
	}

	function bind(dropbox){
		dropbox.init = init.bind(dropbox);
		dropbox.checkToken = checkToken.bind(dropbox);
		dropbox.authorize = authorize.bind(dropbox);
		dropbox.isAuthorized = isAuthorized.bind(dropbox);
		dropbox.download = download.bind(dropbox);
		dropbox.upload = upload.bind(dropbox);
	}

	function authorize(){
		window.location.href = `https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=${this.options.appKey}&redirect_uri=${window.location.href}`;
	}

	function isAuthorized(){
		return localStorage.getItem("access_token") && localStorage.getItem("uid");
	}

	function checkToken(){
		var params = new URLSearchParams(window.location.hash.substr(1));
		if(params.has("access_token")){
			let token = params.get("access_token");
			let uid = params.get("uid");
			localStorage.setItem("access_token", token);
			localStorage.setItem("uid", uid);
			this.token = token;
			this.uid = uid;
		}else{
			this.token = localStorage.getItem("access_token");
			this.uid = localStorage.getItem("uid");
		}
	}

	function download(path){
		const arg = {
			path : path
		};
		return fetch("https://content.dropboxapi.com/2/files/download", {
			headers : new Headers({
				"Authorization" : `Bearer ${this.token}`,
				"Dropbox-API-Arg" : JSON.stringify(arg)
			}),
			method : "POST"
		});
	}

	function upload(content, options){
		if(options.mode){
			options.mode = { ".tag" : options.mode };
		}
		if(typeof(content) === "string"){
			content = stringToArrayBuffer(content);
		}
		return fetch("https://content.dropboxapi.com/2/files/upload", {
			headers : new Headers({
				"Authorization" : `Bearer ${this.token}`,
				"Dropbox-API-Arg" : JSON.stringify(options),
				"Content-Type" : "application/octet-stream"
			}),
			method : "POST",
			body : content
		});
	}

	function stringToArrayBuffer(string){
		var arrayBuffer = new ArrayBuffer(string.length);
		var uInt8Array = new Uint8Array(arrayBuffer);

		for (var i = 0; i < string.length; i++) {
			uInt8Array[i] = string.charCodeAt(i);
		}

		return arrayBuffer;
	}

	function init(){
		this.checkToken();
	}

	return {
		create : create
	};

})();
