const DataConnection = (function(){

	function create(options){
		const defaults = {
			iceServers : [],
			log : false
		};
		const events = {
			onChannelOpen : [],
			onChannelMessage : [],
			onChannelClosed :[],
			onUpdateSdp : [],
		}

		var dataConnection = {};
		dataConnection.options = Object.assign({}, defaults, options);
		dataConnection.events = events;
		bind(dataConnection);
		dataConnection.init();
		return dataConnection;
	}

	function bind(dataConnection){
		dataConnection.init = init.bind(dataConnection);
		dataConnection.createDataChannel = createDataChannel.bind(dataConnection);
		dataConnection.connect = connect.bind(dataConnection);
		dataConnection.createOfferDone = createOfferDone.bind(dataConnection);
		dataConnection.offerLocalDescriptionDone = offerLocalDescriptionDone.bind(dataConnection);
		dataConnection.offerRemoteDescriptionDone = offerRemoteDescriptionDone.bind(dataConnection);
		dataConnection.createAnswerDone = createAnswerDone.bind(dataConnection);
		dataConnection.answerLocalDescriptionDone = answerLocalDescriptionDone.bind(dataConnection);
		dataConnection.answerRemoteDescriptionDone = answerRemoteDescriptionDone.bind(dataConnection);
		dataConnection.send = send.bind(dataConnection);
		dataConnection.error = error.bind(dataConnection);
		dataConnection.log = log.bind(dataConnection);

		dataConnection.updateSdp = updateSdp.bind(dataConnection);
		dataConnection.loadSdp = loadSdp.bind(dataConnection);
		dataConnection.addEventListener = addEventListener.bind(dataConnection);
	}

	function addEventListener(event, handler){
		this.events[event].push(handler);
		return this;
	}

	function connect(){
		this.createDataChannel();
		this.peerConnection.createOffer(this.createOfferDone, this.error);
	}

	function createOfferDone(offerSessionDescription){
		this.log("STEP 1 (initiator): creating offer");
		this.peerConnection.setLocalDescription(offerSessionDescription)
							.then(this.offerLocalDescriptionDone);
	}

	function offerLocalDescriptionDone(){
		this.log("STEP 2 (initiator): sending description");
		this.updateSdp();
	}

	function offerRemoteDescriptionDone(){
		this.log("STEP 2 (receiver): creating answer with our description");
		this.peerConnection.createAnswer(this.createAnswerDone, this.error);
	}

	function createAnswerDone(answerSessionDescription){
		this.peerConnection.setLocalDescription(answerSessionDescription, this.answerLocalDescriptionDone);
	}

	function answerLocalDescriptionDone(){
		this.log("STEP 3 (receiver): sending description");
		this.updateSdp();
	}

	function answerRemoteDescriptionDone(){
		this.log("STEP 4 (initiator): set remote description from answer");
	}

	function gotIceCandidate(e){
		if(!e.candidate){
			this.iceDone = true;
			this.log("Ice gathering finished");
		}
		this.updateSdp();
	}

	function createDataChannel(){
		this.dataChannel = this.peerConnection.createDataChannel("data", {
			reliable: true
		});

		this.dataChannel.onerror = error.bind(this);
		this.dataChannel.onopen = channelOpen.bind(this);
		this.dataChannel.onclose = channelClosed.bind(this);
		this.dataChannel.onmessage = channelMessage.bind(this);
		console.log("created data channel");
	}

	function gotDataChannel(e){
		this.dataChannel = e.channel;
		this.dataChannel.onerror = error.bind(this);
		this.dataChannel.onopen = channelOpen.bind(this);
		this.dataChannel.onclose = channelClosed.bind(this);
		this.dataChannel.onmessage = channelMessage.bind(this);
	}

	function send(message){
		if(typeof(message) != "object" || message instanceof ArrayBuffer || message instanceof Blob){
			this.dataChannel.send(message);
		}else{ //is some other object
			var json = JSON.stringify(message);
			this.dataChannel.send(json);
		}
	}

	function log(){
		if(this.options.log){
			console.log(...arguments);
		}
	}

	function error(e){
		console.error("error", e);
	}

	function updateSdp(){
		if(this.iceDone && this.peerConnection.localDescription.type){
			var token = SdpMinimizer.reduce(this.peerConnection.localDescription);
			this.events.onUpdateSdp.forEach(x => x(token));
		}
	}

	function loadSdp(token){
		let sdp = SdpMinimizer.expand(token);
		let description = new RTCSessionDescription(sdp);
		if(this.peerConnection.localDescription.sdp){
			console.log("STEP 3 (initiator): we got an answer");
			this.peerConnection.setRemoteDescription(description)
							   .then(this.answerRemoteDescriptionDone)
							   .catch(this.error);
		}else{
			console.log("STEP 1 (receiver): we got an offer, answering");
			this.peerConnection.setRemoteDescription(description)
							   .then(this.offerRemoteDescriptionDone)
							   .catch(this.error);
		}
	}

	function channelOpen(){
		console.log(`opened data channel ${this.dataChannel.id}`);
		this.events.onChannelOpen.forEach(x => x(this.dataChannel));
	}

	function channelClosed(){
		console.log(`closed data channel ${this.dataChannel.id}`);
		this.events.onChannelClosed.forEach(x => x(this.dataChannel));
	}

	function channelMessage(e){
		this.events.onChannelMessage.forEach(x => x(e.data));
	}

	function init(){
		this.peerConnection = new webkitRTCPeerConnection({
			iceServers: this.options.iceServers
		});

		this.peerConnection.ondatachannel = gotDataChannel.bind(this);
		this.peerConnection.onicecandidate = gotIceCandidate.bind(this);
	}

	return {
		create
	};

})();
