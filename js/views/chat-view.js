"use strict";
const ChatView = (function(){
	const defaults = {
		root : null, //required
		messageTemplate : null, //required
		dataConnection : null //required
	};

	function create(options){
    	let chatView = {};
		chatView.options = Object.assign({}, defaults, options);
    	bind(chatView);
    	chatView.init();
    	return chatView;
    }

	function bind(chatView){
		chatView.init = init.bind(chatView);
		chatView.cacheDom = cacheDom.bind(chatView);
		chatView.setBndr = setBndr.bind(chatView);
		chatView.attachSubviews = attachSubviews.bind(chatView);
		chatView.channelOpen = channelOpen.bind(chatView);

		chatView.send = send.bind(chatView);
		chatView.addMessage = addMessage.bind(chatView);
	}

	function cacheDom(){
		this.dom = {};
		this.dom.root = this.options.root;
		this.dom.received = this.dom.root.querySelector(".received");
	}

	function setBndr(){
		this.bndr = Bndr.create()
			.setTemplate(this.dom.root)
			.setModel({
				canSend : false,
				sendBuffer : null
			})
			.bindElementTwoWay(".text-input", "sendBuffer")
			.bindEvent(".send-button", "click", this.send)
			.bindAttributeExistenceReversed(".send", "canSend", "disabled");
		this.model = this.bndr.getBoundModel();

		this.bndr.attach();
	}

	function addMessage(message){
		message = JSON.parse(message);
		this.subviews.receivedView.addMessage(message);
	}

	function attachSubviews(){
		this.subviews = {};
		this.subviews.receivedView = ReceivedView.create({
			root : this.dom.received,
			messageTemplate : this.options.messageTemplate
		});
	}

	function channelOpen(){
		this.model.canSend = true;
	}

	function send(){
		this.options.dataConnection.send({
			content : this.model.sendBuffer
		});
	}

	function init(){
		this.cacheDom();
		this.setBndr();
		this.attachSubviews();
		this.options.dataConnection.addEventListener("onChannelOpen", this.channelOpen);
		this.options.dataConnection.addEventListener("onChannelMessage", this.addMessage);
	}

	return {
		create : create
	};
})();
