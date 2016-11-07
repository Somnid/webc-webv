"use strict";
const ManualConnectionView = (function(){
	const defaults = {
		root : null, //required
		dataConnection : null, //required
		onReady : function(){}
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
		connectionView.createButtonClick = createButtonClick.bind(connectionView);
		connectionView.loadButtonClick = loadButtonClick.bind(connectionView);
		connectionView.channelOpen = channelOpen.bind(connectionView);
		connectionView.tokenUpdated = tokenUpdated.bind(connectionView);
	}

	function cacheDom(){
		this.dom = {};
		this.dom.root = this.options.root;
	}

	function setBndr(){
		this.bndr = Bndr.create()
			.setTemplate(this.dom.root)
			.setModel({
				canCreate : true,
				canLoad : true,
				canSend : false,
				outputToken : "",
				inputToken : ""
			})
			.bindElement(".token-output", "outputToken")
			.bindElementTwoWay(".token-input", "inputToken")
			.bindEvent(".create-button", "click", this.createButtonClick)
			.bindEvent(".load-button", "click", this.loadButtonClick)
			.bindAttributeExistenceReversed(".create-button", "canCreate", "disabled")
			.bindAttributeExistenceReversed(".load-button", "canLoad", "disabled")
			.bindClassReversed(".token-container", "outputToken", "hidden");
		this.model = this.bndr.getBoundModel();

		this.bndr.attach();
	}

	function tokenUpdated(token){
		this.model.outputToken = token;
		this.model.canLoad = true;
	}

	function createButtonClick(){
		this.options.dataConnection.connect();
		this.model.canCreate = false;
		this.model.canLoad = false;
	}

	function loadButtonClick(){
		this.options.dataConnection.loadSdp(this.model.inputToken);
		this.model.inputToken = "";
		this.model.canCreate = false;
		this.model.canLoad = false;
	}

	function channelOpen(){
		this.model.status = "channel";
		this.model.canLoad = false;
		this.model.canSend = true;
		this.options.onReady(this.options.dataConnection);
	}

	function init(){
		this.cacheDom();
		this.setBndr();
		this.options.dataConnection.addEventListener("onChannelOpen", this.channelOpen);
		this.options.dataConnection.addEventListener("onUpdateSdp", this.tokenUpdated);
	}

	return {
		create : create
	};
})();
