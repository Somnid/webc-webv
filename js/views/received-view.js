"use strict";
const ReceivedView = (function(){
	const defaults = {
		root : null, //required
		messageTemplate : null //required
	};

	function create(options){
    	let receivedView = {};
		receivedView.options = Object.assign({}, defaults, options);
    	bind(receivedView);
    	receivedView.init();
    	return receivedView;
    }

	function bind(receivedView){
		receivedView.init = init.bind(receivedView);
		receivedView.cacheDom = cacheDom.bind(receivedView);
		receivedView.setBndr = setBndr.bind(receivedView);
		receivedView.addMessage = addMessage.bind(receivedView);
	}

	function cacheDom(){
		this.dom = {};
		this.dom.root = this.options.root;
	}

	function setBndr(){
		this.bndr = Bndr.create()
			.setTemplate(this.options.messageTemplate)
			.setModel([])
			.bindElement(".content", "content");
		this.model = this.bndr.getBoundModel();

		this.bndr.attachTo(this.dom.root);
	}

	function addMessage(message){
		this.model.push(message);
	}

	function attachSubviews(){
		this.subviews.receivedView = ReceivedView.create({
			root : this.dom.recevied,
			messageTemplate : this.options.messageTemplate
		});
	}

	function init(){
		this.cacheDom();
		this.setBndr();
	}

	return {
		create : create
	};
})();
