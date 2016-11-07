"use strict";
const DropboxConnectionView = (function(){
	const defaults = {
		root : null, //required
		dataConnection : null, //required
		onReady : function(){},
		log : false
	};

	function create(options){
    	let connectionView = {};
		connectionView.options = Object.assign({}, defaults, options);
    	bind(connectionView);
    	connectionView.init();
    	return connectionView;
    }

	function bind(connectionView){
		connectionView.init = init.bind(connectionView);
		connectionView.cacheDom = cacheDom.bind(connectionView);
		connectionView.setBndr = setBndr.bind(connectionView);
		connectionView.initServices = initServices.bind(connectionView);
		connectionView.connectButtonClick = connectButtonClick.bind(connectionView);
		connectionView.forceNewButtonClick = forceNewButtonClick.bind(connectionView);
		connectionView.authenticateClick = authenticateClick.bind(connectionView);
		connectionView.tokenUpdated = tokenUpdated.bind(connectionView);
		connectionView.channelOpen = channelOpen.bind(connectionView);
		connectionView.log = log.bind(connectionView);

		connectionView.createOrConnectToSession = createOrConnectToSession.bind(connectionView);
		connectionView.createSession = createSession.bind(connectionView);
		connectionView.connectToSession = connectToSession.bind(connectionView);
		connectionView.createSessionFile = createSessionFile.bind(connectionView);
		connectionView.appendSessionFile = appendSessionFile.bind(connectionView);
		connectionView.sessionUpdateComplete = sessionUpdateComplete.bind(connectionView);
	}

	function cacheDom(){
		this.dom = {};
		this.dom.root = this.options.root;
	}

	function setBndr(){
		this.bndr = Bndr.create()
			.setTemplate(this.dom.root)
			.setModel({
				canConnect : true,
				state : "init",
				currentLog : this.dropbox.isAuthorized() ? "Not Initialized (Authorized)" : " Not Initialized (Not Authroized)",
				remoteToken : ""
			})
			.bindEvent(".connect-button", "click", this.connectButtonClick)
			.bindEvent(".authenticate", "click", this.authenticateClick)
			.bindEvent(".force-new-button", "click", this.forceNewButtonClick)
			.bindElement(".output", "currentLog")
			.bindAttributeExistenceReversed(".connect-button", "canConnect", "disabled");
		this.model = this.bndr.getBoundModel();

		this.bndr.attach();
	}

	function tokenUpdated(token){
		this.model.token = token;
		if(this.model.state === "new" || this.model.state == "renew"){
			this.log("Creating session token...");
			this.createSessionFile(token);
		}else if(this.model.state === "reply"){
			this.log("Creating session response token...");
			this.appendSessionFile(token);
		}
	}

	function connectButtonClick(){
		this.model.canConnect = false;
		this.dropbox.download("/session")
			.then(this.createOrConnectToSession)
			.catch(error);
	}

	function forceNewButtonClick(){
		this.log("Force creating new session...");
		this.model.state = "new";
		this.createSession();
	}

	function createOrConnectToSession(response){
		if(response.statusText.indexOf("path/not_found") !== -1){
			this.log("Session file not found. Creating...");
			this.model.state = "new";
			this.createSession();
			return;
		}

		this.log("File found. Checking timestamps...")
		let metadata = JSON.parse(response.headers.get("dropbox-api-result"));
		let clientModified = new Date(metadata.client_modified);
		let duration = new Date().getTime() - clientModified.getTime();

		if(duration > 30000){
			this.log("Session file is stale. Replacing...");
			this.model.state = "renew";
			this.createSession();
			return;
		}

		response.text().then(this.connectToSession);
	}

	function createSession(){
		this.options.dataConnection.connect();
	}

	function connectToSession(sessionData){
		this.model.state = "reply";
		this.log("Using found session");
		var lines = sessionData.split("\n");
		if(lines.length > 1){
			this.log("Found response token");
			this.model.remoteToken = lines[1];
			this.options.dataConnection.loadSdp(this.model.remoteToken);
		}else if(lines.length === 0){
			this.log("Session token missing from file, creating new session...");
			this.model.state = "renew";
			this.createSession();
		}else{
			this.log("found session token");
			this.model.remoteToken = lines[0];
			this.options.dataConnection.loadSdp(this.model.remoteToken);
		}
	}

	function createSessionFile(token){
		this.log("Uploading new session file...");
		this.dropbox.upload(token, { path: "/session", mode : "overwrite" })
					.then(this.sessionUpdateComplete);
	}

	function appendSessionFile(token){
		this.log("Appending session to file...");
		let newSession = this.model.remoteToken + "\n" + token;
		this.dropbox.upload(newSession, { path: "/session", mode : "overwrite" })
					.then(this.sessionUpdateComplete);
	}

	function sessionUpdateComplete(){
		this.log("Session file updated.");
		this.model.canConnect = true;
	}

	function error(){
		console.log(...arguments);
	}

	function log(){
		if(this.options.log){
			console.log(...arguments);
		}
		this.model.currentLog = arguments[0];
	}

	function loadButtonClick(){
		this.model.canCreate = false;
		this.model.canLoad = false;
	}

	function authenticateClick(){
		this.dropbox.authorize();
	}

	function channelOpen(){
		this.log("Data channel created!");
	}

	function initServices(){
		this.dropbox = Dropbox.create({
			appKey : "8nw5z8b6ske0yai"
		});
	}

	function init(){
		this.initServices();
		this.cacheDom();
		this.setBndr();
		this.options.dataConnection.addEventListener("onChannelOpen", this.channelOpen);
		this.options.dataConnection.addEventListener("onUpdateSdp", this.tokenUpdated);
	}

	return {
		create : create
	};
})();
