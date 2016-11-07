const AppView = (function(){

	const defaults = {
		root : document.body
	};

	function create(options){
		let appView = {};
		appView.options = Object.assign({}, defaults, options)
		bind(appView);
		appView.init();
		return appView;
	}

	function bind(appView){
		appView.installServiceWorker = installServiceWorker.bind(appView);
		appView.serviceWorkerInstalled = serviceWorkerInstalled.bind(appView);
		appView.serviceWorkerInstallFailed = serviceWorkerInstallFailed.bind(appView);
		appView.cacheDom = cacheDom.bind(appView);
		appView.setBndr = setBndr.bind(appView);
		appView.attachEvents = attachEvents.bind(appView);
		appView.attachSubviews = attachSubviews.bind(appView);
		appView.initServices = initServices.bind(appView);
		appView.init = init.bind(appView);
		appView.channelOpen = channelOpen.bind(appView);
	}

	function installServiceWorker(){
		if("serviceWorker" in navigator){
			navigator.serviceWorker.register("service-worker.js", {scope: "./"})
				.then(this.serviceWorkerInstalled)
				.catch(this.serviceWorkerInstallFailed);
		}
	}

	function serviceWorkerInstalled(registration){
		console.log("App Service registration successful with scope:", registration.scope);
	}

	function serviceWorkerInstallFailed(error){
		console.error("App Service failed to install", error);
	}

	function cacheDom(){
		this.dom = {};
		this.dom.root = this.options.root;
		this.dom.chat = this.dom.root.querySelector("#chat-panel");
		this.dom.messageTmpl = this.dom.root.querySelector("#message-tmpl");
		this.dom.connectionPanel = this.dom.root.querySelector("#connection-panel");
		this.dom.manualPanel = this.dom.root.querySelector("#manual-panel");
		this.dom.dropboxPanel = this.dom.root.querySelector("#dropbox-panel");
	}

	function setBndr(){
		this.bndr = Bndr.create()
			.setTemplate(this.dom.root)
			.setModel({
				hasConnection : false
			})
			.bindClass("#connection-panel", "hasConnection", "hidden")
			.bindClassReversed("#chat-panel", "hasConnection", "hidden")

		this.model = this.bndr.getBoundModel();
		this.bndr.attach();
	}

	function attachEvents(){
		this.dataConnection.addEventListener("onChannelOpen", this.channelOpen);
	}

	function initServices(){
		this.dataConnection = DataConnection.create({
			iceServers : [
				{ url : 'stun:stun.l.google.com:19302' }
			],
			log : true
		});
	}

	function attachSubviews(){
		this.subViews = {};
		this.subViews.chatView = ChatView.create({
			root : this.dom.chat,
			messageTemplate : this.dom.messageTmpl,
			dataConnection : this.dataConnection
		});
		this.subViews.connectionTabs = Tabs.create({
			root : this.dom.connectionPanel
		});
		this.subViews.manualConnectionView = ManualConnectionView.create({
			root : this.dom.manualPanel,
			dataConnection : this.dataConnection
		});
		this.subViews.manualConnectionView = DropboxConnectionView.create({
			root : this.dom.dropboxPanel,
			dataConnection : this.dataConnection,
			log : true
		});
	}

	function channelOpen(){
		this.model.hasConnection = true;
	}

	function channelMessage(message){
		this.subViews.receivedView.addMessage(JSON.parse(message));
	}

	function init(){
		//this.installServiceWorker();
		this.initServices();
		this.cacheDom();
		this.setBndr();
		this.attachSubviews();
		this.attachEvents();

		if(window.location.search.substr(1) === "debug"){
			var iframe = document.createElement("iframe");
			iframe.src = window.location.href.split("?")[0];
			document.body.appendChild(iframe);
			document.body.classList.add("debug");
		}
	}

	return {
		create : create
	};

})();
